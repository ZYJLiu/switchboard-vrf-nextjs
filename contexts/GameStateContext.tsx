import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { AccountInfo, PublicKey } from "@solana/web3.js"
import { program, connection } from "@/utils/anchor"
import * as anchor from "@coral-xyz/anchor"
import { useBalance } from "@/contexts/BalanceContext"

// Define the structure of the GameStateHome context state
type GameStateContextType = {
  vrfClientKey: PublicKey | undefined
  vrfClientState: any
  isLoading: boolean
  message: string
}

// Create the context with default values
const GameStateContext = createContext<GameStateContextType>({
  vrfClientKey: undefined,
  vrfClientState: undefined,
  isLoading: false,
  message: "Play the game!",
})

// Custom hook to use the GameStateHome context
export const useGameState = () => useContext(GameStateContext)

// Provider component to wrap around components that need access to the context
export const GameStateProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { publicKey } = useWallet()
  const { fetchBalance } = useBalance()

  const [vrfClientKey, setVrfClientKey] = useState<PublicKey | undefined>()
  const [vrfClientState, setVrfClientState] = useState<any>()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("Play the game!")

  const reset = () => {
    setVrfClientKey(undefined)
    setVrfClientState(undefined)
    setIsLoading(false)
    setMessage("Play the game!")
  }

  const fetchClientState = async (clientKey: PublicKey) => {
    const clientState = await program.account.gameState.fetch(clientKey)
    console.log(clientState)
    setVrfClientState(clientState)
  }

  const setup = useCallback(async () => {
    if (!publicKey) {
      reset()
      return
    }

    const [vrfClientKey] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("GAME"), publicKey.toBytes()],
      program.programId
    )
    setVrfClientKey(vrfClientKey)

    try {
      await fetchClientState(vrfClientKey)
    } catch (error) {
      console.log(error)
    }
  }, [publicKey])

  useEffect(() => {
    setup()
  }, [setup])

  useEffect(() => {
    if (!vrfClientKey) return

    const handleAccountChange = async (accountInfo: AccountInfo<Buffer>) => {
      let vrfClientState
      try {
        vrfClientState = program.coder.accounts.decode(
          "gameState",
          accountInfo.data
        )
      } catch (error) {
        console.log(error)
      }

      if (!vrfClientState) {
        setVrfClientState(undefined)
        setMessage("Play the game!")
        return
      }

      if (vrfClientState.result == 0 && vrfClientState.guess == 0) {
        setVrfClientState(vrfClientState)
      } else if (vrfClientState.result == 0) {
        setIsLoading(true)
      } else {
        setIsLoading(false)
        setMessage(
          vrfClientState.result == vrfClientState.guess
            ? "You won!"
            : "You lost!"
        )
        await fetchBalance()
      }
    }

    const subscriptionId = connection.onAccountChange(
      vrfClientKey,
      handleAccountChange
    )

    return () => {
      // Unsubscribe from the account change subscription when the component unmounts
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [vrfClientKey, vrfClientState])

  return (
    <GameStateContext.Provider
      value={{
        vrfClientKey,
        vrfClientState,
        isLoading,
        message,
      }}
    >
      {children}
    </GameStateContext.Provider>
  )
}
