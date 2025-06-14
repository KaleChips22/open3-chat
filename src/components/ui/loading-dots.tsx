import React from "react"
import { cn } from "@/lib/utils"

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 p-4 my-2 w-fit", className)}>
      <div className="size-1.5 rounded-full bg-neutral-400 animate-[bounce_1s_infinite_0ms]" />
      <div className="size-1.5 rounded-full bg-neutral-400 animate-[bounce_1s_infinite_200ms]" />
      <div className="size-1.5 rounded-full bg-neutral-400 animate-[bounce_1s_infinite_400ms]" />
    </div>
  )
} 