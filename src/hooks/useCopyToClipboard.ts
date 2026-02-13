import { useState, useCallback } from 'react'

export function useCopyToClipboard(resetDelay = 1500) {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), resetDelay)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), resetDelay)
    }
  }, [resetDelay])

  return { copy, copiedText }
}
