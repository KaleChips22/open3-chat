"use server"

import models from "@/models/models";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { revalidatePath } from "next/cache";
import { generateNextCompletion } from "@/models/index";
import type { ChatCompletionChunk } from "openai/resources/index.mjs";
import type { Stream } from "openai/core/streaming.mjs";

interface Delta {
  content?: string;
  reasoning?: string;
}

export async function pushUserMessage(chatId: Id<"chats">, content: string, modelName: string, clerkId: string) {
  const chat = await fetchQuery(api.chats.getChat, {
    id: chatId
  })

  // console.log(modelName)

  const newUserMessage = await fetchMutation(api.messages.createMessage, {
    chatId,
    content,
    role: "user",
    model: modelName
  })

  const previousMessages = await fetchQuery(api.messages.getMessagesForChat, {
    chatId
  })
  
  const newAiMessage = await fetchMutation(api.messages.createMessage, {
    chatId,
    content: "",
    role: "assistant",
    model: modelName,
    reasoning: ""
  })

  const userSettings = await fetchQuery(api.userSettings.get, {
    clerkId
  })

  const userBYOK = userSettings?.openRouterApiKey || null
  const systemPromptDetails = {
    customPrompt: userSettings?.customPrompt || false,
    customPromptText: userSettings?.customPromptText || ""
  }

  const aiResponse = await generateNextCompletion(
    modelName,
    [
      ...previousMessages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      {
        role: "user",
        content: content
      }
    ],
    userBYOK,
    systemPromptDetails
  )

  if ('error' in aiResponse && aiResponse.error === true) {
    await fetchMutation(api.messages.appendMessage, {
      id: newAiMessage,
      content: `Error processing your request: ${aiResponse.message}`
    })

    return
  }

  for await (const chunk of aiResponse as Stream<ChatCompletionChunk>) {
    const delta = chunk.choices[0]?.delta as Delta
    if (delta?.reasoning) {
      await fetchMutation(api.messages.appendReasoning, {
        id: newAiMessage,
        reasoning: delta.reasoning
      })
    }
    if (delta?.content) {
      await fetchMutation(api.messages.appendMessage, {
        id: newAiMessage,
        content: delta.content
      })
    }
  }

  await fetchMutation(api.messages.completeMessage, {
    id: newAiMessage
  })

  revalidatePath(`/chat/${chatId}`)
}

export async function* pushLocalUserMessage(chatId: string, content: string, modelName: string, userBYOK?: string | null, systemPromptDetails?: { customPrompt?: boolean, customPromptText?: string }) {
  const aiResponse = await generateNextCompletion(
    modelName,
    [
      {
        role: "user",
        content: content
      }
    ],
    userBYOK,
    systemPromptDetails
  )

  if ('error' in aiResponse && aiResponse.error === true) {
    yield {
      content: `Error processing your request: ${aiResponse.message}`
    }

    return
  }

  for await (const chunk of aiResponse as Stream<ChatCompletionChunk>) {
    const delta = chunk.choices[0]?.delta as Delta
    if (delta?.content || delta?.reasoning) {
      yield {
        content: delta?.content,
        reasoning: delta?.reasoning
      }
    }
  }
}