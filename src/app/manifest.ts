import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Open3 Chat',
    short_name: 'Open3 Chat',
    description: 'Open3 Chat is a chatbot that uses the OpenAI API to answer questions and help you with your tasks.',
    start_url: '/',
    display: 'standalone',
    theme_color: '#000000',
    background_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  }
}