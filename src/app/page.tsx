"use client"

import { pushUserMessage } from "@/actions/handleMessages"
import BackgroundEffects from "@/components/BackgroundEffects"
import LayoutWithSidebar from "@/components/LayoutWithSidebar"
import { useUser } from "@clerk/nextjs"
import { api } from "../../convex/_generated/api"
import { useMutation } from "convex/react"
import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"
import models from "@/models/models"
import { useTheme } from "@/components/ThemeProvider"
import ChatInput from "@/components/ChatInput"
import useLocalStorage from "@/hooks/useLocalStorage"
import Link from "next/link"

const examples: string[] = [
  "Teach me something I might not know.",
  "Barinstorm unique ideas for my next project.",
  "Help me outline a plan for my personal goals.",
  "Tell me a joke.",
]

const HomePage = () => {
  const { user } = useUser()
  const router = useRouter()
  const { colorTheme } = useTheme()
  const createChat = useMutation(api.chats.createChat)
  const [selectedModel, setSelectedModel] = useLocalStorage("open3:selectedModel", 0)

  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const makeNewChat = async (firstMessage: string = "") => {
    if (!user?.id) {
      const newChatId = generateId()
      const allLocalChatIds = JSON.parse(window.localStorage.getItem("open3:chatIds") ?? "[]")
      allLocalChatIds.push(newChatId)
      window.localStorage.setItem("open3:chatIds", JSON.stringify(allLocalChatIds))
      
      // Initialize chat with empty messages array
      const chatData: {
        title: string;
        messages: Array<{
          role: "user" | "assistant";
          content: string;
          model?: string;
          timestamp?: string;
          _id?: string;
          isComplete?: boolean;
          reasoning?: string;
        }>;
      } = {
        title: "New Chat",
        messages: [],
      }
      
      // If there's a first message, add it to the chat
      if (firstMessage.trim() !== "" && models[selectedModel]) {
        const selectedModelData = models[selectedModel]
        if (!selectedModelData) return

        // Add user message
        const userMessageId = Math.random().toString(36).substring(2, 15)
        chatData.messages.push({
          _id: userMessageId,
          role: "user",
          content: firstMessage,
          model: undefined,
          timestamp: new Date().toISOString()
        })

        // Add empty AI message placeholder
        const aiMessageId = Math.random().toString(36).substring(2, 15)
        chatData.messages.push({
          _id: aiMessageId,
          role: "assistant",
          content: "",
          model: selectedModelData.id,
          timestamp: new Date().toISOString(),
          isComplete: false,
          reasoning: ""
        })

        // Save the chat data before navigation
        window.localStorage.setItem("open3:chat:" + newChatId, JSON.stringify(chatData))
      }
      
      router.push(`/chat/${newChatId}`)
      return
    }

    const newChat = await createChat({ clerkId: user?.id ?? "" })
    if (firstMessage.trim() !== "" && models[selectedModel]) {
      const selectedModelData = models[selectedModel]
      if (!selectedModelData) return
      pushUserMessage(newChat, firstMessage, selectedModelData.id, user.id)
    }

    router.push(`/chat/${newChat}`)
  }

  return (
    <>
      {/* Background Effects */}
      <BackgroundEffects variant="dark" />
      
      <div className="relative w-full h-full max-h-screen max-w-screen overflow-scroll">
        <div className="flex flex-col items-center justify-center h-screen max-w-4xl mx-auto gap-8 sm:gap-12 pb-30 px-4 sm:px-6 relative z-1 pt-6 my-8 sm:pt-2">
          {/* Hero Section */}
          <div className="w-full flex flex-col items-center text-center gap-4 sm:gap-6 mt-4 sm:mt-8">
            <div className="relative">
              <div className={`absolute -inset-1 rounded-full blur-xl bg-accent/20 ${colorTheme}-glow animate-pulse-slow`}></div>
              <div className={`relative size-16 sm:size-20 rounded-full glassmorphic-dark flex items-center justify-center border-accent/30 ${colorTheme}-glow animate-float`}>
                <Sparkles className="size-8 sm:size-10 text-accent" />
              </div>
            </div>
        
            <h1 className="text-4xl sm:text-5xl font-bold text-white flex flex-col lg:flex-row items-center gap-2 mt-4">
              <span>Welcome</span>
              <span className="bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent animate-gradient">to Open3 Chat</span>
            </h1>
        
            <Link href="/about" className="text-base sm:text-lg text-neutral-400 max-w-2xl px-4 hover:text-accent transition-colors">
              About Open3 Chat
            </Link>
          </div>
        
          {/* Examples Section */}
          <div className="w-full px-4 sm:px-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Try asking about...</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {examples.map((example, index) => (
                <div
                  key={index}
                  className={`glassmorphic-dark rounded-xl p-3 sm:p-4 border-accent/10 hover:border-accent/30 cursor-pointer transition-all hover:${colorTheme}-glow-sm duration-300`}
                  onClick={() => makeNewChat(example)}
                  style={{ animationDelay: `${index * 0.5}s` }}
                >
                  <p className="text-white text-sm sm:text-base">{example}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Floating Input */}
      </div>
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 text-sm sm:text-base z-10">
        <ChatInput
          onSubmit={makeNewChat}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          placeholder="Ask anything..."
        />
      </div>
    </>
  )
}
export default HomePage