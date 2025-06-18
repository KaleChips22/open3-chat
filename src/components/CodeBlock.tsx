import { memo, useLayoutEffect, useReducer, useState, type JSX } from 'react'
import { highlight } from './CodeBlockShared'
import type { BundledLanguage } from 'shiki'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useUser } from '@clerk/nextjs'

const CodeBlock = memo(({ initial, children, lang }: { initial?: JSX.Element, children: string, lang: BundledLanguage }) => {
  const { user } = useUser()
  const settings = useQuery(api.userSettings.get, user ? { clerkId: user.id } : "skip")
  const codeTheme = settings?.codeTheme || "dark-plus"
  const [isLoading, setIsLoading] = useState(!initial)

  const reducer = (state: JSX.Element, action: JSX.Element) => {
    return action
  }

  const [nodes, setNodes] = useReducer(reducer, initial ?? <pre><code>{children}</code></pre>)

  useLayoutEffect(() => {
    setIsLoading(true)
    void highlight(children, lang, codeTheme).then((highlightedNodes) => {
      setNodes(highlightedNodes)
      setIsLoading(false)
    })
  }, [children, lang, codeTheme])

  return (
    <div className={isLoading ? "opacity-100" : "opacity-100 transition-opacity duration-100"}>
      {nodes}
    </div>
  )
})

export default CodeBlock