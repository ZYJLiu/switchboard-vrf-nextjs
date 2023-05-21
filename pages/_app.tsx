import { ChakraProvider } from "@chakra-ui/react"
import WalletContextProvider from "../contexts/WalletContextProvider"
import type { AppProps } from "next/app"
import { BalanceProvider } from "@/contexts/BalanceContext"
import { GameStateProvider } from "@/contexts/GameStateContext"
import { SwitchboardProvider } from "@/contexts/SwitchBoardContext"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <WalletContextProvider>
        <BalanceProvider>
          <SwitchboardProvider>
            <GameStateProvider>
              <Component {...pageProps} />
            </GameStateProvider>
          </SwitchboardProvider>
        </BalanceProvider>
      </WalletContextProvider>
    </ChakraProvider>
  )
}
