import Chat from "@/components/Chat"
import LayoutWithSidebar from "@/components/LayoutWithSidebar"

const ChatPage = async ({ params }: { params: { id: string } }) => {
  const { id } = await params

  return (
    <LayoutWithSidebar>
      <Chat id={id} />
    </LayoutWithSidebar>
  )
}
export default ChatPage