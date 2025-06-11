import { useLayoutEffect, useReducer, useState, type JSX } from 'react'
import { highlight } from './CodeBlockShared'
import type { BundledLanguage } from 'shiki'

export function CodeBlock({ initial, children, lang }: { initial?: JSX.Element, children: string, lang: BundledLanguage }) {
  // "use no memo"

  const reducer = (state: JSX.Element, action: JSX.Element) => {
    return action
  }

  const [nodes, setNodes] = useReducer(reducer, initial ?? <></>)

  useLayoutEffect(() => {
    void highlight(children, lang).then(setNodes)
  }, [children])

  return nodes ?? <pre>
    <code>
      {children}
    </code>
  </pre>
}

// export const CodeBlock = memo(codeblock)