"use client"

import { pushUserMessage } from "@/actions/pushUserMessage"
import BackgroundEffects from "@/components/BackgroundEffects"
import LayoutWithSidebar from "@/components/LayoutWithSidebar"
import { Button } from "@/components/ui/button"
import { useClerk, useUser } from "@clerk/nextjs"
import { api } from "../../convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { ArrowRight, ArrowUp, BrainCircuit, Sparkles, SparklesIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import models from "@/models/models"
import { useTheme } from "@/components/ThemeProvider"

const examples: string[] = [
  "How does AI work?",
  "Are black holes real?",
  "How many Rs are in the word \"strawberry\"?",
  "What is the meaning of life?",
]

const HomePage = () => {
  const { user } = useUser()
  const { openSignIn } = useClerk()

  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const { colorTheme } = useTheme()

  const createChat = useMutation(api.chats.createChat)

  const resizeInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = inputRef.current.scrollHeight + "px"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() === "") return

    makeNewChat(input)
  }

  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const makeNewChat = async (firstMessage: string = "") => {
    if (!user?.id) {
      const newChatId = generateId()
      const allLocalChatIds = JSON.parse(window.localStorage.getItem("open3:chatIds") ?? "[]")
      allLocalChatIds.push(newChatId)
      window.localStorage.setItem("open3:chatIds", JSON.stringify(allLocalChatIds))
      window.localStorage.setItem("open3:chat:" + newChatId, JSON.stringify({
        title: "New Chat",
        messages: [],
      }))
      router.push(`/chat/${newChatId}`)
      return
    }

    const newChat = await createChat({ clerkId: user?.id ?? "" })
    if (firstMessage.trim() !== "") {
      pushUserMessage(newChat, firstMessage, models[2]!.id)
    }

    router.push(`/chat/${newChat}`)
  }

  return (
    <LayoutWithSidebar>
      {/* Background Effects */}
      <BackgroundEffects variant="dark" />
      
      <div className="flex flex-col items-center justify-center min-h-screen max-w-4xl mx-[max(1rem,auto)] gap-12 pb-24 relative z-1">
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center text-center gap-6 mt-8">
          <div className="relative">
            <div className={`absolute -inset-1 rounded-full blur-xl bg-accent/20 ${colorTheme}-glow animate-pulse-slow`}></div>
            <div className={`relative size-20 rounded-full glassmorphic-dark flex items-center justify-center border-accent/30 ${colorTheme}-glow animate-float`}>
              <Sparkles className="size-10 text-accent" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-white flex flex-col items-center gap-2 mt-4">
            <span>Welcome{user ? `, ${user.firstName}` : ''}</span>
            <span className="bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent animate-gradient">to Open3 Chat</span>
          </h1>
          
          <p className="text-xl text-neutral-300 max-w-2xl">
            An intelligent conversation partner powered by state-of-the-art language models. Ask anything and get thoughtful, accurate responses.
          </p>
          
          {!user && (
            <div className="flex flex-col gap-4 items-center justify-center">
              <Button 
                variant="purple" 
                size="lg" 
                className="mt-2 text-lg px-8 py-4 h-auto cursor-pointer w-full"
                onClick={() => makeNewChat()}
              >
                Get Started
                <ArrowRight className="ml-2" />
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-lg px-8 py-2 h-auto cursor-pointer border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-100/5 hover:text-neutral-100 w-full"
                onClick={() => openSignIn()}
              >
                Sign In
                <ArrowRight className="ml-2" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Examples Section */}
        <div className="w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Try asking about...</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {examples.map((example, index) => (
              <div 
                key={index} 
                className={`glassmorphic-dark rounded-xl p-4 border-accent/10 hover:border-accent/30 cursor-pointer transition-all hover:${colorTheme}-glow-sm duration-300`}
                onClick={() => {
                  setInput(example)
                  resizeInput()
                  inputRef.current?.focus()
                }}
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <p className="text-white">{example}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Input */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 text-sm sm:text-base z-10">
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
            placeholder="Ask anything..."
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
            disabled={!input.trim()}
            className={`absolute right-3 bottom-3 bg-accent/20 backdrop-blur-md border border-accent/30 hover:bg-accent/30 text-neutral-100 disabled:opacity-50 rounded-lg size-9 p-0 flex items-center justify-center cursor-pointer ${colorTheme}-glow-sm`}
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}
export default HomePage