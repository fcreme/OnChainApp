import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  severity: 'success' | 'info' | 'warning' | 'error'
  txHash?: string
  autoHideDuration: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'autoHideDuration'> & { autoHideDuration?: number }) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const MAX_TOASTS = 5

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function defaultDuration(severity: Toast['severity']): number {
  return severity === 'error' ? 0 : 5000
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId()
    const autoHideDuration = toast.autoHideDuration ?? defaultDuration(toast.severity)
    const newToast: Toast = { ...toast, id, autoHideDuration }

    set((state) => {
      const updated = [...state.toasts, newToast]
      // Cap at MAX_TOASTS — remove oldest when exceeding
      if (updated.length > MAX_TOASTS) {
        return { toasts: updated.slice(updated.length - MAX_TOASTS) }
      }
      return { toasts: updated }
    })
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },

  clearAll: () => {
    set({ toasts: [] })
  },
}))
