import { create } from 'zustand'

type ThemeMode = 'light' | 'dark'

interface ThemeStore {
  mode: ThemeMode
  toggleMode: () => void
}

const getInitialMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem('onchain_theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'dark'
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: getInitialMode(),
  toggleMode: () =>
    set((state) => {
      const next = state.mode === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('onchain_theme', next) } catch {}
      return { mode: next }
    }),
}))
