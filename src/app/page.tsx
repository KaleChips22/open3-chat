"use client"

import { pushUserMessage } from "@/actions/pushUserMessage"
import LayoutWithSidebar from "@/components/LayoutWithSidebar"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { api } from "convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { ArrowUp, Sparkles, Zap, Brain, MessageSquare } from "lucide-react"
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
      <div className="flex flex-col items-center justify-center h-screen max-w-4xl mx-auto gap-12 px-6">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 glow">
              <Sparkles className="size-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold gradient-text">
              Open3 Chat
            </h1>
          </div>
          
          <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
            Welcome{user && `, ${user.firstName},`} to the future of AI conversation. Built for{" "}
            <a 
              href="https://cloneathon.t3.chat/" 
              target="_blank" 
              className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/50 hover:decoration-purple-400 transition-all duration-200"
            >
              Theo's T3 Chat Cloneathon
            </a>
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
            <div className="glass-subtle rounded-2xl p-6 text-center group hover:glass transition-all duration-300">
              <Brain className="size-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white mb-2">Smart AI</h3>
              <p className="text-slate-400 text-sm">Advanced language models at your fingertips</p>
            </div>
            <div className="glass-subtle rounded-2xl p-6 text-center group hover:glass transition-all duration-300">
              <Zap className="size-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-slate-400 text-sm">Instant responses with real-time streaming</p>
            </div>
            <div className="glass-subtle rounded-2xl p-6 text-center group hover:glass transition-all duration-300">
              <MessageSquare className="size-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white mb-2">Natural Chat</h3>
              <p className="text-slate-400 text-sm">Conversational AI that understands context</p>
            </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className="w-full max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Try asking about...</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examples.map((example, index: number) => (
              <div 
                key={index}
                className="glass-subtle hover:glass text-slate-200 py-4 px-6 rounded-xl cursor-pointer transition-all duration-200 group border border-purple-500/20 hover:border-purple-400/40"
                onClick={() => {
                  setInput(example)
                  resizeInput()
                  inputRef.current?.focus()
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 group-hover:bg-purple-300 transition-colors"></div>
                  <span className="group-hover:text-white transition-colors">{example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
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
            placeholder="Ask anything..."
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
    </LayoutWithSidebar>
  )
}

export default HomePage