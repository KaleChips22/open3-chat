'use client'

import { memo, useLayoutEffect, useState, type JSX } from 'react'
import { highlight } from './CodeBlockShared'
import type { BundledLanguage } from 'shiki'

export function CodeBlock({ initial, children, lang }: { initial?: JSX.Element, children: string, lang: BundledLanguage }) {
  const [nodes, setNodes] = useState(initial)

  useLayoutEffect(() => {
    void highlight(children, lang).then(setNodes)
  }, [])

  return nodes ?? 'Loading...'
}

// export const CodeBlock = memo(codeblock)