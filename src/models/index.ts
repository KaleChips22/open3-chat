"use server"

import OpenAI from "openai"

export const generateNextCompletion = async (model: string, messages: { role: 'user' | 'assistant' | 'system', content: string }[], byok?: string | null, systemPromptDetails?: { customPrompt?: boolean, customPromptText?: string }) => {
  // console.log(byok)
  const aiInterface = new OpenAI({
    apiKey: byok ?? process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    // defaultHeaders: {
    //   "HTTP-Referer": "",
    //   "X-Title": ""
    // }
  })
  const customPrompt = systemPromptDetails?.customPrompt || false
  const customPromptText = systemPromptDetails?.customPromptText || ""

  // console.log(customPrompt, customPromptText)

  try {
    const stream = await aiInterface.chat.completions.create({
      model,
      messages: customPrompt ? [{
        role: 'system',
        content: customPromptText
      }, ...messages] : messages,
      stream: true
    })

    return stream
  } catch (error: any) {
    if (error.code === 401) {
      return { error: true, message: 'Bad API Key' }
    }

    return { error: true, message: 'Error.' }
  }
}