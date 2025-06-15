'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUser } from '@clerk/nextjs'

type ColorTheme = 'purple' | 'red' | 'pink' | 'blue' | 'green'
type DarkMode = boolean

type ThemeProviderProps = {
  children: React.ReactNode
  defaultColorTheme?: ColorTheme
  defaultDarkMode?: DarkMode
  storageKey?: string
}

type ThemeProviderState = {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  darkMode: DarkMode
  setDarkMode: (darkMode: DarkMode) => void
}

const initialState: ThemeProviderState = {
  colorTheme: 'purple',
  setColorTheme: () => null,
  darkMode: true,
  setDarkMode: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultColorTheme = 'purple',
  defaultDarkMode = true,
  storageKey = 'open3',
  ...props
}: ThemeProviderProps) {
  const { user } = useUser()
  const settings = useQuery(api.userSettings.get, user ? { clerkId: user.id } : "skip")
  const updateSettings = useMutation(api.userSettings.update)

  const [colorTheme, setColorTheme] = useState<ColorTheme>(
    () => settings?.colorTheme || defaultColorTheme
  )
  const [darkMode, setDarkMode] = useState<DarkMode>(
    () => settings?.darkMode ?? defaultDarkMode
  )

  useEffect(() => {
    if (settings) {
      setColorTheme(settings.colorTheme)
      setDarkMode(settings.darkMode ?? defaultDarkMode)
    }
  }, [settings])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('purple', 'red', 'pink', 'blue', 'green')
    root.classList.add(colorTheme)
  }, [colorTheme])

  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [darkMode])

  const value = {
    colorTheme,
    setColorTheme: (theme: ColorTheme) => {
      if (user) {
        updateSettings({ clerkId: user.id, colorTheme: theme })
      }
      setColorTheme(theme)
    },
    darkMode,
    setDarkMode: (darkMode: DarkMode) => {
      if (user) {
        updateSettings({ clerkId: user.id, darkMode })
      }
      setDarkMode(darkMode)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
} 