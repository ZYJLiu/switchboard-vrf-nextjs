import { Program, AnchorProvider, Idl, setProvider } from "@coral-xyz/anchor"
import { IDL, Vrf } from "../idl/vrf"
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js"

// Create a connection to the devnet cluster
export const connection = new Connection(clusterApiUrl("devnet"), {
  commitment: "confirmed",
})

const MockWallet = {
  publicKey: Keypair.generate().publicKey,
  signTransaction: () => Promise.reject(),
  signAllTransactions: () => Promise.reject(),
}

// Create a placeholder AnchorWallet to set up AnchorProvider without connecting a wallet
const wallet = MockWallet

// Create an Anchor provider
export const provider = new AnchorProvider(connection, wallet, {})

// Set the provider as the default provider
setProvider(provider)

const programId = new PublicKey("FXWi8jVNNcyCARo6JckMFPiqzcMhPo585NirdPvD2hva")

export const program = new Program(
  IDL as Idl,
  programId
) as unknown as Program<Vrf>

// SOL vault PDA for game
export const [solVaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("VAULT")],
  program.programId
)
