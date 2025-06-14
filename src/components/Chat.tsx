"use client"

import React from "react"

import { useState, useEffect, useRef, memo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDownIcon, ArrowUp, CheckIcon, CopyIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { pushUserMessage, pushLocalUserMessage } from "@/actions/pushUserMessage"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import BackgroundEffects from "./BackgroundEffects"
import { bundledLanguages, type BundledLanguage } from 'shiki'
import useLocalStorage from "@/hooks/useLocalStorage"
import ChatInput from "./ChatInput"

import '@/styles/markdown.css'
import { CodeBlock } from "./CodeBlock"
import models from "@/models/models"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useTheme } from "./ThemeProvider"
import { LoadingDots } from "./ui/loading-dots"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import Image from "next/image"
import featureIcons from "@/models/features"

export default function Chat({ id }: { id: string }) {
  'use no memo'
  const router = useRouter()

  const { user, isLoaded } = useUser()

  // Only query Convex if user is authenticated
  const chat = useQuery(api.chats.getChat, user ? { id: id as Id<"chats"> } : "skip")
  const [localChat, setLocalChat] = useState<{ title: string, messages: any[] } | null>(null)
  
  // Only query messages if user is authenticated
  const messages = useQuery(api.messages.getMessagesForChat, user ? { chatId: id as Id<"chats"> } : "skip")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [previousMessagesLength, setPreviousMessagesLength] = useState(0)
  const [previousLastMessageContent, setPreviousLastMessageContent] = useState("")

  const [selectedModel, setSelectedModel] = useLocalStorage("open3:selectedModel", 0)

  useEffect(() => {
    if (selectedModel > models.length) {
      setSelectedModel(0)
    }
  }, [selectedModel, models])

  // Load chat from localStorage if user is not authenticated
  useEffect(() => {
    if (!isLoaded) return
    if (user) return // Skip if user is authenticated

    const storedChat = localStorage.getItem(`open3:chat:${id}`)
    if (storedChat) {
      const parsedChat = JSON.parse(storedChat)
      setLocalChat(parsedChat)

      // Check if there's an incomplete message that needs streaming
      const lastMessage = parsedChat.messages[parsedChat.messages.length - 1]
      if (lastMessage && lastMessage.role === "assistant" && !lastMessage.isComplete) {
        // Get the user message that triggered this response
        const userMessage = parsedChat.messages[parsedChat.messages.length - 2]
        if (userMessage && userMessage.role === "user") {
          // Start streaming the response
          const streamResponse = async () => {
            const chunks = await pushLocalUserMessage(id, userMessage.content, lastMessage.model)
            let fullResponse = ""
            let fullReasoning = ""

            for await (const chunk of chunks) {
              if (chunk.content) {
                fullResponse += chunk.content
              }
              if (chunk.reasoning) {
                fullReasoning += chunk.reasoning
              }

              // Update the message with new content
              const updatedMessages = parsedChat.messages.map((msg: any) =>
                msg._id === lastMessage._id
                  ? {
                      ...msg,
                      content: fullResponse,
                      reasoning: fullReasoning
                    }
                  : msg
              )

              const updatedChat = {
                ...parsedChat,
                messages: updatedMessages
              }

              setLocalChat(updatedChat)
              localStorage.setItem(`open3:chat:${id}`, JSON.stringify(updatedChat))

              // Add a small delay between chunks to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 10))
            }

            // Mark the message as complete
            const finalMessages = parsedChat.messages.map((msg: any) =>
              msg._id === lastMessage._id
                ? {
                    ...msg,
                    content: fullResponse,
                    reasoning: fullReasoning,
                    isComplete: true
                  }
                : msg
            )

            const finalChat = {
              ...parsedChat,
              messages: finalMessages
            }

            setLocalChat(finalChat)
            localStorage.setItem(`open3:chat:${id}`, JSON.stringify(finalChat))
          }

          streamResponse()
        }
      }
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

  const handleSubmit = async (message: string) => {
    if (user) {
      pushUserMessage(id as Id<"chats">, message, models[selectedModel]!.id)
    } else {
      // Handle unauthenticated user message
      const newMessage = {
        _id: Math.random().toString(36).substring(2, 15),
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      }
      
      // Add user message to chat
      const updatedChat = {
        title: localChat?.title || "New Chat",
        messages: [...(localChat?.messages || []), newMessage]
      }
      
      setLocalChat(updatedChat)
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify(updatedChat))

      // Create AI message placeholder
      const aiMessageId = Math.random().toString(36).substring(2, 15)
      const aiMessage = {
        _id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        model: models[selectedModel]!.id,
        isComplete: false,
        reasoning: ""
      }

      // Add empty AI message to chat
      const chatWithAiMessage = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage]
      }
      
      setLocalChat(chatWithAiMessage)
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify(chatWithAiMessage))

      // Get AI response chunks
      const chunks = await pushLocalUserMessage(id, message, models[selectedModel]!.id)
      
      // Process chunks with a small delay to simulate streaming
      let fullResponse = ""
      let fullReasoning = ""
      for await (const chunk of chunks) {
        if (chunk.content) {
          fullResponse += chunk.content
        }
        if (chunk.reasoning) {
          fullReasoning += chunk.reasoning
        }
        
        // Update AI message with new content and reasoning
        const updatedMessages = chatWithAiMessage.messages.map(msg => 
          msg._id === aiMessageId 
            ? { 
                ...msg, 
                content: fullResponse,
                reasoning: fullReasoning
              }
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

      // Mark the message as complete after all chunks are processed
      const finalMessages = chatWithAiMessage.messages.map(msg => 
        msg._id === aiMessageId 
          ? { ...msg, isComplete: true, content: fullResponse, reasoning: fullReasoning }
          : msg
      )
      
      const finalChat = {
        ...chatWithAiMessage,
        messages: finalMessages
      }
      
      setLocalChat(finalChat)
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify(finalChat))
    }

    setUserHasScrolled(false) // Reset scroll position when sending a message
  }

  // Get messages based on authentication status
  const displayMessages = user ? messages : localChat?.messages

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
              {displayMessages && displayMessages.length > 0 ? displayMessages.map((message) => (
                <div key={message._id} className="w-full">
                  {message.role === "user" ? (
                    // User message with bubble
                    <UserMessage message={message} />
                  ) : (
                    // AI message directly on background
                    <AIMessage message={message} />
                  )}
                </div>
              )) : (
                <div className="w-full h-full mt-24 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Ask me anything...</h1>
                  </div>
                </div>
              )}
              <div className="h-32 w-full bg-transparent" ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Floating Input */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 text-sm sm:text-base">
          <ChatInput 
            onSubmit={handleSubmit}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isStreaming}
          />
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

