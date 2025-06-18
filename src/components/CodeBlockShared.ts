import type { JSX } from 'react'
import { codeToHast, type BundledLanguage } from "shiki"
import { Fragment } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'

// Create a cache for highlighted code blocks to prevent re-highlighting the same code
// This is separate from the component-level cache in CodeBlock.tsx
// Format: Map<cacheKey, JSX.Element> where cacheKey is `${code}-${lang}-${theme}`
const highlightCache = new Map<string, JSX.Element>()
const MAX_CACHE_SIZE = 100 // Limit cache size to prevent memory issues

export async function highlight(code: string, lang: BundledLanguage, theme: string) {
  // Create a cache key from the code, language and theme
  const cacheKey = `${code}-${lang}-${theme}`
  
  // Check if we already have this code highlighted in the cache
  if (highlightCache.has(cacheKey)) {
    return highlightCache.get(cacheKey)!
  }
  
  // If cache is too large, remove oldest entries (first 20%)
  if (highlightCache.size >= MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(highlightCache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE * 0.2))
    keysToDelete.forEach(key => highlightCache.delete(key))
  }
  
  // Highlight the code
  const out = await codeToHast(code, {
    lang,
    theme,
  })

  const result = toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
  }) as JSX.Element
  
  // Store in cache for future use
  highlightCache.set(cacheKey, result)
  
  return result
}