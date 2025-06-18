import { CopyIcon } from "lucide-react"
import React from "react"
import { CodeBlock } from "./CodeBlock"
import type { BundledLanguage } from "shiki"

const UserMessage = ({ message }: { message: { content: string } }) => {
  return (
    <div className="flex justify-end user-message">
      <div className="max-w-[60%] bg-neutral-900 border border-accent/20 text-neutral-50 rounded-2xl px-4 py-3">
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {applyUserCodeBlocks(message.content)}
        </div>
      </div>
    </div>
  )
}

const applyUserCodeBlocks = (message: string) => {
  // let res = message

  let chunks = message.split('```')

  if (chunks.length === 0) return message

  return (
    <>
      {chunks.map((chunk: string, index: number) => {
        if (index % 2 === 0) return <React.Fragment key={index}>{chunk}</React.Fragment>

        const language = (chunk.match(/^[a-z]*\n/i) || ['text'])[0].replace('\n', '')

        if (language !== 'text')
          chunk = chunk.replace(language + '\n', '')

        // return <CodeBlock key={index} lang={language as BundledLanguage}>
        //   {chunk}
        // </CodeBlock>

        return <div key={index} className="flex flex-col gap-0">
          <div className="py-2 px-4 text-sm text-[oklch(0.80_0.05_300)] bg-neutral-800 flex items-center justify-between">
            <span>{language}</span>
            <div>
              <CopyIcon
                className="h-full aspect-square hover:bg-zinc-700 p-1.25 rounded-sm cursor-pointer hover:text-zinc-100 transition-all"
                //@ts-ignore
                onClick={() => navigator.clipboard.writeText(chunk)}
              />
            </div>
          </div>
          <CodeBlock lang={language as BundledLanguage}>
            {chunk}
          </CodeBlock>
        </div>
      })}
    </>
  )
}

export default UserMessage