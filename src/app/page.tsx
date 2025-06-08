"use client"

import LayoutWithSidebar from "@/components/LayoutWithSidebar"
import { Button } from "@/components/ui/button"
import type { ChatType, MessageType } from "@/lib/types"
import { ArrowUp } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"

const examples: string[] = [
  "How does AI work?",
  "Are black holes real?",
  "How many Rs are in the word \"strawberry\"?",
  "What is the meaning of life?",
]

const HomePage = () => {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [chats, setChats] = useState<ChatType[]>([])
  const router = useRouter()

  useEffect(() => {
    const loadedChats = localStorage.getItem('open3:chats')
    if (loadedChats) {
      setChats(JSON.parse(loadedChats) as ChatType[])
    } else {
      localStorage.setItem('open3:chats', JSON.stringify([]))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('open3:chats', JSON.stringify(chats))
  }, [chats])

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

  const makeNewChat = (firstMessage: string = "") => {
    const newId = Math.random().toString(36).substring(2, 15)
    const newMessage: MessageType = {
      id: Math.random().toString(36).substring(2, 15),
      content: firstMessage,
      role: 'user'
    }

    const newChat: ChatType = {
      id: newId,
      name: 'New Chat',
      messages: firstMessage.trim() !== "" ? [newMessage] : []
    }
    setChats(current => [...current, newChat])

    localStorage.setItem('open3:chats', JSON.stringify([...chats, newChat]))
    router.push(`/chat/${newId}`)
  }

  return (
    <LayoutWithSidebar>
      <div className="flex flex-col items-baseline justify-center h-screen max-w-2xl mx-auto gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-white"> Welcome to Open3 Chat</h1>
          <p className="text-lg text-white">
            Open3 Chat is an open source LLM chat application built for <a href="https://cloneathon.t3.chat/" target="_blank" className="text-blue-400 hover:underline">Theo's T3 Chat Cloneathon</a>
          </p>
        </div>
        <hr className="border-neutral-700 w-full" />
        <div className="flex flex-col gap-4 w-full mx-auto">
          <h2 className="text-2xl font-bold text-white">Examples</h2>
          <div className="flex flex-col gap-2">
            {examples.map((example, index: number) => (
              <React.Fragment key={index}>
              <div className="flex flex-row gap-2">
                <div className="text-white py-2 px-4 hover:bg-neutral-800/60 rounded-md w-full cursor-pointer transition-all" onClick={() => {
                    setInput(example)
                    resizeInput()
                    inputRef.current?.focus()
                }}>
                  {example}
                </div>
                </div>
                {index !== examples.length - 1 && <hr className="border-neutral-700/20 w-full" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>


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
              placeholder="Ask anything..."
              rows={1}
              className="w-full bg-black/15 backdrop-blur-md border border-white/10 focus:border-purple-400/50 text-neutral-100 placeholder:text-neutral-400 rounded-xl px-6 py-4 pr-16 resize-none focus:outline-none focus:ring-0 min-h-[56px] max-h-64 overflow-y-auto scrollbar-hide"
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
              className="absolute right-3 bottom-3 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 hover:bg-purple-500/30 text-neutral-100 disabled:opacity-50 rounded-lg size-9 p-0 flex items-center justify-center cursor-pointer"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
    </LayoutWithSidebar>
  )
}
export default HomePage