const UserMessage = ({ message }: { message: { content: string } }) => {
  return (
    <div className="flex justify-end user-message">
      <div className="max-w-[60%] bg-neutral-800 border border-accent/20 text-neutral-100 rounded-2xl px-4 py-3">
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {applyUserCodeBlocks(message.content)}
        </div>
      </div>
    </div>
  )
}

const AIMessage = memo(({ message }: { message: { content: string, model: string, isComplete: boolean, reasoning?: string } }) => {
  return (
    <div className="w-full">
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-100 max-w-[100%] md:max-w-[80%] markdown">
        {message.reasoning === "" && message.content === "" ? (
          <LoadingDots className="mt-2" />
        ) : (
          <>
            {message.reasoning && (
              <Accordion type="single" collapsible className="w-full" defaultValue="reasoning">
                <AccordionItem value="reasoning">
                  <AccordionTrigger className="text-sm text-neutral-300 hover:text-neutral-100 cursor-pointer">Reasoning</AccordionTrigger>
                  <AccordionContent className="text-sm text-neutral-300">
                    {message.reasoning}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
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
          </>
        )}
        <div className="mt-1 text-xs text-neutral-500 flex flex-row items-center gap-1">
          Generated by {models.find((model) => model.id === message.model)?.name}
          {message.isComplete && <CheckIcon className="size-4 text-green-500" />}
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