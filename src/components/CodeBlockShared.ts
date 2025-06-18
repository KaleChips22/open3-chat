import type { JSX } from 'react'
import { codeToHast, type BundledLanguage } from "shiki"
import { Fragment } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'

export async function highlight(code: string, lang: BundledLanguage, theme: string) {
  const out = await codeToHast(code, {
    lang,
    theme,
  })

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
  }) as JSX.Element
}