import { useContactsStore } from '../stores/useContactsStore'

export function useResolveContact(address: string | undefined): string | null {
  const contacts = useContactsStore((s) => s.contacts)
  if (!address) return null
  const match = contacts.find(
    (c) => c.address.toLowerCase() === address.toLowerCase()
  )
  return match?.name ?? null
}
