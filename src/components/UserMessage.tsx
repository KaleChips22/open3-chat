import { CheckIcon, CopyIcon, EditIcon, GitBranchIcon, RefreshCcwIcon, XIcon } from "lucide-react"
import React, { useEffect, useState, useRef } from "react"
import { CodeBlock } from "./CodeBlock"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
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
    onMessageEdit: (newMessage: string) => void,
    onMessageBranch: () => void
  }
) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus and resize textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      adjustTextareaHeight()
    }
  }, [isEditing])

  // Adjust textarea height to fit content
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditedMessage(message.content)
      setIsEditing(false)
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      setIsEditing(false)
      onMessageEdit(editedMessage)
    }
    
    // Resize textarea as user types
    setTimeout(adjustTextareaHeight, 0)
  }

  const messageActions = [
    {
      icon: RefreshCcwIcon,
      onClick: onMessageRegenerate,
      tooltip: "Regenerate response"
    },
    {
      icon: EditIcon,
      onClick: () => setIsEditing(true),
      tooltip: "Edit message"
    },
    {
      icon: GitBranchIcon,
      onClick: onMessageBranch,
      tooltip: "Branch from here"
    },
    {
      icon: CopyIcon,
      onClick: () => navigator.clipboard.writeText(message.content),
      tooltip: "Copy message"
    },
  ]
  
  return (
    <div className="flex justify-end user-message w-full group/userMessage">
      <div className="max-w-[60%] flex flex-col gap-2 items-end">
        <div className={"w-fit bg-neutral-900 border-t border-t-accent/30 border-b border-b-accent/15 text-neutral-50 " + (isEditing ? "p-2 rounded-xl" : "p-4 rounded-lg")}>
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                className="w-full bg-neutral-950 p-2 rounded-md border-none outline-none resize-none text-sm leading-relaxed min-h-[100px]"
                value={editedMessage}
                onChange={(e) => {
                  setEditedMessage(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={handleKeyDown}
                placeholder="Edit your message..."
              />
            ) : applyUserCodeBlocks(message.content)}
          </div>
        </div>
        <div className="flex flex-row items-center justify-end gap-2 w-full">
          {isEditing ? (
            <div className="flex flex-row items-center justify-end gap-2 w-full">
              <div className="text-xs text-neutral-400 mr-2">
                Press Ctrl+Enter to save, Esc to cancel
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckIcon 
                    className="size-8 text-accent hover:text-white cursor-pointer p-2 hover:bg-neutral-800 rounded-md" 
                    onClick={() => {
                      setIsEditing(false)
                      onMessageEdit(editedMessage)
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>Save changes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <XIcon 
                    className="size-8 text-accent hover:text-white cursor-pointer p-2 hover:bg-neutral-800 rounded-md" 
                    onClick={() => {
                      setEditedMessage(message.content)
                      setIsEditing(false)
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>Cancel</TooltipContent>
              </Tooltip>
            </div>
          ) : messageActions.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <action.icon 
                  className="size-8 text-accent hover:text-white cursor-pointer p-2 hover:bg-neutral-800 rounded-md" 
                  onClick={action.onClick}
                />
              </TooltipTrigger>
              <TooltipContent>{action.tooltip}</TooltipContent>
            </Tooltip>
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