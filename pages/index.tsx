import { VStack, Box, Flex, Spacer, Heading, Text } from "@chakra-ui/react"
import WalletMultiButton from "@/components/WalletMultiButton"
import Balance from "@/components/Balance"
import InitPlayerButton from "@/components/InitPlayerButton"
import CloseButton from "@/components/CloseButton"
import CoinTossButtons from "@/components/CoinTossButtons"
import { useGameState } from "@/contexts/GameStateContext"
import { useWallet } from "@solana/wallet-adapter-react"

export default function Home() {
  const { isLoading, message, vrfClientState } = useGameState()
  const { publicKey } = useWallet()

  return (
    <Box>
      <Flex px={4} py={4}>
        <Spacer />
        <WalletMultiButton />
      </Flex>

      <VStack justifyContent="center" alignItems="center" height="75vh">
        <VStack>
          <Heading>Coin Flip</Heading>

          {publicKey ? (
            <>
              {isLoading ? (
                <Text>Waiting for Oracle to respond...</Text>
              ) : (
                <Text>{message}</Text>
              )}
              {vrfClientState ? (
                <>
                  <Balance />
                  <CoinTossButtons />
                  <CloseButton />
                </>
              ) : (
                <InitPlayerButton />
              )}
            </>
          ) : (
            <Text>Connect your wallet to play</Text>
          )}
        </VStack>
      </VStack>
    </Box>
  )
}
