import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import Image from "next/image"
import models from "@/models/models"
import featureIcons from "@/models/features"
import { useTheme } from "./ThemeProvider"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

interface ChatInputProps {
  onSubmit: (message: string) => void
  selectedModel?: number
  onModelChange?: (modelIndex: number) => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({ 
  onSubmit, 
  selectedModel = 0, 
  onModelChange,
  disabled = false,
  placeholder = "Type your message..."
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { colorTheme } = useTheme()
  const { user } = useUser()

  const [customAPIKey, setCustomAPIKey] = useState('')
  // gete from convex
  const userSettings = useQuery(api.userSettings.get, user ? { clerkId: user.id } : "skip")

  useEffect(() => {
    if (user) {
      setCustomAPIKey(userSettings?.openRouterApiKey || '')
    } else {
      setCustomAPIKey(localStorage.getItem("open3:openRouterApiKey") || '')
      }
  }, [userSettings, user])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    onSubmit(input)
    setInput("")
    minimizeInput()
  }

  return (
    <div className="relative flex flex-col-reverse items-start justify-between gap-2">
      {onModelChange && (
        <div>
          <Select 
            value={models[selectedModel]?.id || models[0]?.id} 
            onValueChange={(value) => onModelChange(models.findIndex((model) => model.id === value))}
          >
            <SelectTrigger className="bg-transparent border border-neutral-800 hover:bg-neutral-800 text-neutral-100 rounded-xl px-4 py-2 transition-all cursor-pointer">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="bg-black/20 backdrop-blur-md border border-neutral-800 rounded-xl">
              {models.map((model, index) => (
                <SelectItem disabled={!model.features.includes('free') && !customAPIKey} key={index} value={model.id} className="text-neutral-100 rounded-lg cursor-pointer active:bg-neutral-800">
                  <div className="flex flex-row items-center gap-2 justify-between">
                    <img src={model.icon} alt={model.name} className="size-4 text-white" />
                    {model.name}
                  </div>
                  {model.features && (
                    <div className="flex flex-row items-center gap-2">
                      {model.features.map((feature) => (
                        <div key={feature} className="text-xs text-neutral-400">
                          {featureIcons[feature as keyof typeof featureIcons]}
                        </div>
                      ))}
                    </div>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
        }}
        placeholder={placeholder}
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
        disabled={!input.trim() || disabled}
        className={`absolute right-3 top-3 bg-accent/20 backdrop-blur-md border border-accent/30 hover:bg-accent/30 text-neutral-100 disabled:opacity-50 rounded-lg size-9 p-0 flex items-center justify-center cursor-pointer ${colorTheme}-glow-sm`}
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  )
} 