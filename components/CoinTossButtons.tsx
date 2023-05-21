import { Button, HStack } from "@chakra-ui/react"
import {
  LAMPORTS_PER_SOL,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js"
import * as sbv2 from "@switchboard-xyz/solana.js"
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token"
import { useWallet } from "@solana/wallet-adapter-react"
import { program, connection, solVaultPDA } from "@/utils/anchor"
import {
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token"
import { useGameState } from "@/contexts/GameStateContext"
import { useCallback, useMemo, useState } from "react"
import { useSwitchboard } from "@/contexts/SwitchBoardContext"

const CoinTossButtons = () => {
  const { publicKey, sendTransaction } = useWallet()
  const { gameStatePDA, gameStateData, isLoading } = useGameState()
  const { switchboard } = useSwitchboard()
  const [loadingButton, setLoadingButton] = useState(0)

  const escrowWrappedSOLTokenAccount = useMemo(
    () => getAssociatedTokenAddressSync(NATIVE_MINT, gameStateData.vrf),
    [gameStateData]
  )

  const playerWrappedSOLTokenAccount = useMemo(
    () => getAssociatedTokenAddressSync(NATIVE_MINT, publicKey!),
    [publicKey]
  )

  const handleClick = useCallback(
    async (guess: number) => {
      if (!switchboard || !publicKey || !gameStatePDA) return

      setLoadingButton(guess)

      try {
        // derive the existing VRF permission account using the seeds
        const [permissionAccount, permissionBump] =
          sbv2.PermissionAccount.fromSeed(
            switchboard.program,
            switchboard.queueAccountData.authority,
            switchboard.queueAccount.publicKey,
            gameStateData.vrf
          )

        let instructions: TransactionInstruction[] = []

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
        const instruction = await program.methods
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
            queueAuthority: switchboard.queueAccountData.authority,
            dataBuffer: switchboard.queueAccountData.dataBuffer,
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

        const tx = new Transaction().add(...instructions, instruction)

        const txSig = await sendTransaction(tx, connection)
        console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`)
      } catch (error) {
        console.log(error)
      } finally {
        setLoadingButton(0) // Clear the loadingButton regardless of success/failure.
      }
    },
    [publicKey, gameStatePDA, gameStateData, switchboard]
  )

  return (
    <HStack>
      <Button
        width="75px"
        isLoading={loadingButton === 1}
        isDisabled={isLoading || !switchboard}
        onClick={() => handleClick(1)}
      >
        Heads
      </Button>
      <Button
        width="75px"
        isLoading={loadingButton === 2}
        isDisabled={isLoading || !switchboard}
        onClick={() => handleClick(2)}
      >
        Tails
      </Button>
    </HStack>
  )
}

export default CoinTossButtons
