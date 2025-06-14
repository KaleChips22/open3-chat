"use client"

import React from "react"

import { useState, useEffect, useRef, memo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDownIcon, ArrowUp, CopyIcon, EditIcon, ForwardIcon, RewindIcon, TrashIcon, RotateCcwIcon } from "lucide-react"
import { ScrollArea } from "@/components/scroll-area"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { pushUserMessage, pushLocalUserMessage } from "@/actions/pushUserMessage"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import BackgroundEffects from "./BackgroundEffects"
import { bundledLanguages, type BundledLanguage } from 'shiki'
import useLocalStorage from "@/hooks/useLocalStorage"

import '@/styles/markdown.css'
import { CodeBlock } from "./CodeBlock"
import models from "@/models/models"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useTheme } from "./ThemeProvider"

export default function Chat({ id }: { id: string }) {
  'use no memo'
  const router = useRouter()

  const { user, isLoaded } = useUser()

  // Only query Convex if user is authenticated
  const chat = useQuery(api.chats.getChat, user ? { id: id as Id<"chats"> } : "skip")
  const [localChat, setLocalChat] = useState<{ title: string, messages: any[] } | null>(null)

  const { colorTheme } = useTheme()
  
  const createMessage = useMutation(api.messages.createMessage)
  
  // Only query messages if user is authenticated
  const messages = useQuery(api.messages.getMessagesForChat, user ? { chatId: id as Id<"chats"> } : "skip")
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [previousMessagesLength, setPreviousMessagesLength] = useState(0)
  const [previousLastMessageContent, setPreviousLastMessageContent] = useState("")

  const [selectedModel, setSelectedModel] = useLocalStorage("open3:selectedModel", 0)

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  // Load chat from localStorage if user is not authenticated
  useEffect(() => {
    if (!isLoaded) return
    if (user) return // Skip if user is authenticated

    const storedChat = localStorage.getItem(`open3:chat:${id}`)
    if (storedChat) {
      setLocalChat(JSON.parse(storedChat))
    } else {
      // Initialize new local chat if none exists
      const newChat = {
        title: "New Chat",
        messages: []
      }
      setLocalChat(newChat)
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify(newChat))
    }
  }, [isLoaded, user, id])

  useEffect(() => {
    if (!chat && !localChat) return
    
    document.title = `${(chat?.title || localChat?.title || "New Chat")} - Open3 Chat`
  }, [chat, localChat])

  useEffect(() => {
    if (!isLoaded) return
    if (user && chat && chat.clerkId !== user.id) return router.push("/")
  }, [user, isLoaded, chat])

  // Track when streaming starts and ends
  useEffect(() => {
    const currentMessages = user ? messages : localChat?.messages
    if (!currentMessages || currentMessages.length === 0) return
    
    const currentLastMessage = currentMessages[currentMessages.length - 1]
    
    // If the last message has changed and it's from the assistant
    if (currentLastMessage._id !== lastMessageId && currentLastMessage.role === "assistant") {
      setLastMessageId(currentLastMessage._id)
      setIsStreaming(true)
      
      // Set up polling to check if the message content has stopped changing
      const checkInterval = setInterval(() => {
        const updatedMessages = user ? messages : localChat?.messages
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
  }, [messages, localChat, lastMessageId, user])

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

    if (user) {
      pushUserMessage(id as Id<"chats">, input, models[selectedModel]!.id)
      setInput("")
      minimizeInput()
    } else {
      // Handle unauthenticated user message
      const newMessage = {
        _id: Math.random().toString(36).substring(2, 15),
        role: "user",
        content: input,
        timestamp: new Date().toISOString()
      }
      
      // Add user message to chat
      const updatedChat = {
        title: localChat?.title || "New Chat",
        messages: [...(localChat?.messages || []), newMessage]
      }
      
      setLocalChat(updatedChat)
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify(updatedChat))

      setInput("")
      minimizeInput()

      // Create AI message placeholder
      const aiMessageId = Math.random().toString(36).substring(2, 15)
      const aiMessage = {
        _id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString()
      }

      // Add empty AI message to chat
      const chatWithAiMessage = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage]
      }
      
      setLocalChat(chatWithAiMessage)
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify(chatWithAiMessage))

      // Get AI response chunks
      const chunks = await pushLocalUserMessage(id, input, models[selectedModel]!.id)
      
      // Process chunks with a small delay to simulate streaming
      let fullResponse = ""
      for (const chunk of chunks) {
        fullResponse += chunk
        
        // Update AI message with new content
        const updatedMessages = chatWithAiMessage.messages.map(msg => 
          msg._id === aiMessageId 
            ? { ...msg, content: fullResponse }
            : msg
        )
        
        const updatedChatWithResponse = {
          ...chatWithAiMessage,
          messages: updatedMessages
        }
        
        setLocalChat(updatedChatWithResponse)
        localStorage.setItem(`open3:chat:${id}`, JSON.stringify(updatedChatWithResponse))
        
        // Add a small delay between chunks to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    setUserHasScrolled(false) // Reset scroll position when sending a message
  }

  // Get messages based on authentication status
  const displayMessages = user ? messages : localChat?.messages

  const handleEditMessage = (messageId: string) => {
    const message = displayMessages?.find(m => m._id === messageId)
    if (message) {
      setEditingMessageId(messageId)
      setEditingContent(message.content)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return
    
    if (user) {
      // Create a new message with the edited content
      const message = displayMessages?.find(m => m._id === editingMessageId)
      if (message) {
        await createMessage({
          chatId: id as Id<"chats">,
          content: editingContent,
          role: message.role,
          model: message.model,
          parentId: message.parentId
        })
      }
    } else {
      // Handle local editing
      const updatedMessages = localChat?.messages.map(msg =>
        msg._id === editingMessageId ? { ...msg, content: editingContent } : msg
      )
      if (updatedMessages && localChat) {
        setLocalChat({
          title: localChat.title,
          messages: updatedMessages
        })
        localStorage.setItem(`open3:chat:${id}`, JSON.stringify({
          title: localChat.title,
          messages: updatedMessages
        }))
      }
    }
    
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (user) {
      await createMessage({
        chatId: id as Id<"chats">,
        content: "",
        role: "user",
        model: "",
        parentId: messageId as Id<"messages">
      })
    } else {
      // Handle local deletion
      const messageIndex = localChat?.messages.findIndex(m => m._id === messageId)
      if (messageIndex !== undefined && messageIndex !== -1 && localChat) {
        const updatedMessages = localChat.messages.slice(0, messageIndex)
        setLocalChat({
          title: localChat.title,
          messages: updatedMessages
        })
        localStorage.setItem(`open3:chat:${id}`, JSON.stringify({
          title: localChat.title,
          messages: updatedMessages
        }))
      }
    }
  }

  const handleRetryMessage = async (messageId: string) => {
    const message = displayMessages?.find(m => m._id === messageId)
    if (!message) return

    if (user) {
      // Create a new message with the same content
      await createMessage({
        chatId: id as Id<"chats">,
        content: message.content,
        role: message.role,
        model: message.model,
        parentId: message.parentId
      })
    } else if (localChat) {
      // Handle local retry
      const newMessage = {
        _id: Math.random().toString(36).substring(2, 15),
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString()
      }
      
      const updatedMessages = [...localChat.messages, newMessage]
      setLocalChat({
        title: localChat.title,
        messages: updatedMessages
      })
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify({
        title: localChat.title,
        messages: updatedMessages
      }))
    }
  }

  const handleNavigateBranch = async (messageId: string, direction: 'forward' | 'back') => {
    const message = displayMessages?.find(m => m._id === messageId)
    if (!message) return

    if (user) {
      const children = message.childrenIds
      if (children.length > 0) {
        const targetId = direction === 'forward' ? children[0] : message.parentId
        if (targetId !== 'root') {
          router.push(`/chat/${id}?message=${targetId}`)
        }
      }
    }
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
              {displayMessages && displayMessages.map((message) => (
                <div key={message._id} className="w-full">
                  {message.role === "user" ? (
                    editingMessageId === message._id ? (
                      <div className="flex justify-end">
                        <div className="max-w-[60%] w-full">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full glassmorphic-dark text-neutral-100 placeholder:text-neutral-400 rounded-xl px-6 py-4 resize-none focus:outline-none focus:ring-0 min-h-[56px] max-h-64 overflow-y-auto scrollbar-hide focus:border-accent/50 transition-all"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-neutral-400 hover:text-white"
                              onClick={() => setEditingMessageId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-neutral-400 hover:text-white"
                              onClick={handleSaveEdit}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <UserMessage
                        message={message}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        onRetry={handleRetryMessage}
                      />
                    )
                  ) : (
                    <AIMessage
                      message={message}
                      onRetry={handleRetryMessage}
                      onForward={() => handleNavigateBranch(message._id, 'forward')}
                      onBack={() => handleNavigateBranch(message._id, 'back')}
                    />
                  )}
                </div>
              ))}
              <div className="h-32 w-full bg-transparent" ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Floating Input */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 text-sm sm:text-base">
          <div className="relative flex flex-col-reverse items-start justify-between gap-2">
            <div>
              <Select value={models[selectedModel]!.id} onValueChange={(value) => setSelectedModel(models.findIndex((model) => model.id === value))}>
                <SelectTrigger className="bg-transparent border border-neutral-800 hover:bg-neutral-800 text-neutral-100 rounded-xl px-4 py-2 transition-all cursor-pointer">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-xl">
                  {models.map((model, index) => (
                    <SelectItem key={index} value={model.id} className="text-neutral-100 rounded-lg cursor-pointer active:bg-neutral-800">{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
              className={`absolute right-3 top-3 bg-accent/20 backdrop-blur-md border border-accent/30 hover:bg-accent/30 text-neutral-100 disabled:opacity-50 rounded-lg size-9 p-0 flex items-center justify-center cursor-pointer ${colorTheme}-glow-sm`}
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-10">
          <Button variant="outline" size="icon" className="cursor-pointer rounded-full bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 transition-all duration-300" onClick={scrollToBottom}>
            <ArrowDownIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const UserMessage = ({ message, onEdit, onDelete, onRetry }: { 
  message: { content: string, _id: string },
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onRetry: (id: string) => void
}) => {
  return (
    <div className="flex justify-end user-message">
      <div className="max-w-[60%] bg-neutral-800 border border-accent/20 text-neutral-100 rounded-2xl px-4 py-3">
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {applyUserCodeBlocks(message.content)}
        </div>
        <div className="flex gap-2 mt-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-neutral-400 hover:text-white"
            onClick={() => onRetry(message._id)}
          >
            <RotateCcwIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-neutral-400 hover:text-white"
            onClick={() => onEdit(message._id)}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-neutral-400 hover:text-red-500"
            onClick={() => onDelete(message._id)}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const AIMessage = memo(({ message, onRetry, onForward, onBack }: { 
  message: { content: string, _id: string, model: string },
  onRetry: (id: string) => void,
  onForward: (id: string) => void,
  onBack: (id: string) => void
}) => {
  const model = models.find(m => m.id === message.model)
  
  return (
    <div className="w-full">
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-100 max-w-[100%] md:max-w-[80%] markdown">
        <div className="mb-1 text-accent/80 text-xs font-medium">{model?.name || "AI Assistant"}</div>
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ node, ...props }) => {
              // @ts-ignore
              const language = (node?.children?.[0]?.properties?.className?.[0] || "language-text").replace('language-', '')
              return <div className="flex flex-col gap-0 mb-2">
                <div className="py-2 px-4 text-sm text-[oklch(0.80_0.05_300)] bg-neutral-800 flex items-center justify-between">
                  <span>{language}</span>
                  <div>
                    <CopyIcon
                      className="h-full aspect-square hover:bg-zinc-700 p-1.25 rounded-sm cursor-pointer hover:text-zinc-100 transition-all"
                      //@ts-ignore
                      onClick={() => navigator.clipboard.writeText(node.children[0].children[0].value)}
                    />
                  </div>
                </div>
                <CodeBlock lang={Object.keys(bundledLanguages).includes(language) ? language : 'text'}>
                  {/* @ts-ignore */}
                  {node.children[0].children[0].value}
                </CodeBlock>
              </div>
            }
          }}
        >{message.content}</Markdown>
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-neutral-400 hover:text-white"
            onClick={() => onRetry(message._id)}
          >
            <RotateCcwIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-neutral-400 hover:text-white"
            onClick={() => onBack(message._id)}
          >
            <RewindIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-neutral-400 hover:text-white"
            onClick={() => onForward(message._id)}
          >
            <ForwardIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})

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