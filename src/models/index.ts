"use server"

import OpenAI from "openai"

// Define our own types for streaming
interface StreamTextResult {
  fullStream: AsyncIterable<{ type: string; textDelta: string }>;
}

export const generateNextCompletion = async (model: string, messages: { role: 'user' | 'assistant' | 'system', content: string }[], byok?: string | null, systemPromptDetails?: { customPrompt?: boolean, customPromptText?: string }) => {
  const customPrompt = systemPromptDetails?.customPrompt || false
  const customPromptText = systemPromptDetails?.customPromptText || ""

  try {
    // Create OpenAI client
    const aiInterface = new OpenAI({
      apiKey: byok ?? process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    // Format messages
    const formattedMessages = customPrompt ? [{
      role: 'system' as const,
      content: customPromptText
    }, ...messages] : messages

    // Create a direct chat completion with streaming
    const stream = await aiInterface.chat.completions.create({
      model,
      messages: formattedMessages,
      stream: true
    })

    // Convert the OpenAI stream to our custom stream format
    const fullStream = createCustomStream(stream)

    return { fullStream } as StreamTextResult
  } catch (error: any) {
    if (error.code === 401) {
      return { error: true, message: 'Bad API Key', fullStream: createEmptyAsyncIterable() }
    }

    return { error: true, message: error.message, fullStream: createEmptyAsyncIterable() }
  }
}

// Helper function to create an empty async iterable
function createEmptyAsyncIterable() {
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          return { done: true, value: undefined }
        }
      }
    }
  }
}

// Helper function to convert OpenAI stream to our custom stream format
function createCustomStream(openaiStream: any) {
  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of openaiStream) {
        const content = chunk.choices[0]?.delta?.content
        const reasoning = chunk.choices[0]?.delta?.reasoning
        
        if (content) {
          yield {
            type: 'text-delta',
            textDelta: content
          }
        }
        
        if (reasoning) {
          yield {
            type: 'reasoning',
            textDelta: reasoning
          }
        }
      }
    }
  }
}