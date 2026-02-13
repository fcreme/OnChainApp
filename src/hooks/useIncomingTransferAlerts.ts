import { useEffect, useRef } from 'react'
import { useAppStore } from '../pages/store/useAppStore'
import { useToastStore } from '../stores/useToastStore'

/**
 * Watches for new Transfer events where the connected wallet is the recipient
 * and fires a toast notification for incoming transfers.
 */
export function useIncomingTransferAlerts() {
  const events = useAppStore((s) => s.events)
  const account = useAppStore((s) => s.account)
  const prevCountRef = useRef(events.length)

  useEffect(() => {
    if (!account) {
      prevCountRef.current = events.length
      return
    }

    const prevCount = prevCountRef.current
    prevCountRef.current = events.length

    // Only check newly added events
    if (events.length <= prevCount) return

    const newEvents = events.slice(prevCount)
    const accountLower = account.toLowerCase()

    for (const evt of newEvents) {
      // Only alert on Transfer events TO us that are from on-chain (not our own local actions)
      if (
        evt.type === 'Transfer' &&
        evt.source === 'onchain' &&
        evt.to?.toLowerCase() === accountLower &&
        evt.from?.toLowerCase() !== accountLower
      ) {
        useToastStore.getState().addToast({
          message: `Received ${evt.amount} ${evt.token} from ${evt.from?.slice(0, 6)}...${evt.from?.slice(-4)}`,
          severity: 'info',
          txHash: evt.tx,
        })
      }
    }
  }, [events, account])
}
