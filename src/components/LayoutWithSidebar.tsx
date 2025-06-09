'use client'

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { LogInIcon, MessageCircleIcon, PlusIcon, SparklesIcon, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { Button } from './ui/button'

const LayoutWithSidebar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const { user } = useUser()

  const chats = useQuery(api.chats.getMyChats, { clerkId: user?.id || "" })
  const newChat = useMutation(api.chats.createChat)
  const deleteChat = useMutation(api.chats.deleteChat)

  const makeNewChat = async () => {
    if (!user) {
      return
    }

    const newId = await newChat({ clerkId: user.id })
    router.push(`/chat/${newId}`)
  }

  return (
    <div className='flex flex-col h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950'>
      <SidebarProvider defaultOpen={true}>
        <Sidebar className='bg-slate-950/80 backdrop-blur-xl border-r border-purple-500/20 h-full'>
          <SidebarHeader className='bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-b border-purple-500/20 text-white text-lg p-6 flex gap-3 flex-row items-center'>
            <Link href="/" className='flex flex-row items-center gap-3'>
              <div className='p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 glow-subtle'>
                <SparklesIcon className='size-5 font-bold text-white' />
              </div>
              <h1 className='text-xl font-bold gradient-text'>Open3 Chat</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className='bg-slate-950/50 backdrop-blur-sm'>
            <SidebarGroup className='flex flex-col mt-6 gap-2 px-4'>
              <SidebarGroupLabel className='text-purple-300 text-sm font-semibold uppercase tracking-wider mb-3'>My Conversations</SidebarGroupLabel>
              <SidebarGroupContent className='flex flex-col gap-2'>
                {chats && chats.length > 0 ? chats.map((chat) => (
                  <SidebarMenuItem key={chat._id} className='flex flex-row items-center gap-2 group' onClick={() => router.push(`/chat/${chat._id}`)}>
                    <SidebarMenuButton className='flex flex-row items-center justify-between bg-transparent hover:bg-neutral-800 text-white hover:text-white rounded-md p-2 py-5 ml-2 w-full cursor-pointer transition-all group/chat-title'>
                      <div className='flex flex-row items-center gap-1 h-full'>
                        <MessageCircleIcon className='size-5' />
                        <span>{chat.title}</span>
                      </div>
                      <div className='flex flex-row items-center gap-1 h-full'>
                        <div
                          className='flex items-center justify-center cursor-pointer hover:text-red-500 group-hover/chat-title:opacity-100 opacity-0 transition-all p-2'
                          onClick={() => deleteChat({ id: chat._id })}
                        >
                          <TrashIcon className='size-5' />
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )) : (
                  <SidebarMenuItem className='flex flex-row items-center gap-2'>
                      <span className='ml-3 mt-2 text-slate-400 text-sm'>No conversations yet</span>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem className='flex flex-row items-center gap-2' onClick={makeNewChat}>
                  <SidebarMenuButton className='flex flex-row items-center gap-2 bg-transparent hover:bg-neutral-800 text-white hover:text-white rounded-md p-2 py-5 ml-2 w-full cursor-pointer transition-all'>
                    <PlusIcon className='size-5' />
                    <span>New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className='flex flex-row items-center justify-between bg-slate-950/80 backdrop-blur-sm border-t border-purple-500/20 text-white p-4'>
            <SignedOut>
              <SignInButton mode='modal'>
                <div className='flex flex-row items-center gap-3 justify-center cursor-pointer w-full glass-subtle hover:glass rounded-xl p-3 transition-all duration-200'>
                  <LogInIcon className='size-4 text-purple-400' />
                  <span className='font-medium'>Sign In</span>
                </div>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className='flex flex-row items-center gap-3 justify-center cursor-pointer w-full glass-subtle rounded-xl p-2 transition-all duration-200'>
                <UserButton showName={true} appearance={{
                  variables: {
                    fontSize: '0.875rem',
                    fontWeight: {
                      medium: 500,
                    }
                  },
                  elements: {
                    userButtonBox: {
                      padding: '0.5rem',
                    },
                    userButtonAvatarBox: {
                      width: '2rem',
                      height: '2rem',
                    }
                  }
                }} />
              </div>
            </SignedIn>
          </SidebarFooter>
        </Sidebar>
        <div className='flex flex-row flex-1 relative bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950'>
          <SidebarTrigger className='size-10 bg-glass-subtle hover:glass text-purple-300 hover:text-white cursor-pointer p-2 m-4 rounded-xl transition-all duration-200 z-10 glow-subtle' />
          <div className="flex-1 -ml-14 overflow-hidden">
            { children }
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default LayoutWithSidebar