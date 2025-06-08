import Chat from "@/components/Chat"
import LayoutWithSidebar from "@/components/LayoutWithSidebar"

const ChatPage = ({ params }: { params: { id: string } }) => {
  const { id } = params

  return (
    <LayoutWithSidebar>
      <Chat id={id} />
    </LayoutWithSidebar>
  )
}
export default ChatPage