"use server"

import models from "@/models/models";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { revalidatePath } from "next/cache";
import { generateNextCompletion } from "@/models/index";

export async function pushUserMessage(chatId: Id<"chats">, content: string) {
  const newUserMessage = await fetchMutation(api.messages.createMessage, {
    chatId,
    content,
    role: "user"
  })

  const previousMessages = await fetchQuery(api.messages.getMessagesForChat, {
    chatId
  })

  const aiResponse = await generateNextCompletion(
    "deepseek/deepseek-chat-v3-0324:free",
    [
      ...previousMessages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      {
        role: "user",
        content: content
      }
    ]
  )

  const newAiMessage = await fetchMutation(api.messages.createMessage, {
    chatId,
    content: aiResponse ?? "Sorry, your request could not be processed. Please try again.",
    role: "assistant"
  })

  revalidatePath(`/chat/${chatId}`)
}