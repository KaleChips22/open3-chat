const deepseek = "/icons/deepseek.svg"
const openai = "/icons/openai.svg"
const gemma = "/icons/gemma.svg"
const gemini = "/icons/gemini.svg"
const anthropic = "/icons/anthropic.svg"
const grok = "/icons/grok.svg"
const meta = "/icons/meta.svg"
const qwen = "/icons/qwen.svg"

const models = [
  {
    name: "Deepseek V3",
    id: "deepseek/deepseek-chat-v3-0324:free",
    icon: deepseek,
    features: [
      "free",
    ]
  },
  {
    name: "Deepseek R1",
    id: "deepseek/deepseek-r1:free",
    icon: deepseek,
    features: [
      "free",
      "reasoning",
    ]
  },
  {
    name: "GPT-4o",
    id: "openai/gpt-4o",
    icon: openai,
    features: []
  },
  {
    name: "GPT-4o-mini",
    id: "openai/gpt-4o-mini",
    icon: openai,
    features: [
      "mini",
    ]
  },
  {
    name: "GPT-4.1",
    id: "openai/gpt-4.1",
    icon: openai,
    features: []
  },
  {
    name: "GPT-4.1 Mini",
    id: "openai/gpt-4.1-mini",
    icon: openai,
    features: [
      "mini",
    ]
  },
  {
    name: "Gemma 3",
    id: "google/gemma-3-27b-it:free",
    icon: gemma,
    features: [
      "free",
    ]
  },
  {
    name: "Gemini 2.0 Flash",
    id: "google/gemini-2.0-flash-001",
    icon: gemini,
    features: [
      "free",
      "fast",
    ]
  },
  {
    name: "Gemini 2.5 Flash",
    id: "google/gemini-2.5-flash",
    icon: gemini,
    features: [
      "fast",
      "reasoning",
    ]
  },
  {
    name: "Gemini 2.5 Pro",
    id: "google/gemini-2.5-pro",
    icon: gemini,
    features: [
      "fast",
      "reasoning",
    ]
  },
  {
    name: "Claude 3.5 Sonnet",
    id: "anthropic/claude-3.5-sonnet",
    icon: anthropic,
    features: []
  },
  {
    name: "Claude 3.7 Sonnet",
    id: "anthropic/claude-3.7-sonnet",
    icon: anthropic,
    features: []
  },
  {
    name: "Claude 3.7 Sonnet (Thinking)",
    id: "anthropic/claude-3.7-sonnet:thinking",
    icon: anthropic,
    features: [
      "reasoning",
    ]
  },
  {
    name: "Claude Sonnet 4",
    id: "anthropic/claude-sonnet-4",
    icon: anthropic,
    features: [
      "reasoning",
    ]
  },
  {
    name: "Claude Opus 4",
    id: "anthropic/claude-opus-4",
    icon: anthropic,
    features: [
      "reasoning",
    ]
  },
  {
    name: "Grok 3",
    id: "xai/grok-3-beta",
    icon: grok,
    features: [
      "reasoning",
    ]
  },
  {
    name: "Grok 3 Mini",
    id: "xai/grok-3-mini-beta",
    icon: grok,
    features: [
      "reasoning",
      "mini",
    ]
  },
  {
    name: "Llama 4 Maverick",
    id: "meta-llama/llama-4-maverick:free",
    icon: meta,
    features: [
      "free",
    ]
  },
  {
    name: "Qwen3",
    id: "qwen/qwen3-14b:free",
    icon: qwen,
    features: [
      "free",
      "reasoning",
    ]
  }
]

export default models
