import { useLayoutEffect, useReducer, useState, type JSX } from 'react'
import { highlight } from './CodeBlockShared'
import type { BundledLanguage } from 'shiki'
import useLocalStorage from '@/hooks/useLocalStorage'

export function CodeBlock({ initial, children, lang }: { initial?: JSX.Element, children: string, lang: BundledLanguage }) {
  const [codeTheme, setCodeTheme] = useLocalStorage('open3:codeTheme', 'dark-plus')

  const reducer = (state: JSX.Element, action: JSX.Element) => {
    return action
  }

  const [nodes, setNodes] = useReducer(reducer, initial ?? <></>)

  useLayoutEffect(() => {
    void highlight(children, lang, codeTheme).then(setNodes)
  }, [children])

  return nodes ?? <pre><code>{children}</code></pre>
}

// export const CodeBlock = memo(codeblock)