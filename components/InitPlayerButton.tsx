import React, { useEffect, useState } from "react"
import { Button } from "@chakra-ui/react"
import { BorshInstructionCoder } from "@coral-xyz/anchor"
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import * as sbv2 from "@switchboard-xyz/solana.js"
import { useWallet } from "@solana/wallet-adapter-react"
import { useSwitchboard } from "@/hooks/useSwitchBoard"
import { program, solVaultPDA, connection } from "@/utils/anchor"
import { useGameState } from "@/contexts/GameStateContext"

const InitPlayerButton = () => {
  const { publicKey, sendTransaction } = useWallet()
  const { gameStatePDA } = useGameState()
  const switchboard = useSwitchboard()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    setIsInitializing(!switchboard)
  }, [switchboard])

  const handleClick = async () => {
    if (!switchboard || !publicKey || !gameStatePDA) return

    setIsLoading(true)

    try {
      const vrfAccountKeypair = Keypair.generate()

      // const [gameStatePDA] = PublicKey.findProgramAddressSync(
      //   [Buffer.from("GAME"), publicKey.toBytes()],
      //   program.programId
      // )

      const vrfIxCoder = new BorshInstructionCoder(program.idl)

      const vrfCallbackInstruction: sbv2.Callback = {
        programId: program.programId,
        accounts: [
          { pubkey: publicKey, isSigner: false, isWritable: true },
          { pubkey: solVaultPDA, isSigner: false, isWritable: true },
          { pubkey: gameStatePDA, isSigner: false, isWritable: true },
          {
            pubkey: vrfAccountKeypair.publicKey,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        ixData: vrfIxCoder.encode("consumeRandomness", ""),
      }

      const [VrfAccount, TransactionObject] =
        await sbv2.VrfAccount.createInstructions(
          switchboard?.program,
          publicKey,
          {
            vrfKeypair: vrfAccountKeypair,
            queueAccount: switchboard.queueAccount,
            callback: vrfCallbackInstruction,
            authority: gameStatePDA,
          }
        )

      const [PermissionAccount, TransactionObject2] =
        sbv2.PermissionAccount.createInstruction(
          switchboard.program,
          publicKey,
          {
            granter: switchboard.queueAccount.publicKey,
            grantee: vrfAccountKeypair.publicKey,
            authority: switchboard.queueAccountData.authority,
          }
        )

      const ix = await program.methods
        .initialize()
        .accounts({
          player: publicKey,
          gameState: gameStatePDA,
          vrf: VrfAccount.publicKey,
        })
        .instruction()

      const tx = new Transaction().add(
        ...TransactionObject.ixns,
        ...TransactionObject2.ixns,
        ix
      )

      const txSig = await sendTransaction(tx, connection, {
        signers: [vrfAccountKeypair],
      })

      console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false) // set loading state back to false
    }
  }

  return (
    <Button
      onClick={handleClick}
      isLoading={isLoading || isInitializing}
      loadingText={isInitializing ? "Loading..." : null}
    >
      Init Player
    </Button>
  )
}

export default InitPlayerButton
