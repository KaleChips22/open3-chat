const deepseek = "/icons/deepseek.svg"
const openai = "/icons/openai.svg"

const models = [
  {
    name: "GPT 4o",
    id: "openai/gpt-4o",
    description: "The latest model from OpenAI",
    icon: openai,
    features: []
  },
  {
    name: "GPT 4o mini",
    id: "openai/gpt-4o-mini",
    description: "The mini model from OpenAI",
    icon: openai,
    features: []
  },
  {
    name: "Deepseek Chat v3",
    id: "deepseek/deepseek-chat-v3-0324:free",
    description: "The latest model from DeepSeek",
    icon: deepseek,
    features: [
      "free",
    ]
  },
  {
    name: "Deepseek R1",
    id: "deepseek/deepseek-r1-0528:free",
    description: "The latest R1 model from DeepSeek",
    icon: deepseek,
    features: [
      "free",
      "reasoning",
    ]
  }
]

export default models