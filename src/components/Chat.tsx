"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Bot, User } from "lucide-react"
import { ScrollArea } from "@/components/scroll-area"
import type { ChatType, MessageType } from "@/lib/types"

// Mock data for demonstration
const mockMessages: MessageType[] = [
  {
    id: "1",
    role: "assistant" as const,
    content: "Hello! I'm your AI assistant. How can I help you today?",
  },
  {
    id: "2",
    role: "user" as const,
    content: "Can you help me understand machine learning?",
  },
  {
    id: "3",
    role: "assistant" as const,
    content:
      "Absolutely! Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every scenario. It's like teaching a computer to recognize patterns and make predictions based on examples.\n\nThere are three main types:\n• **Supervised learning** (learning from labeled examples)\n• **Unsupervised learning** (finding patterns in unlabeled data)\n• **Reinforcement learning** (learning through trial and error)\n\nWould you like me to dive deeper into any of these areas?",
  },
  {
    id: "4",
    role: "user" as const,
    content: "That's really helpful! Can you give me a simple example of supervised learning?",
  },
  {
    id: "5",
    role: "assistant" as const,
    content:
      "Great question! Here's a simple example:\n\nImagine you want to teach a computer to recognize whether an email is spam or not spam. You would:\n\n1. **Collect training data**: Gather thousands of emails that are already labeled as 'spam' or 'not spam'\n\n2. **Extract features**: The computer looks at features like:\n   • Certain words (\"FREE!\", \"URGENT!\")\n   • Sender information\n   • Subject line patterns\n   • Number of exclamation marks\n\n3. **Train the model**: The algorithm learns patterns from these labeled examples\n\n4. **Make predictions**: When a new email arrives, the model uses what it learned to predict if it's spam or not\n\nThe key is that we're giving the computer examples with the \"right answers\" (labels) so it can learn to make similar decisions on new, unseen data!",
  },
]

export default function Chat({ id }: { id: string }) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const loadedChats = localStorage.getItem(`open3:chats`)
    if (loadedChats) {
      const chats = JSON.parse(loadedChats) as ChatType[]
      const chat = chats.find((chat) => chat.id === id)
      if (chat) {
        setMessages(chat.messages as MessageType[] || mockMessages)
      }
    }
  }, [id])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    minimizeInput()

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content:
          "Thanks for your message! This is a mock response. In a real implementation, this would be powered by an AI model.",
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
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
              {messages.map((message) => (
                <div key={message.id} className="w-full">
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
                    // AI message
                    <div className="flex justify-start mb-6">
                      <div className="flex items-start gap-4 max-w-[85%]">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-purple-500/20">
                          <Bot className="size-5 text-purple-400" />
                        </div>
                        <div className="glass-subtle rounded-2xl px-6 py-4 border border-purple-500/10">
                          {renderMessage(message.content)}
                        </div>
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