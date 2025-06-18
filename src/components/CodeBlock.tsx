import { memo, useLayoutEffect, useReducer, useState, useMemo, useRef, type JSX } from 'react'
import { highlight } from './CodeBlockShared'
import type { BundledLanguage } from 'shiki'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUser } from '@clerk/nextjs'

// Create a cache for highlighted code blocks to prevent re-rendering the same code
const highlightCache = new Map<string, JSX.Element>()

const CodeBlock = memo(({ initial, children, lang }: { initial?: JSX.Element, children: string, lang: BundledLanguage }) => {
  const { user } = useUser()
  const settings = useQuery(api.userSettings.get, user ? { clerkId: user.id } : "skip")
  const codeTheme = useMemo(() => settings?.codeTheme || "dark-plus", [settings?.codeTheme])
  const [isLoading, setIsLoading] = useState(!initial)
  const isMounted = useRef(true)
  
  // Create a cache key from the code, language and theme
  const cacheKey = useMemo(() => `${children}-${lang}-${codeTheme}`, [children, lang, codeTheme])

  const reducer = (state: JSX.Element, action: JSX.Element) => {
    return action
  }

  const [nodes, setNodes] = useReducer(reducer, initial ?? <pre><code>{children}</code></pre>)

  useLayoutEffect(() => {
    // Check if we already have this code highlighted in the cache
    if (highlightCache.has(cacheKey)) {
      setNodes(highlightCache.get(cacheKey)!)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    
    // Highlight the code
    void highlight(children, lang, codeTheme).then((highlightedNodes) => {
      // Only update state if the component is still mounted
      if (isMounted.current) {
        // Store in cache for future use
        highlightCache.set(cacheKey, highlightedNodes)
        setNodes(highlightedNodes)
        setIsLoading(false)
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
    <div className={isLoading ? "opacity-100" : "opacity-100 transition-opacity duration-100"}>
      {nodes}
    </div>
  )
})

export default CodeBlock