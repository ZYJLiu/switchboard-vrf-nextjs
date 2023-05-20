import {
  BorshInstructionCoder,
  Program,
  AnchorProvider,
  Idl,
  setProvider,
} from "@coral-xyz/anchor"
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet"
import { IDL, Vrf } from "../idl/vrf"
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js"
import * as sbv2 from "@switchboard-xyz/solana.js"

// Create a connection to the devnet cluster
export const connection = new Connection(clusterApiUrl("devnet"), {
  commitment: "confirmed",
})

// Create a placeholder wallet to set up AnchorProvider
const wallet = new NodeWallet(Keypair.generate())

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

// // Keypair used to create new VRF account during setup
// const vrfSecret = Keypair.generate()

// // PDA for VrfClientState Account, VRF Account is authority of this account
// const [vrfClientKey] = PublicKey.findProgramAddressSync(
//   [Buffer.from("CLIENTSEED"), vrfSecret.publicKey.toBytes()],
//   program.programId
// )

// // PDA for VrfClientState Account, VRF Account is authority of this account
// const [solVaultPDA] = PublicKey.findProgramAddressSync(
//   [Buffer.from("VAULT")],
//   program.programId
// )

// const vrfIxCoder = new BorshInstructionCoder(program.idl)

// // Callback to consume randomness (the instruction that the oracle CPI's back into our program)
// const vrfClientCallback: sbv2.Callback = {
//   programId: program.programId,
//   accounts: [
//     // ensure all accounts in consumeRandomness are populated
//     { pubkey: solVaultPDA, isSigner: false, isWritable: true },
//     { pubkey: vrfClientKey, isSigner: false, isWritable: true },
//     { pubkey: vrfSecret.publicKey, isSigner: false, isWritable: false },
//     { pubkey: wallet.publicKey, isSigner: false, isWritable: true },
//     {
//       pubkey: SystemProgram.programId,
//       isSigner: false,
//       isWritable: false,
//     },
//   ],
//   ixData: vrfIxCoder.encode("consumeRandomness", ""), // pass any params for instruction here
// }
