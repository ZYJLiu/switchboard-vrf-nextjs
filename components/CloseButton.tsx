import React from "react"
import { Button } from "@chakra-ui/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { program, connection } from "@/utils/anchor"
import { PublicKey } from "@solana/web3.js"

const CloseButton = () => {
  const { publicKey, sendTransaction } = useWallet()

  const handleClick = async () => {
    if (!publicKey) return

    const [vrfClientKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("GAME"), publicKey.toBytes()],
      program.programId
    )

    const tx = await program.methods
      .close()
      .accounts({
        player: publicKey,
        gameState: vrfClientKey,
      })
      .transaction()

    const txSig = await sendTransaction(tx, connection)
    console.log("Your transaction signature", txSig)
  }

  return <Button onClick={handleClick}>Close</Button>
}

export default CloseButton
