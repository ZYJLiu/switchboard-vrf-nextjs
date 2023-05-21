import { VStack, Box, Flex, Spacer, Heading, Text } from "@chakra-ui/react"
import WalletMultiButton from "@/components/WalletMultiButton"
import Balance from "@/components/Balance"
import InitPlayerButton from "@/components/InitPlayerButton"
import CloseButton from "@/components/CloseButton"
import CoinTossButtons from "@/components/CoinTossButtons"
import { useGameState } from "@/contexts/GameStateContext"
import { useWallet } from "@solana/wallet-adapter-react"
import { BeatLoader, PacmanLoader } from "react-spinners"

export default function Home() {
  const { isLoading, message, gameStateData } = useGameState()
  const { publicKey } = useWallet()

  const renderMessage = () =>
    isLoading ? (
      <VStack>
        <Text>Waiting for Oracle to respond...</Text>
        <PacmanLoader size={24} speedMultiplier={2.5} />
        <BeatLoader size={20} />
      </VStack>
    ) : (
      <Text>{message}</Text>
    )

  const renderGameState = () => {
    if (gameStateData) {
      return (
        <>
          <Balance />
          <CoinTossButtons />
          <CloseButton />
        </>
      )
    } else {
      return <InitPlayerButton />
    }
  }

  const renderGame = () => {
    if (publicKey) {
      return (
        <>
          {renderMessage()}
          {renderGameState()}
        </>
      )
    } else {
      return <Text>Connect your wallet to play</Text>
    }
  }

  return (
    <Box>
      <Flex px={4} py={4}>
        <Spacer />
        <WalletMultiButton />
      </Flex>

      <VStack justifyContent="center" alignItems="center" height="75vh">
        <VStack>
          <Heading>Coin Flip</Heading>
          {renderGame()}
        </VStack>
      </VStack>
    </Box>
  )
}
