"use server"

import models from "@/models/models";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { revalidatePath } from "next/cache";
import { generateNextCompletion } from "@/models/index";

// Define our own types since we're having import issues
enum StreamPartType {
  TextDelta = 'text-delta',
  Reasoning = 'reasoning'
}

interface StreamPart {
  type: StreamPartType | string;
  textDelta: string;
}

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
    userBYOK !== null && userBYOK !== "" ? modelName : (models.find((val) => val.id === modelName)?.features.includes('free') ? modelName : 'deepseek/deepseek-chat-v3-0324:free'),
    previousMessages.map((message) => ({
        role: message.role,
        content: message.content
      })),
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

  // Process the stream from Vercel AI SDK
  for await (const chunk of aiResponse.fullStream) {
    if (!chunk) continue
    
    if (chunk.type === StreamPartType.TextDelta) {
      await fetchMutation(api.messages.appendMessage, {
        id: newAiMessage,
        content: chunk.textDelta
      })
    } else if (chunk.type === 'reasoning') {
      // Handle reasoning if the model provides it
      await fetchMutation(api.messages.appendReasoning, {
        id: newAiMessage,
        reasoning: chunk.textDelta
      })
    }
  }

  await fetchMutation(api.messages.completeMessage, {
    id: newAiMessage
  })

  revalidatePath(`/chat/${chatId}`)
}

export async function* pushLocalUserMessage(
  chatId: string, 
  content: string, 
  modelName: string,
  chatData: {
    messages: {
      role: string
      content: string
    }[]
  },
  userBYOK?: string | null, 
  systemPromptDetails?: { 
    customPrompt?: boolean, 
    customPromptText?: string 
  },
) {
  const previousMessages = chatData.messages || []

  // Format messages for the API
  const formattedMessages = previousMessages.map((message: any) => ({
    role: message.role,
    content: message.content
  }))

  const aiResponse = await generateNextCompletion(
    userBYOK ? modelName : (models.find((val) => val.id === modelName)?.features.includes('free') ? modelName : 'deepseek/deepseek-chat-v3-0324:free'),
    formattedMessages,
    userBYOK !== null && userBYOK !== "" ? userBYOK : null,
    systemPromptDetails
  )

  if ('error' in aiResponse && aiResponse.error === true) {
    yield {
      content: `Error processing your request: ${aiResponse.message}`
    }

    return
  }

  // Process the stream from Vercel AI SDK
  for await (const chunk of aiResponse.fullStream) {
    if (!chunk) continue

    if (chunk.type === StreamPartType.TextDelta) {
      yield {
        content: chunk.textDelta
      }
    } else if (chunk.type === 'reasoning') {
      // Handle reasoning if the model provides it
      yield {
        reasoning: chunk.textDelta
      }
    }
  }
}