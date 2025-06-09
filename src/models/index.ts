import OpenAI from "openai"

const aiInterface = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  // defaultHeaders: {
  //   "HTTP-Referer": "",
  //   "X-Title": ""
  // }
})

export const generateNextCompletion = async (model: string, messages: { role: 'user' | 'assistant', content: string }[]) => {
  const completion = await aiInterface.chat.completions.create({
    model,
    messages
  })

  return completion.choices[0]?.message.content
}
