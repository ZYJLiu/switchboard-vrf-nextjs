import { useState, useEffect } from "react"
import * as sbv2 from "@switchboard-xyz/solana.js"
import { provider } from "@/utils/anchor"

export const useSwitchboard = () => {
  const [switchboard, setSwitchboard] = useState<{
    program: sbv2.SwitchboardProgram
    queueAccount: sbv2.QueueAccount
    queueAccountData: sbv2.types.OracleQueueAccountData
  }>()

  useEffect(() => {
    const fetchData = async () => {
      const switchboardProgram = await sbv2.SwitchboardProgram.fromProvider(
        provider
      )

      const [queueAccount, queueAccountData] = await sbv2.QueueAccount.load(
        switchboardProgram,
        "uPeRMdfPmrPqgRWSrjAnAkH78RqAhe5kXoW6vBYRqFX"
      )

      setSwitchboard({
        program: switchboardProgram,
        queueAccount: queueAccount,
        queueAccountData: queueAccountData,
      })
    }

    fetchData()
  }, [])

  return switchboard
}
