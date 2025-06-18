"use client"

import React, { useMemo, useCallback } from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDownIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { pushUserMessage, pushLocalUserMessage } from "@/actions/handleMessages"
import BackgroundEffects from "./BackgroundEffects"
import useLocalStorage from "@/hooks/useLocalStorage"
import ChatInput from "./ChatInput"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import { generateNextCompletion } from "@/models/index"

import '@/styles/markdown.css'
import models from "@/models/models"
import UserMessage from "./UserMessage"
import AIMessage from "./AIMessage"
import generateId from "@/lib/generateId"

// Global streaming state management
const STREAMING_STATE_KEY = "open3:streamingState"

interface StreamingState {
  chatId: string
  messageId: string
  isStreaming: boolean
  content: string
  reasoning: string
}

const getStreamingState = (): StreamingState | null => {
  if (typeof window === 'undefined') return null
  const state = localStorage.getItem(STREAMING_STATE_KEY)
  return state ? JSON.parse(state) : null
}

const setStreamingState = (state: StreamingState | null) => {
  if (typeof window === 'undefined') return
  if (state) {
    localStorage.setItem(STREAMING_STATE_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(STREAMING_STATE_KEY)
  }
}

export default function Chat({ id }: { id: string }) {
  'use no memo'
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const isStreamingRef = useRef(false)

  const branchChat = useMutation(api.chats.branchChat)

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
    if (selectedModel >= models.length) {
      setSelectedModel(0)
    }
  }, [selectedModel, models])

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

  // Check for ongoing streaming state when component mounts
  useEffect(() => {
    if (user) return // Skip for authenticated users
    
    const streamingState = getStreamingState()
    if (streamingState && streamingState.chatId === id && streamingState.isStreaming) {
      setIsStreaming(true)
      setLastMessageId(streamingState.messageId)
      isStreamingRef.current = true
    }
  }, [id, user])

  // Poll for streaming state updates
  useEffect(() => {
    if (user) return // Skip for authenticated users
    
    const pollInterval = setInterval(() => {
      const streamingState = getStreamingState()
      if (streamingState && streamingState.chatId === id) {
        if (streamingState.isStreaming) {
          setIsStreaming(true)
          setLastMessageId(streamingState.messageId)
          
          // Update local chat with streaming content
          if (localChat) {
            const updatedMessages = localChat.messages.map(msg => 
              msg._id === streamingState.messageId 
                ? { 
                    ...msg, 
                    content: streamingState.content,
                    reasoning: streamingState.reasoning
                  }
                : msg
            )
            
            const updatedChat = {
              ...localChat,
              messages: updatedMessages
            }
            
            setLocalChat(updatedChat)
          }
        } else {
          // Streaming finished
          setIsStreaming(false)
          isStreamingRef.current = false
          setStreamingState(null)
          
          // Reload chat from localStorage to get final state
          const storedChat = localStorage.getItem(`open3:chat:${id}`)
          if (storedChat) {
            setLocalChat(JSON.parse(storedChat))
          }
        }
      }
    }, 100) // Poll every 100ms for smooth updates

    return () => clearInterval(pollInterval)
  }, [id, user, localChat])

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

  // Handle streaming for new chats with empty AI messages
  useEffect(() => {
    if (!localChat?.messages || localChat.messages.length === 0) return
    if (isStreamingRef.current) return // Prevent multiple streams
    
    const lastMessage = localChat.messages[localChat.messages.length - 1]
    if (lastMessage.role === "assistant" && !lastMessage.isComplete && lastMessage.content === "") {
      const previousMessage = localChat.messages[localChat.messages.length - 2]
      if (!previousMessage || previousMessage.role !== "user") return

      // Only start streaming if this is a new message that wasn't just created
      // This prevents duplicate streaming when handleSubmit is already handling it
      const messageAge = Date.now() - new Date(lastMessage.timestamp).getTime()
      
      // Check if this is a new chat from home page
      const isNewChatFromHome = localChat.messages.length === 2 && 
                               previousMessage.role === "user" && 
                               lastMessage.role === "assistant" &&
                               lastMessage.content === "";

      // For new chats from home page, allow a longer time window (5 seconds)
      // For other cases, use a shorter time window (1 second) to prevent duplicate streaming
      const timeWindow = isNewChatFromHome ? 5000 : 1000;
      
      // If the message is too recent and it's not a new chat from home page, skip
      if (!isNewChatFromHome && messageAge < timeWindow) return;

      // Check if this message is already being handled by handleSubmit
      if (lastMessage._id === lastMessageId) return;

      // Start streaming the response
      const streamResponse = async () => {
        if (isStreamingRef.current) return // Double check before starting
        isStreamingRef.current = true
        setIsStreaming(true)
        setLastMessageId(lastMessage._id)
        
        // Set global streaming state
        setStreamingState({
          chatId: id,
          messageId: lastMessage._id,
          isStreaming: true,
          content: "",
          reasoning: ""
        })
        
        try {
          const userBYOK = window.localStorage.getItem("open3:openRouterApiKey")
          
          // Filter out empty assistant messages to avoid sending them to the API
          const messagesForApi = localChat.messages.filter(msg => 
            msg.role === "user" || (msg.role === "assistant" && msg.content !== "")
          )
          
          const chatDataForApi = {
            ...localChat,
            messages: messagesForApi
          }
          
          const chunks = await pushLocalUserMessage(id, previousMessage.content, models[selectedModel]!.id, chatDataForApi, userBYOK, {
            customPrompt: JSON.parse(window.localStorage.getItem("open3:customPrompt") || "false"),
            customPromptText: window.localStorage.getItem("open3:customPromptText") || ""
          })
          
          let fullResponse = ""
          let fullReasoning = ""
          
          for await (const chunk of chunks) {
            if (!isStreamingRef.current) break // Stop if streaming was cancelled
            
            if (chunk.content) {
              fullResponse += chunk.content
            }
            if (chunk.reasoning) {
              fullReasoning += chunk.reasoning
            }
            
            // Update global streaming state
            setStreamingState({
              chatId: id,
              messageId: lastMessage._id,
              isStreaming: true,
              content: fullResponse,
              reasoning: fullReasoning
            })
            
            // Update the AI message with new content
            const updatedMessages = localChat.messages.map(msg => 
              msg._id === lastMessage._id 
                ? { 
                    ...msg, 
                    content: fullResponse,
                    reasoning: fullReasoning
                  }
                : msg
            )
            
            const updatedChat = {
              ...localChat,
              messages: updatedMessages
            }
            
            setLocalChat(updatedChat)
            localStorage.setItem(`open3:chat:${id}`, JSON.stringify(updatedChat))
            
            // Add a small delay between chunks to simulate streaming
            // await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Only mark as complete if we're still streaming (weren't cancelled)
          if (isStreamingRef.current) {
            const finalMessages = localChat.messages.map(msg => 
              msg._id === lastMessage._id 
                ? { ...msg, isComplete: true, content: fullResponse, reasoning: fullReasoning }
                : msg
            )
            
            const finalChat = {
              ...localChat,
              messages: finalMessages
            }
            
            setLocalChat(finalChat)
            localStorage.setItem(`open3:chat:${id}`, JSON.stringify(finalChat))
          }
        } finally {
          isStreamingRef.current = false
          setIsStreaming(false)
          setStreamingState(null) // Clear global streaming state
        }
      }

      streamResponse()
    }
  }, [localChat, id])

  // Cleanup streaming state when component unmounts
  useEffect(() => {
    return () => {
      isStreamingRef.current = false
      setIsStreaming(false)
    }
  }, [])

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

  // Memoize handler functions to prevent unnecessary re-renders
  const handleMessageRegenerate = useCallback(async (messageId: string) => {
    if (user) {
      // For authenticated users
      // Find the index of the message to regenerate from
      const messageIndex = messages?.findIndex(m => m._id === messageId) || -1
      if (messageIndex === -1) return

      // Get the message to regenerate from
      const messageToRegenerateFrom = messages?.[messageIndex]
      if (!messageToRegenerateFrom || messageToRegenerateFrom.role !== "user") return

      // Get all messages that need to be deleted (only the AI response after the user message)
      const messagesToDelete = messages?.slice(messageIndex + 1) || []
      
      // Delete all messages after this user message (the AI responses)
      for (const message of messagesToDelete) {
        await fetchMutation(api.messages.deleteMessage, { id: message._id })
      }
      
      // Create a new AI message directly instead of pushing a user message
      const newAiMessage = await fetchMutation(api.messages.createMessage, {
        chatId: id as Id<"chats">,
        content: "",
        role: "assistant",
        model: models[selectedModel]!.id,
        reasoning: ""
      })

      // Get the updated messages list (without the deleted AI responses)
      const updatedMessages = await fetchQuery(api.messages.getMessagesForChat, {
        chatId: id as Id<"chats">,
      })

      // Get user settings
      const userSettings = await fetchQuery(api.userSettings.get, {
        clerkId: user.id
      })

      const userBYOK = userSettings?.openRouterApiKey || null
      const systemPromptDetails = {
        customPrompt: userSettings?.customPrompt || false,
        customPromptText: userSettings?.customPromptText || ""
      }

      // Generate the AI response
      const aiResponse = await generateNextCompletion(
        userBYOK !== null && userBYOK !== "" ? models[selectedModel]!.id : (models.find((val) => val.id === models[selectedModel]!.id)?.features.includes('free') ? models[selectedModel]!.id : 'deepseek/deepseek-chat-v3-0324:free'),
        updatedMessages.map((message: any) => ({
          role: message.role,
          content: message.content
        })),
        userBYOK,
        systemPromptDetails
      )

      if ('error' in aiResponse && aiResponse.error === true) {
        await fetchMutation(api.messages.appendMessage, {
          id: newAiMessage,
          content: `Error processing your request: ${aiResponse.message}`
        })
        return
      }

      for await (const chunk of aiResponse.fullStream) {
        if (!chunk) continue
        
        if (chunk.type === 'text-delta') {
          await fetchMutation(api.messages.appendMessage, {
            id: newAiMessage,
            content: chunk.textDelta
          })
        } else if (chunk.type === 'reasoning') {
          // Handle reasoning if the model provides it
          await fetchMutation(api.messages.appendReasoning, {
            id: newAiMessage,
            reasoning: chunk.textDelta
          })
        }
      }

      await fetchMutation(api.messages.completeMessage, {
        id: newAiMessage
      })

    } else {
      // For unauthenticated users
      if (!localChat) return

      // Find the index of the message to regenerate from
      const messageIndex = localChat.messages.findIndex(m => m._id === messageId)
      if (messageIndex === -1) return

      // Get the message to regenerate from
      const messageToRegenerateFrom = localChat.messages[messageIndex]
      if (!messageToRegenerateFrom || messageToRegenerateFrom.role !== "user") return

      // Keep only messages up to and including the selected user message
      const messagesToKeep = localChat.messages.slice(0, messageIndex + 1)
      
      // Update local chat with truncated messages
      const updatedChat = {
        ...localChat,
        messages: messagesToKeep
      }
      
      setLocalChat(updatedChat)
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify(updatedChat))

      // Create AI message placeholder
      const aiMessageId = generateId()
      const aiMessage = {
        _id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(new Date().valueOf() + 100).toISOString(),
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

      // Set streaming state before starting response generation
      isStreamingRef.current = true
      setIsStreaming(true)
      setLastMessageId(aiMessageId)

      // Set global streaming state
      setStreamingState({
        chatId: id,
        messageId: aiMessageId,
        isStreaming: true,
        content: "",
        reasoning: ""
      })

      try {
        // Get user settings from local storage
        const userBYOK = window.localStorage.getItem("open3:openRouterApiKey")
        const systemPromptDetails = {
          customPrompt: JSON.parse(window.localStorage.getItem("open3:customPrompt") || "false"),
          customPromptText: window.localStorage.getItem("open3:customPromptText") || ""
        }

        // Get AI response chunks
        const chunks = await pushLocalUserMessage(
          id, 
          messageToRegenerateFrom.content, 
          models[selectedModel]!.id,
          updatedChat,
          userBYOK,
          systemPromptDetails
        )
        
        let fullResponse = ""
        let fullReasoning = ""
        
        for await (const chunk of chunks) {
          if (!isStreamingRef.current) break // Stop if streaming was cancelled
          
          if (chunk.content) {
            fullResponse += chunk.content
          }
          if (chunk.reasoning) {
            fullReasoning += chunk.reasoning
          }
          
          // Update global streaming state
          setStreamingState({
            chatId: id,
            messageId: aiMessageId,
            isStreaming: true,
            content: fullResponse,
            reasoning: fullReasoning
          })
          
          // Update AI message with new content
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
        }

        // Mark the message as complete
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
      } finally {
        isStreamingRef.current = false
        setIsStreaming(false)
        setStreamingState(null) // Clear global streaming state
      }
    }

    setUserHasScrolled(false) // Reset scroll position when regenerating a message
  }, [user, localChat, id, selectedModel])

  const handleMessageEdit = useCallback(async (messageId: string, newMessage: string) => {
    if (user) {
      // For authenticated users
      // Find the index of the message to edit
      const messageIndex = messages?.findIndex(m => m._id === messageId) || -1
      if (messageIndex === -1) return

      // Get the message to edit
      const messageToEdit = messages?.[messageIndex]
      if (!messageToEdit || messageToEdit.role !== "user") return
      
      // Get all messages that need to be deleted (the edited message and everything after it)
      const messagesToDelete = messages?.slice(messageIndex) || []
      
      // Delete all messages after and including the edited one
      for (const message of messagesToDelete) {
        await fetchMutation(api.messages.deleteMessage, { id: message._id })
      }
      
      // Push the edited user message to trigger a new AI response
      pushUserMessage(id as Id<"chats">, newMessage, models[selectedModel]!.id, user.id)
    } else {
      // For unauthenticated users
      if (!localChat) return

      // Find the index of the message to edit
      const messageIndex = localChat.messages.findIndex(m => m._id === messageId)
      if (messageIndex === -1) return

      // Get the message to edit
      const messageToEdit = localChat.messages[messageIndex]
      if (!messageToEdit || messageToEdit.role !== "user") return

      // Create a new message with the edited content but keep the same ID
      const editedMessage = {
        ...messageToEdit,
        content: newMessage
      }

      // Keep only messages up to the edited message (exclusive)
      const messagesToKeep = localChat.messages.slice(0, messageIndex)
      
      // Update local chat with truncated messages plus the edited message
      const updatedChat = {
        ...localChat,
        messages: [...messagesToKeep, editedMessage]
      }
      
      setLocalChat(updatedChat)
      localStorage.setItem(`open3:chat:${id}`, JSON.stringify(updatedChat))

      // Create AI message placeholder
      const aiMessageId = generateId()
      const aiMessage = {
        _id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(new Date().valueOf() + 100).toISOString(),
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

      // Set streaming state before starting response generation
      isStreamingRef.current = true
      setIsStreaming(true)
      setLastMessageId(aiMessageId)

      // Set global streaming state
      setStreamingState({
        chatId: id,
        messageId: aiMessageId,
        isStreaming: true,
        content: "",
        reasoning: ""
      })

      try {
        // Get user settings from local storage
        const userBYOK = window.localStorage.getItem("open3:openRouterApiKey")
        const systemPromptDetails = {
          customPrompt: JSON.parse(window.localStorage.getItem("open3:customPrompt") || "false"),
          customPromptText: window.localStorage.getItem("open3:customPromptText") || ""
        }

        // Get AI response chunks
        const chunks = await pushLocalUserMessage(
          id, 
          newMessage, 
          models[selectedModel]!.id,
          updatedChat,
          userBYOK,
          systemPromptDetails
        )
        
        let fullResponse = ""
        let fullReasoning = ""
        
        for await (const chunk of chunks) {
          if (!isStreamingRef.current) break // Stop if streaming was cancelled
          
          if (chunk.content) {
            fullResponse += chunk.content
          }
          if (chunk.reasoning) {
            fullReasoning += chunk.reasoning
          }
          
          // Update global streaming state
          setStreamingState({
            chatId: id,
            messageId: aiMessageId,
            isStreaming: true,
            content: fullResponse,
            reasoning: fullReasoning
          })
          
          // Update AI message with new content
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
        }

        // Mark the message as complete
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
      } finally {
        isStreamingRef.current = false
        setIsStreaming(false)
        setStreamingState(null) // Clear global streaming state
      }
    }

    setUserHasScrolled(false) // Reset scroll position when editing a message
  }, [user, localChat, id, selectedModel])

  const handleMessageBranch = useCallback(async (messageId: string) => {
    if (user) {
      const newChatId = await branchChat({
        clerkId: user.id,
        chatId: id as Id<"chats">,
        messageId: messageId as Id<"messages">,
      })

      const baseMessage = messages?.find((m) => m._id === messageId)

      // Only push a user message and generate AI response if we're branching from a user message
      if (baseMessage?.role === "user") {
        pushUserMessage(newChatId as Id<"chats">, baseMessage.content || "", models[selectedModel]!.id, user.id)
      }

      router.push(`/chat/${newChatId}`)
    } else {
      if (!localChat) return

      const newChatId = generateId()
      const allLocalChatIds = JSON.parse(localStorage.getItem("open3:chatIds") || "[]") as string[]
      allLocalChatIds.push(newChatId)
      localStorage.setItem("open3:chatIds", JSON.stringify(allLocalChatIds))

      let messagesToSend: any[] = []

      const baseMessage = localChat.messages.find((m) => m._id === messageId)
      if (!baseMessage) return

      for (const message of localChat.messages || []) {
        if ((new Date(message.timestamp)).valueOf() <= (new Date(baseMessage.timestamp)).valueOf()) {
          messagesToSend.push(message)
        }
      }

      const newChat = {
        title: "New Chat",
        messages: messagesToSend
      }
      localStorage.setItem(`open3:chat:${newChatId}`, JSON.stringify(newChat))

      // Navigate to the new chat first
      router.push(`/chat/${newChatId}`)

      // Only add an AI message and generate a response if we're branching from a user message
      if (baseMessage.role === "user") {
        // Create AI message placeholder for the branched chat
        const aiMessageId = generateId()
        const aiMessage = {
          _id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(new Date().valueOf() + 100).toISOString(),
          model: models[selectedModel]!.id,
          isComplete: false,
          reasoning: ""
        }

        // Add empty AI message to the branched chat
        const chatWithAiMessage = {
          ...newChat,
          messages: [...newChat.messages, aiMessage]
        }
        
        localStorage.setItem(`open3:chat:${newChatId}`, JSON.stringify(chatWithAiMessage))

        // Get user settings from local storage
        const userBYOK = window.localStorage.getItem("open3:openRouterApiKey")
        const systemPromptDetails = {
          customPrompt: JSON.parse(window.localStorage.getItem("open3:customPrompt") || "false"),
          customPromptText: window.localStorage.getItem("open3:customPromptText") || ""
        }

        // Set global streaming state for the branched chat
        setStreamingState({
          chatId: newChatId,
          messageId: aiMessageId,
          isStreaming: true,
          content: "",
          reasoning: ""
        })

        // Generate response for the branched chat
        try {
          const chunks = await pushLocalUserMessage(
            newChatId, 
            baseMessage.content || "", 
            models[selectedModel]!.id,
            newChat,
            userBYOK,
            systemPromptDetails
          )
          
          let fullResponse = ""
          let fullReasoning = ""
          
          for await (const chunk of chunks) {
            if (chunk.content) {
              fullResponse += chunk.content
            }
            if (chunk.reasoning) {
              fullReasoning += chunk.reasoning
            }
            
            // Update global streaming state
            setStreamingState({
              chatId: newChatId,
              messageId: aiMessageId,
              isStreaming: true,
              content: fullResponse,
              reasoning: fullReasoning
            })
            
            // Update the AI message with new content
            const updatedMessages = chatWithAiMessage.messages.map(msg => 
              msg._id === aiMessageId 
                ? { 
                    ...msg, 
                    content: fullResponse,
                    reasoning: fullReasoning
                  }
                : msg
            )
            
            const updatedChat = {
              ...chatWithAiMessage,
              messages: updatedMessages
            }
            
            localStorage.setItem(`open3:chat:${newChatId}`, JSON.stringify(updatedChat))
          }

          // Mark the message as complete
          const finalMessages = chatWithAiMessage.messages.map(msg => 
            msg._id === aiMessageId 
              ? { ...msg, isComplete: true, content: fullResponse, reasoning: fullReasoning }
              : msg
          )
          
          const finalChat = {
            ...chatWithAiMessage,
            messages: finalMessages
          }
          
          localStorage.setItem(`open3:chat:${newChatId}`, JSON.stringify(finalChat))
        } catch (error) {
          console.error("Error generating response for branched chat:", error)
          // If there's an error, still mark the message as complete with an error message
          const errorMessages = chatWithAiMessage.messages.map(msg => 
            msg._id === aiMessageId 
              ? { ...msg, isComplete: true, content: "Error generating response. Please try again.", reasoning: "" }
              : msg
          )
          
          const errorChat = {
            ...chatWithAiMessage,
            messages: errorMessages
          }
          
          localStorage.setItem(`open3:chat:${newChatId}`, JSON.stringify(errorChat))
        } finally {
          // Clear global streaming state
          setStreamingState(null)
        }
      }
    }
  }, [user, localChat, id, selectedModel, branchChat])

  const handleSubmit = useCallback(async (message: string) => {
    if (user) {
      pushUserMessage(id as Id<"chats">, message, models[selectedModel]!.id, user.id)
    } else {
      // Get user settings from local storage
      const userBYOK = window.localStorage.getItem("open3:openRouterApiKey")

      const systemPromptDetails = {
        customPrompt: JSON.parse(window.localStorage.getItem("open3:customPrompt") || "false"),
        customPromptText: window.localStorage.getItem("open3:customPromptText") || ""
      }

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
      const aiMessageId = generateId()
      const aiMessage = {
        _id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(new Date().valueOf() + 100).toISOString(),
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

      // Set streaming state before starting response generation
      isStreamingRef.current = true
      setIsStreaming(true)
      setLastMessageId(aiMessageId)

      // Set global streaming state
      setStreamingState({
        chatId: id,
        messageId: aiMessageId,
        isStreaming: true,
        content: "",
        reasoning: ""
      })

      try {
        // Get AI response chunks with custom API key and system prompt
        const chunks = await pushLocalUserMessage(
          id, 
          message, 
          models[selectedModel]!.id,
          updatedChat,
          userBYOK,
          systemPromptDetails
        )
        
        // Process chunks with a small delay to simulate streaming
        let fullResponse = ""
        let fullReasoning = ""
        for await (const chunk of chunks) {
          if (!isStreamingRef.current) break // Stop if streaming was cancelled
          
          if (chunk.content) {
            fullResponse += chunk.content
          }
          if (chunk.reasoning) {
            fullReasoning += chunk.reasoning
          }
          
          // Update global streaming state
          setStreamingState({
            chatId: id,
            messageId: aiMessageId,
            isStreaming: true,
            content: fullResponse,
            reasoning: fullReasoning
          })
          
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
      } finally {
        isStreamingRef.current = false
        setIsStreaming(false)
        setStreamingState(null) // Clear global streaming state
      }
    }

    setUserHasScrolled(false) // Reset scroll position when sending a message
  }, [user, localChat, id, selectedModel]);

  // Get messages based on authentication status
  const displayMessages = user ? messages : localChat?.messages

  // Memoize the message components to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => {
    if (!displayMessages || displayMessages.length === 0) {
      return (
        <div className="w-full h-full mt-24 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Ask me anything...</h1>
          </div>
        </div>
      )
    }
    
    return displayMessages.map((message) => (
      <div key={`${message._id}-${message.content.length}`} className="w-full">
        {message.role === "user" ? (
          <UserMessage
            onMessageRegenerate={() => handleMessageRegenerate(message._id)}
            onMessageEdit={(newMessage: string) => handleMessageEdit(message._id, newMessage)}
            onMessageBranch={() => handleMessageBranch(message._id)}
            message={message}
          />
        ) : (
          <AIMessage 
            message={message} 
            onMessageBranch={() => handleMessageBranch(message._id)} 
          />
        )}
      </div>
    ))
  }, [displayMessages, handleMessageRegenerate, handleMessageEdit, handleMessageBranch])

  return (
    <div className="h-full w-full flex flex-col bg-neutral-950 text-neutral-100 relative">
      {/* Background Effects */}
      <BackgroundEffects variant="dark" />
      
      {/* Chat Container */}
      <div className="relative h-full">
        {/* Chat Messages */}
        <div className="h-full">
          <ScrollArea className="min-h-screen h-full p-6" ref={scrollAreaRef} type="hidden">
            <div className="max-w-4xl mx-auto space-y-6 pt-8">
              {memoizedMessages}
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
          <Button variant="default" size="icon" className="cursor-pointer rounded-full bg-neutral-900 border-neutral-600 hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-300 text-neutral-300 hover:text-neutral-100" onClick={scrollToBottom}>
            <ArrowDownIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}