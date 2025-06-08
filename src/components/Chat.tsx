"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock data for demonstration
const mockMessages = [
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
      "Absolutely! Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every scenario. It's like teaching a computer to recognize patterns and make predictions based on examples.\n\nThere are three main types:\n• Supervised learning (learning from labeled examples)\n• Unsupervised learning (finding patterns in unlabeled data)\n• Reinforcement learning (learning through trial and error)\n\nWould you like me to dive deeper into any of these areas?",
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

export default function Chat() {
  const [messages, setMessages] = useState(mockMessages)
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
      inputRef.current.style.height = "56px"
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

  return (
    <div className="h-screen bg-neutral-950 text-neutral-100">
      {/* Chat Container */}
      <div className="relative h-full">
        {/* Chat Messages */}
        <div className="h-full">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="w-full">
                  {message.role === "user" ? (
                    // User message with bubble
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-2xl px-4 py-3">
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</div>
                      </div>
                    </div>
                  ) : (
                    // AI message directly on background
                    <div className="w-full">
                      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-100">
                        {message.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="h-15 w-full bg-transparent" />
            </div>
          </ScrollArea>
        </div>

        {/* Floating Input */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
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
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 focus:border-purple-400/50 text-neutral-100 placeholder:text-neutral-400 rounded-xl px-6 py-4 pr-16 resize-none focus:outline-none focus:ring-0 min-h-[56px] max-h-64 overflow-y-auto scrollbar-hide"
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
      </div>
    </div>
  )
}
