'use client'

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { MessageCircleIcon, PlusIcon, SparklesIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import type { ChatType } from '@/lib/types'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

// const chats = [
//   {
//     id: '1',
//     name: 'Chat 1',
//     messages: []
//   }
// ]

const LayoutWithSidebar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()

  // const [chats, setChats] = useState<ChatType[]>([])
  const chats = useQuery(api.chats.getAllChats)
  const newChat = useMutation(api.chats.createChat)

  // useEffect(() => {
  //   const loadedChats = localStorage.getItem('open3:chats')
  //   if (loadedChats) {
  //     setChats(JSON.parse(loadedChats) as ChatType[])
  //   } else {
  //     localStorage.setItem('open3:chats', JSON.stringify([]))
  //   }
  // }, [])

  const makeNewChat = async () => {
    // const newId = Math.random().toString(36).substring(2, 15)
    // const newChat: ChatType = {
    //   id: newId,
    //   name: 'New Chat',
    //   messages: []
    // }
    // setChats(current => [...current, newChat])

    // localStorage.setItem('open3:chats', JSON.stringify([...chats, newChat]))

    const newId = await newChat()
    router.push(`/chat/${newId}`)
  }

  return (
    <div className='flex flex-col h-screen'>
      <SidebarProvider defaultOpen={true}>
        <Sidebar className='bg-neutral-950 border-r border-neutral-700 h-full'>
          <SidebarHeader className='bg-neutral-950 border-b border-neutral-700 text-white text-lg p-4 flex gap-2 flex-row items-center'>
            <Link href="/" className='flex flex-row items-center gap-2'>
              <SparklesIcon className='size-5 font-bold' />
              <h1 className='text-lg font-semibold'>Open3 Chat</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className='bg-neutral-950'>
            <SidebarGroup className='flex flex-col mt-4 gap-1'>
              <SidebarGroupLabel className='text-white text-lg font-semibold'>My Chats</SidebarGroupLabel>
              <SidebarGroupContent className='flex flex-col gap-2'>
                {chats && chats.length > 0 ? chats.map((chat) => (
                  <SidebarMenuItem key={chat._id} className='flex flex-row items-center gap-2' onClick={() => router.push(`/chat/${chat._id}`)}>
                    <SidebarMenuButton className='flex flex-row items-center gap-2 bg-transparent hover:bg-neutral-800 text-white hover:text-white rounded-md p-2 w-full cursor-pointer transition-all'>
                      <MessageCircleIcon className='size-5' />
                      <span>{chat.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )) : (
                  <SidebarMenuItem className='flex flex-row items-center gap-2'>
                      <span className='ml-2 mt-1 text-white text-md'>No chats found</span>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem className='flex flex-row items-center gap-2' onClick={makeNewChat}>
                  <SidebarMenuButton className='flex flex-row items-center gap-2 bg-transparent hover:bg-neutral-800 text-white hover:text-white rounded-md p-2 w-full cursor-pointer transition-all'>
                    <PlusIcon className='size-5' />
                    <span>New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>

          </SidebarFooter>
        </Sidebar>
        <div className='flex flex-row flex-1 relative bg-neutral-950'>
          <SidebarTrigger className='size-10 bg-transparent text-white cursor-pointer p-4 m-2 hover:bg-transparent hover:text-white z-90' />
          <div className="flex-1 -ml-14 p-4 overflow-hidden">
            { children }
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default LayoutWithSidebar