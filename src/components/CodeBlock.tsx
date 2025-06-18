import { memo, useLayoutEffect, useReducer, useState, useMemo, useRef, type JSX } from 'react'
import { highlight } from './CodeBlockShared'
import type { BundledLanguage } from 'shiki'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUser } from '@clerk/nextjs'
import { useTheme } from './ThemeProvider'

// Create a cache for highlighted code blocks to prevent re-rendering the same code
const highlightCache = new Map<string, JSX.Element>()

const CodeBlock = memo(({ initial, children, lang }: { initial?: JSX.Element, children: string, lang: BundledLanguage }) => {
  const { user } = useUser()
  const { darkMode } = useTheme()
  const settings = useQuery(api.userSettings.get, user ? { clerkId: user.id } : "skip")
  const codeTheme = useMemo(() => settings?.codeTheme || (darkMode ? "dark-plus" : "light-plus"), [settings?.codeTheme, darkMode])
  const [isLoading, setIsLoading] = useState(!initial)
  const isMounted = useRef(true)
  const previousTheme = useRef(codeTheme)
  const [previousNodes, setPreviousNodes] = useState<JSX.Element | null>(null)
  
  // Create a cache key from the code, language and theme
  const cacheKey = useMemo(() => `${children}-${lang}-${codeTheme}`, [children, lang, codeTheme])

  const reducer = (state: JSX.Element, action: JSX.Element) => {
    return action
  }

  // Use a fallback that matches the current theme to prevent flashing
  const fallbackNodes = useMemo(() => {
    return <pre className={`language-${lang} ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <code>{children}</code>
    </pre>
  }, [children, lang, darkMode])

  const [nodes, setNodes] = useReducer(reducer, initial ?? fallbackNodes)

  // Preload both themes to avoid flashing when switching
  useLayoutEffect(() => {
    const preloadThemes = async () => {
      // Preload the current theme
      if (!highlightCache.has(cacheKey)) {
        try {
          const highlightedNodes = await highlight(children, lang, codeTheme)
          highlightCache.set(cacheKey, highlightedNodes)
        } catch (error) {
          console.error('Error preloading theme:', error)
        }
      }
      
      // Also preload the opposite theme for faster switching
      const oppositeTheme = codeTheme.includes('dark') ? 'light-plus' : 'dark-plus'
      const oppositeKey = `${children}-${lang}-${oppositeTheme}`
      
      if (!highlightCache.has(oppositeKey)) {
        try {
          void highlight(children, lang, oppositeTheme).then(nodes => {
            highlightCache.set(oppositeKey, nodes)
          })
        } catch (error) {
          // Ignore errors for the opposite theme
        }
      }
    }
    
    void preloadThemes()
  }, [children, lang])

  useLayoutEffect(() => {
    // Check if we already have this code highlighted in the cache
    if (highlightCache.has(cacheKey)) {
      // When changing themes, keep the previous nodes visible during transition
      if (previousTheme.current !== codeTheme) {
        setPreviousNodes(nodes)
      }
      
      setNodes(highlightCache.get(cacheKey)!)
      setIsLoading(false)
      return
    }

    // Only show loading state if we're switching themes
    if (previousTheme.current !== codeTheme) {
      setPreviousNodes(nodes)
      setIsLoading(true)
    }
    
    previousTheme.current = codeTheme
    
    // Highlight the code
    void highlight(children, lang, codeTheme).then((highlightedNodes) => {
      // Only update state if the component is still mounted
      if (isMounted.current) {
        // Store in cache for future use
        highlightCache.set(cacheKey, highlightedNodes)
        setNodes(highlightedNodes)
        setIsLoading(false)
        
        // Clear previous nodes after transition completes
        setTimeout(() => {
          setPreviousNodes(null)
        }, 300)
      }
    })
    
    return () => {
      isMounted.current = false
    }
  }, [cacheKey])

  // Reset the isMounted ref when the component mounts
  useLayoutEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return (
    <div className="relative">
      {previousNodes && (
        <div className="absolute top-0 left-0 w-full opacity-0 transition-opacity duration-300">
          {previousNodes}
        </div>
      )}
      <div className="opacity-100 transition-opacity duration-300">
        {nodes}
      </div>
    </div>
  )
})

export default CodeBlock