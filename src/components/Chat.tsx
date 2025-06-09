"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Bot, User } from "lucide-react"
import { ScrollArea } from "@/components/scroll-area"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { pushUserMessage } from "@/actions/pushUserMessage"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import '@/styles/markdown.css'

export default function Chat({ id }: { id: string }) {
  const router = useRouter()

  const { user, isLoaded } = useUser()

  const chat = useQuery(api.chats.getChat, { id: id as Id<"chats"> })
  
  const createMessage = useMutation(api.messages.createMessage)

  // const [messages, setMessages] = useState<any[]>([]) // mockMessage
  
  const messages = useQuery(api.messages.getMessagesForChat, { chatId: id as Id<"chats"> })
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!chat) return
    
    document.title = `${chat.title} - Open3 Chat`
  }, [chat])

  useEffect(() => {
    if (!isLoaded) return
    if (!user || chat && chat.clerkId !== user.id) return router.push("/")
  }, [user, isLoaded, chat])

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }

  const resizeInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 256) + "px"
    }
  }

  const minimizeInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = "64px"
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    scrollToBottom()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    pushUserMessage(id as Id<"chats">, input)

    setInput("")
    minimizeInput()
  }

  const renderMessage = (content: string) => {
    return (
      <div 
        className="markdown-content prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{
          __html: content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
        }}
      />
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950">
      {/* Chat Container */}
      <div className="relative h-full">
        {/* Chat Messages */}
        <div className="h-full">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef} type="hidden">
            <div className="max-w-4xl mx-auto space-y-8 pb-32">
              {messages && messages.map((message) => (
                <div key={message._id} className="w-full">
                  {message.role === "user" ? (
                    // User message
                    <div className="flex justify-end mb-6">
                      <div className="flex items-start gap-4 max-w-[80%]">
                        <div className="glass rounded-2xl px-6 py-4 border border-purple-500/20">
                          <div className="text-slate-100 leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center glow-subtle">
                          <User className="size-5 text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // AI message directly on background
                    <div className="w-full">
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-100 max-w-[100%] md:max-w-[80%] markdown">
                          <Markdown
                            components={{
                            code: ({ node, ...props }) => <code className="inline" {...props} />,
                            pre: ({ node, ...props }) => {
                              // @ts-ignore
                              const language = node.children[0]?.properties.className[0].replace("language-", "") || "text"
                              return <pre {...props} data-language={language} />
                              }
                            }}
                            remarkPlugins={[remarkGfm]}
                          >{message.content}</Markdown>
                        {/* {message.content} */}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Floating Input */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-6">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="w-full glass text-slate-100 placeholder:text-slate-400 rounded-2xl px-6 py-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[64px] max-h-64 overflow-y-auto scrollbar-hide glow-subtle focus:glow transition-all duration-200"
              style={{
                height: "auto",
                minHeight: "64px",
              }}
              ref={inputRef}
              onInput={resizeInput}
            />
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="absolute right-3 bottom-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl size-10 p-0 flex items-center justify-center cursor-pointer transition-all duration-200 glow-subtle hover:glow border-0"
            >
              <ArrowUp className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}