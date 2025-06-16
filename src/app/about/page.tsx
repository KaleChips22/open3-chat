import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

const AboutPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-w-4xl mx-auto gap-8 sm:gap-12 pb-24 px-4 sm:px-6 z-1 pt-6 sm:pt-2">
      {/* Back Button */}
      <Link href="/" className="text-lg sm:text-xl text-neutral-400 max-w-2xl px-4 hover:text-accent transition-colors flex flex-row items-center gap-2 absolute top-4 left-4 cursor-pointer">
        <Button variant="ghost" size="lg" className="text-neutral-400 hover:text-accent transition-colors flex flex-row items-center gap-2 cursor-pointer text-lg sm:text-xl">
          <ArrowLeftIcon className="size-5 sm:size-6" />
          Back
        </Button>
      </Link>

      <h1 className="text-4xl sm:text-5xl font-bold text-white flex flex-col lg:flex-row items-center gap-2 mt-4">
        <span>About</span>
        <span className="bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent animate-gradient">Open3 Chat</span>
      </h1>

      <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl px-4">
        Open3 Chat is an open-source LLM chatbot designed for the{" "}<Link href="https://cloneathon.t3.chat/" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">T3 Chat Cloneathon</Link>{" "}event.
      </p>

      <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl px-4">
        Its built with <Link href="https://nextjs.org/" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">Next.js</Link> and <Link href="https://react.dev/" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">React</Link>, is hosted on <Link href="https://netlify.com" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">Netlify</Link>. This project uses <Link href="https://tailwindcss.com/" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">TailwindCSS</Link> and <Link href="https://ui.shadcn.com/" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">Shadcn</Link> on the frontend, and <Link href="https://clerk.com/" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">Clerk</Link> and <Link href="https://convex.dev/" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">Convex</Link> on the backend.
      </p>

      <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl px-4">
        The code is available on <Link href="https://github.com/KaleChips22/open3-chat" className="text-base sm:text-lg text-accent max-w-2xl hover:underline transition-all" target="_blank">GitHub</Link>.
      </p>
    </div>
  )
}
export default AboutPage