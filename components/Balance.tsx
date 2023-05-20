import { Text } from "@chakra-ui/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useBalance } from "@/contexts/BalanceContext"

const Balance = () => {
  const { publicKey } = useWallet()
  const { vaultBalance, playerBalance } = useBalance()

  return (
    <>
      {publicKey && (
        <>
          <Text>Vault Balance: {vaultBalance}</Text>
          <Text>Player Balance: {playerBalance}</Text>
        </>
      )}
    </>
  )
}

export default Balance
