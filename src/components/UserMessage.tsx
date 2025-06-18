import { CheckIcon, CopyIcon, EditIcon, GitBranchIcon, RefreshCcwIcon, XIcon } from "lucide-react"
import React, { useEffect, useState } from "react"
import { CodeBlock } from "./CodeBlock"
import type { BundledLanguage } from "shiki"

const UserMessage = (
  {
    message,
    onMessageRegenerate,
    onMessageEdit,
    onMessageBranch
  }: {
    message: { content: string },
    onMessageRegenerate: () => void,
    onMessageEdit: (message: string) => void,
    onMessageBranch: () => void
  }
) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.content)

  useEffect(() => {
    if (!isEditing && editedMessage !== message.content) {
      onMessageEdit(editedMessage)
    }
  }, [message, isEditing])

  const messageActions = [
    {
      icon: RefreshCcwIcon,
      onClick: onMessageRegenerate
    },
    {
      icon: EditIcon,
      onClick: () => setIsEditing(true)
    },
    {
      icon: GitBranchIcon,
      onClick: onMessageBranch
    },
    {
      icon: CopyIcon,
      onClick: () => navigator.clipboard.writeText(message.content)
    },
  ]
  
  return (
    <div className="flex justify-end user-message w-full">
      <div className="max-w-[60%] flex flex-col gap-2 group/userMessage items-end">
        <div className={"w-fit bg-neutral-900 border-t border-t-accent/30 border-b border-b-accent/15 text-neutral-50 " + (isEditing ? "p-2 rounded-xl" : "p-4 rounded-lg")}>
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {isEditing ? (
              <textarea
                className="w-full bg-neutral-950 p-2 rounded-md border-none outline-none resize-none text-sm leading-relaxed"
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
              />
            ) : applyUserCodeBlocks(message.content)}
          </div>
        </div>
        <div className="flex flex-row items-center justify-end gap-2 w-full">
          {isEditing ? (
            <div className="flex flex-row items-center justify-end gap-2 w-full">
              <CheckIcon className="size-8 text-accent hover:text-white cursor-pointer p-2 hover:bg-neutral-800 rounded-md" onClick={() => setIsEditing(false)} />
              <XIcon className="size-8 text-accent hover:text-white cursor-pointer p-2 hover:bg-neutral-800 rounded-md" onClick={() => {
                setEditedMessage(message.content)
                setIsEditing(false)
              }} />
            </div>
          ) : messageActions.map((action, index) => (
            <action.icon key={index} className="size-8 group-hover/userMessage:text-accent text-transparent group-hover/userMessage:hover:text-white cursor-pointer p-2 hover:bg-neutral-800 rounded-md" onClick={action.onClick} />
          ))}
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