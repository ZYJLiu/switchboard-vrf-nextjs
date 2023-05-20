import { Button, HStack } from "@chakra-ui/react"
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js"
import * as sbv2 from "@switchboard-xyz/solana.js"
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token"
import { useWallet } from "@solana/wallet-adapter-react"
import { useSwitchboard } from "@/hooks/useSwitchBoard"
import { program, provider, connection, solVaultPDA } from "@/utils/anchor"
import {
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from "@solana/spl-token"

const CoinTossButtons = () => {
  const { publicKey, sendTransaction } = useWallet()
  const switchboard = useSwitchboard()

  const handleClick = async (guess: number) => {
    console.log("click")
    if (!switchboard || !publicKey) return

    const [vrfClientKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("GAME"), publicKey.toBytes()],
      program.programId
    )

    const vrfClientState = await program.account.gameState.fetch(vrfClientKey)

    const [vrfAccount, vrfAccountData] = await sbv2.VrfAccount.load(
      switchboard!.program,
      vrfClientState.vrf
    )

    const queueAccountData = await switchboard.queueAccount.loadData()

    // derive the existing VRF permission account using the seeds
    const [permissionAccount, permissionBump] = sbv2.PermissionAccount.fromSeed(
      switchboard.program,
      queueAccountData.authority,
      switchboard.queueAccount.publicKey,
      vrfAccount.publicKey
    )

    // 0.002 wSOL fee for requesting randomness
    // const [payerTokenWallet] =
    //   await switchboard.program.mint.getOrCreateWrappedUser(publicKey, {
    //     fundUpTo: 0.002,
    //   })

    let instructions: TransactionInstruction[] = []

    const wrappedTokenAccount = await getAssociatedTokenAddress(
      NATIVE_MINT,
      publicKey
    )

    const account = await connection.getAccountInfo(wrappedTokenAccount)
    if (!account) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          publicKey,
          wrappedTokenAccount,
          publicKey,
          NATIVE_MINT
        )
      )
    }

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: wrappedTokenAccount,
        lamports: 0.002 * LAMPORTS_PER_SOL,
      })
    )

    instructions.push(createSyncNativeInstruction(wrappedTokenAccount))

    // Request randomness
    const ix = await program.methods
      .requestRandomness(
        permissionBump,
        switchboard.program.programState.bump,
        guess
      )
      .accounts({
        solVault: solVaultPDA,
        gameState: vrfClientKey,
        vrf: vrfAccount.publicKey,
        oracleQueue: switchboard.queueAccount.publicKey,
        queueAuthority: queueAccountData.authority,
        dataBuffer: queueAccountData.dataBuffer,
        permission: permissionAccount.publicKey,
        escrow: vrfAccountData.escrow,
        programState: switchboard.program.programState.publicKey,
        switchboardProgram: switchboard.program.programId,
        payerWallet: wrappedTokenAccount,
        player: publicKey,
        recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    const tx = new Transaction().add(...instructions, ix)

    const txSig = await sendTransaction(tx, connection)
    console.log(txSig)

    const balance = await provider.connection.getBalance(solVaultPDA)
    console.log(`Sol Vault Balance: ${balance}`)
  }

  return (
    <HStack>
      <Button width="75px" onClick={() => handleClick(1)}>
        Heads
      </Button>
      <Button width="75px" onClick={() => handleClick(2)}>
        Tails
      </Button>
    </HStack>
  )
}

export default CoinTossButtons
