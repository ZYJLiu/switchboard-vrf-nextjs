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
import { program, connection, solVaultPDA } from "@/utils/anchor"
import {
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from "@solana/spl-token"
import { useGameState } from "@/contexts/GameStateContext"
import { useEffect, useState } from "react"

const CoinTossButtons = () => {
  const { publicKey, sendTransaction } = useWallet()
  const { gameStatePDA, gameStateData, isLoading } = useGameState()
  const switchboard = useSwitchboard()
  const [loadingButton, setLoadingButton] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    setIsInitializing(!switchboard)
  }, [switchboard])

  const handleClick = async (guess: number) => {
    console.log("switchboard", switchboard)
    console.log("publicKey", publicKey)
    console.log("gameStatePDA", gameStatePDA)
    if (!switchboard || !publicKey || !gameStatePDA) return

    setLoadingButton(guess)

    try {
      // const [gameStatePDA] = PublicKey.findProgramAddressSync(
      //   [Buffer.from("GAME"), publicKey.toBytes()],
      //   program.programId
      // )

      // const gameStateData = await program.account.gameState.fetch(gameStatePDA)

      // const [vrfAccount, vrfAccountData] = await sbv2.VrfAccount.load(
      //   switchboard.program,
      //   gameStateData.vrf
      // )

      // 0.002 wSOL fee for requesting randomness
      // const [payerTokenWallet] =
      //   await switchboard.program.mint.getOrCreateWrappedUser(publicKey, {
      //     fundUpTo: 0.002,
      //   })

      const queueAccountData = await switchboard.queueAccount.loadData()

      // derive the existing VRF permission account using the seeds
      const [permissionAccount, permissionBump] =
        sbv2.PermissionAccount.fromSeed(
          switchboard.program,
          queueAccountData.authority,
          switchboard.queueAccount.publicKey,
          gameStateData.vrf
        )

      let instructions: TransactionInstruction[] = []

      const escrowWrappedSOLTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        gameStateData.vrf
      )

      const playerWrappedSOLTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        publicKey
      )

      const account = await connection.getAccountInfo(
        playerWrappedSOLTokenAccount
      )
      if (!account) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            playerWrappedSOLTokenAccount,
            publicKey,
            NATIVE_MINT
          )
        )
      }

      instructions.push(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: playerWrappedSOLTokenAccount,
          lamports: 0.002 * LAMPORTS_PER_SOL,
        })
      )

      instructions.push(
        createSyncNativeInstruction(playerWrappedSOLTokenAccount)
      )

      // Request randomness
      const ix = await program.methods
        .requestRandomness(
          permissionBump,
          switchboard.program.programState.bump,
          guess
        )
        .accounts({
          solVault: solVaultPDA,
          gameState: gameStatePDA,
          vrf: gameStateData.vrf,
          oracleQueue: switchboard.queueAccount.publicKey,
          queueAuthority: queueAccountData.authority,
          dataBuffer: queueAccountData.dataBuffer,
          permission: permissionAccount.publicKey,
          escrow: escrowWrappedSOLTokenAccount,
          programState: switchboard.program.programState.publicKey,
          switchboardProgram: switchboard.program.programId,
          payerWallet: playerWrappedSOLTokenAccount,
          player: publicKey,
          recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()

      const tx = new Transaction().add(...instructions, ix)

      const txSig = await sendTransaction(tx, connection)
      console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`)
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingButton(0) // Clear the loadingButton regardless of success/failure.
    }
  }

  return (
    <HStack>
      <Button
        width="75px"
        isLoading={loadingButton === 1}
        isDisabled={isLoading || isInitializing}
        onClick={() => handleClick(1)}
      >
        Heads
      </Button>
      <Button
        width="75px"
        isLoading={loadingButton === 2}
        isDisabled={isLoading || isInitializing}
        onClick={() => handleClick(2)}
      >
        Tails
      </Button>
    </HStack>
  )
}

export default CoinTossButtons
