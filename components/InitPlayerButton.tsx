import React, { useState } from "react"
import { Button } from "@chakra-ui/react"
import { BorshInstructionCoder } from "@coral-xyz/anchor"
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import * as sbv2 from "@switchboard-xyz/solana.js"
import { useWallet } from "@solana/wallet-adapter-react"
import { useSwitchboard } from "@/hooks/useSwitchBoard"
import { program, solVaultPDA, connection } from "@/utils/anchor"

const InitPlayerButton = () => {
  const { publicKey, sendTransaction } = useWallet()
  const switchboard = useSwitchboard()

  const handleClick = async () => {
    if (!switchboard || !publicKey) return

    const vrfKeypair = Keypair.generate()

    const [vrfClientKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("GAME"), publicKey.toBytes()],
      program.programId
    )

    const vrfIxCoder = new BorshInstructionCoder(program.idl)

    const vrfClientCallback: sbv2.Callback = {
      programId: program.programId,
      accounts: [
        { pubkey: publicKey, isSigner: false, isWritable: true },
        { pubkey: solVaultPDA, isSigner: false, isWritable: true },
        { pubkey: vrfClientKey, isSigner: false, isWritable: true },
        { pubkey: vrfKeypair.publicKey, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      ixData: vrfIxCoder.encode("consumeRandomness", ""),
    }

    const [VrfAccount, TransactionObject] =
      await sbv2.VrfAccount.createInstructions(
        switchboard?.program,
        publicKey,
        {
          vrfKeypair: vrfKeypair,
          queueAccount: switchboard.queueAccount,
          callback: vrfClientCallback,
          authority: vrfClientKey,
        }
      )

    const [PermissionAccount, TransactionObject2] =
      sbv2.PermissionAccount.createInstruction(switchboard.program, publicKey, {
        granter: switchboard.queueAccount.publicKey,
        grantee: vrfKeypair.publicKey,
        authority: switchboard.queueAccountData.authority,
      })

    const ix = await program.methods
      .initialize()
      .accounts({
        player: publicKey,
        gameState: vrfClientKey,
        vrf: VrfAccount.publicKey,
      })
      .instruction()

    const tx = new Transaction().add(
      ...TransactionObject.ixns,
      ...TransactionObject2.ixns,
      ix
    )

    const txSig = await sendTransaction(tx, connection, {
      signers: [vrfKeypair],
    })
    console.log(txSig)
  }

  return <Button onClick={handleClick}>Init Player</Button>
}

export default InitPlayerButton
