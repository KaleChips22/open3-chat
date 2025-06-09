"use client"

import { pushUserMessage } from "@/actions/pushUserMessage"
import BackgroundEffects from "@/components/BackgroundEffects"
import LayoutWithSidebar from "@/components/LayoutWithSidebar"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { api } from "convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { ArrowRight, ArrowUp, BrainCircuit, Sparkles, SparklesIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"

const examples: string[] = [
  "How does AI work?",
  "Are black holes real?",
  "How many Rs are in the word \"strawberry\"?",
  "What is the meaning of life?",
]

const HomePage = () => {
  const { user } = useUser()

  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const chats = useQuery(api.chats.getMyChats, {
    clerkId: user?.id ?? ""
  })
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

  const makeNewChat = async (firstMessage: string = "") => {
    if (!user?.id) return

    const newChat = await createChat({ clerkId: user?.id ?? "" })
    if (firstMessage.trim() !== "") {
      pushUserMessage(newChat, firstMessage)
    }

    router.push(`/chat/${newChat}`)
  }

  return (
    <LayoutWithSidebar>
      {/* Background Effects */}
      <BackgroundEffects variant="dark" />
      
      <div className="flex flex-col items-center justify-center min-h-screen max-w-4xl mx-auto gap-12 pb-24 relative z-1">
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center text-center gap-6 mt-8">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full blur-xl bg-accent/20 purple-glow animate-pulse-slow"></div>
            <div className="relative size-20 rounded-full glassmorphic-dark flex items-center justify-center border-accent/30 purple-glow animate-float">
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
            <Button 
              variant="purple" 
              size="lg" 
              className="mt-2 text-lg px-8 py-6 h-auto animate-shine"
              onClick={() => document.querySelector('[data-clerk-sign-in]')?.dispatchEvent(new Event('click', { bubbles: true }))}
            >
              Get Started
              <ArrowRight className="ml-2" />
            </Button>
          )}
        </div>
        
        {/* Examples Section */}
        <div className="w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Try asking about...</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {examples.map((example, index) => (
              <div 
                key={index} 
                className="glassmorphic-dark rounded-xl p-4 border-accent/10 hover:border-accent/30 cursor-pointer transition-all hover:purple-glow-sm duration-300"
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
            className="absolute right-3 bottom-3 bg-accent/20 backdrop-blur-md border border-accent/30 hover:bg-accent/30 text-neutral-100 disabled:opacity-50 rounded-lg size-9 p-0 flex items-center justify-center cursor-pointer purple-glow-sm"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}
export default HomePage