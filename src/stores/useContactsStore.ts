import { create } from 'zustand'

export interface Contact {
  name: string
  address: string
}

interface ContactsStore {
  contacts: Contact[]
  addContact: (name: string, address: string) => void
  removeContact: (address: string) => void
  updateContact: (address: string, name: string) => void
}

const STORAGE_KEY = 'onchain_contacts'

function loadContacts(): Contact[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return []
}

function saveContacts(contacts: Contact[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  } catch {}
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
  contacts: loadContacts(),

  addContact: (name, address) => {
    const { contacts } = get()
    const exists = contacts.some(
      (c) => c.address.toLowerCase() === address.toLowerCase()
    )
    if (exists) return

    const updated = [...contacts, { name, address }]
    saveContacts(updated)
    set({ contacts: updated })
  },

  removeContact: (address) => {
    const { contacts } = get()
    const updated = contacts.filter(
      (c) => c.address.toLowerCase() !== address.toLowerCase()
    )
    saveContacts(updated)
    set({ contacts: updated })
  },

  updateContact: (address, name) => {
    const { contacts } = get()
    const updated = contacts.map((c) =>
      c.address.toLowerCase() === address.toLowerCase()
        ? { ...c, name }
        : c
    )
    saveContacts(updated)
    set({ contacts: updated })
  },
}))
