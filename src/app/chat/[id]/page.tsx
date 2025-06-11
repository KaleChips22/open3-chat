import Chat from "@/components/Chat"
import LayoutWithSidebar from "@/components/LayoutWithSidebar"
import type { Id } from "convex/_generated/dataModel"

const ChatPage = async ({ params }: { params: { id: string } }) => {
  const { id } = await params

  return (
    <LayoutWithSidebar currentChatId={id as Id<"chats">}>
      <Chat id={id} />
    </LayoutWithSidebar>
  )
}
export default ChatPage