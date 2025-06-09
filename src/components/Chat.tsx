"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { ScrollArea } from "@/components/scroll-area"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { pushUserMessage } from "@/actions/pushUserMessage"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import BackgroundEffects from "./BackgroundEffects"

import { highlight } from "remark-sugar-high"

import '@/styles/markdown.css'

export default function Chat({ id }: { id: string }) {
  const router = useRouter()

  const { user, isLoaded } = useUser()

  const chat = useQuery(api.chats.getChat, { id: id as Id<"chats"> })
  
  const createMessage = useMutation(api.messages.createMessage)
  
  const messages = useQuery(api.messages.getMessagesForChat, { chatId: id as Id<"chats"> })
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [previousMessagesLength, setPreviousMessagesLength] = useState(0)
  const [previousLastMessageContent, setPreviousLastMessageContent] = useState("")

  useEffect(() => {
    if (!chat) return
    
    document.title = `${chat.title} - Open3 Chat`
  }, [chat])

  useEffect(() => {
    if (!isLoaded) return
    if (!user || chat && chat.clerkId !== user.id) return router.push("/")
  }, [user, isLoaded, chat])

  // Track when streaming starts and ends
  useEffect(() => {
    if (!messages || messages.length === 0) return
    
    const currentLastMessage = messages[messages.length - 1]
    
    // If the last message has changed and it's from the assistant
    if (currentLastMessage._id !== lastMessageId && currentLastMessage.role === "assistant") {
      setLastMessageId(currentLastMessage._id)
      setIsStreaming(true)
      
      // Set up polling to check if the message content has stopped changing
      const checkInterval = setInterval(() => {
        const updatedMessages = messages
        if (updatedMessages && updatedMessages.length > 0) {
          const latestMessage = updatedMessages[updatedMessages.length - 1]
          
          // If the latest message is the same as our tracked message but content length has stabilized
          if (latestMessage._id === currentLastMessage._id && 
              latestMessage.content.length > 0 && 
              latestMessage.content === currentLastMessage.content) {
            setIsStreaming(false)
            clearInterval(checkInterval)
          }
        }
      }, 1000)
      
      return () => clearInterval(checkInterval)
    }
  }, [messages, lastMessageId])

  // Auto-scroll to bottom when new messages arrive or during streaming
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" })
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
      inputRef.current.style.height = "56px"
    }
  }

  // Detect user scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
        if (viewport) {
          const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100
          setUserHasScrolled(!isAtBottom)
        }
      }
    }

    const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
    if (viewport) {
      viewport.addEventListener('scroll', handleScroll)
      return () => viewport.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Scroll only when messages change or when a new message is added
  useEffect(() => {
    if (!messages || messages.length === 0) return
    
    // Check if messages length changed (new message added)
    const messagesChanged = messages.length !== previousMessagesLength
    
    // Check if the last message content changed (streaming update)
    const lastMessage = messages[messages.length - 1]
    const lastMessageContentChanged = lastMessage && 
      lastMessage.content !== previousLastMessageContent
    
    // Update previous values for next comparison
    setPreviousMessagesLength(messages.length)
    if (lastMessage) {
      setPreviousLastMessageContent(lastMessage.content)
    }
    
    // Only scroll if messages changed and user hasn't manually scrolled up
    // Or if the user is at the bottom already
    if ((messagesChanged || lastMessageContentChanged) && !userHasScrolled) {
      scrollToBottom()
    }
    
    // Reset userHasScrolled when a new message is added (not just content updated)
    if (messagesChanged) {
      setUserHasScrolled(false)
    }
  }, [messages, previousMessagesLength, previousLastMessageContent, userHasScrolled])

  // Initial scroll
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    pushUserMessage(id as Id<"chats">, input)
    setUserHasScrolled(false) // Reset scroll position when sending a message
    setInput("")
    minimizeInput()
  }

  return (
    <div className="h-full w-full flex flex-col bg-neutral-950 text-neutral-100 relative">
      {/* Background Effects */}
      <BackgroundEffects variant="dark" />
      
      {/* Chat Container */}
      <div className="relative h-full">
        {/* Chat Messages */}
        <div className="h-full">
          <ScrollArea className="min-h-screen h-full p-6" ref={scrollAreaRef} type="hidden">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages && messages.map((message) => (
                <div key={message._id} className="w-full">
                  {message.role === "user" ? (
                    // User message with bubble
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-neutral-800 border border-accent/20 text-neutral-100 rounded-2xl px-4 py-3">
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</div>
                      </div>
                    </div>
                  ) : (
                    // AI message directly on background
                    <div className="w-full">
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-100 max-w-[100%] md:max-w-[80%] markdown">
                          <div className="mb-1 text-accent/80 text-xs font-medium">AI Assistant</div>
                          <Markdown
                            components={{
                            code: ({ node, ...props }) => <code className="inline" {...props} />,
                            pre: ({ node, ...props }) => {
                              // @ts-ignore
                              if (!(node && node.children && node.children[0] && node.children[0].properties && node.children[0].properties.className)) return (<pre {...props} />)
                              
                              // @ts-ignore
                              const language = node.children[0]?.properties.className[0].replace("language-", "") || "text"
                              return <pre {...props} data-language={language} />
                              }
                            }}
                            remarkPlugins={[remarkGfm, highlight]}
                          >{message.content}</Markdown>
                          {/* {message._id === lastMessageId && isStreaming && (
                            <span className="inline-block ml-1 animate-pulse">▌</span>
                          )} */}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="h-32 w-full bg-transparent" ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Floating Input */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 text-sm sm:text-base">
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
              className="w-full glassmorphic-dark text-neutral-100 placeholder:text-neutral-400 rounded-xl px-6 py-4 pr-16 resize-none focus:outline-none focus:ring-0 min-h-[56px] max-h-64 overflow-y-auto scrollbar-hide focus:border-accent/50 transition-all"
              style={{
                height: "auto",
                minHeight: "56px",
              }}
              ref={inputRef}
              onInput={resizeInput}
            />
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!input.trim() || isStreaming}
              className="absolute right-3 bottom-3 bg-accent/20 backdrop-blur-md border border-accent/30 hover:bg-accent/30 text-neutral-100 disabled:opacity-50 rounded-lg size-9 p-0 flex items-center justify-center cursor-pointer purple-glow-sm"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}