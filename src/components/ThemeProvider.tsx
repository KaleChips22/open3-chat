'use client'

import { createContext, useContext, useEffect, useState } from 'react'

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
  const [colorTheme, setColorTheme] = useState<ColorTheme>(
    () => (localStorage.getItem(`${storageKey}:colorTheme`) as ColorTheme) || defaultColorTheme
  )
  const [darkMode, setDarkMode] = useState<DarkMode>(
    () => {
      const stored = localStorage.getItem(`${storageKey}:darkMode`)
      return stored ? stored === 'true' : defaultDarkMode
    }
  )

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
      localStorage.setItem(`${storageKey}:colorTheme`, theme)
      setColorTheme(theme)
    },
    darkMode,
    setDarkMode: (darkMode: DarkMode) => {
      localStorage.setItem(`${storageKey}:darkMode`, darkMode.toString())
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