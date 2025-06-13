'use client'

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { LogInIcon, MessageCircleIcon, PencilIcon, PlusIcon, SparklesIcon, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { Button } from './ui/button'
import type { Id } from 'convex/_generated/dataModel'

const LayoutWithSidebar = ({ children, currentChatId }: { children: React.ReactNode, currentChatId?: Id<"chats"> | null }) => {
  const router = useRouter()
  const { user } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const chats = useQuery(api.chats.getMyChats, { clerkId: user?.id || "" })
  const newChat = useMutation(api.chats.createChat)
  const deleteChat = useMutation(api.chats.deleteChat)
  const renameChat = useMutation(api.chats.renameChat)

  const [chatFound, setChatFound] = useState(false)

  useEffect(() => {
    if (chats && chats.length > 0 && currentChatId && chats.find((chat) => chat._id === currentChatId)) {
      setChatFound(true)
    } else {
      setChatFound(false)
    }
  }, [chats, currentChatId])

  // Check if we're on mobile and close sidebar automatically
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  const makeNewChat = async () => {
    if (!user) {
      return
    }

    const newId = await newChat({ clerkId: user.id })
    router.push(`/chat/${newId}`)
    
    // Auto-close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="h-screen w-full bg-neutral-950 overflow-x-hidden">
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex h-full w-full">
          <Sidebar className="bg-neutral-950 border-r border-neutral-700/50 h-full z-20 flex-shrink-0">
            <SidebarHeader className="bg-neutral-950 border-b border-neutral-700/50 text-white text-lg p-4 flex gap-2 flex-row items-center">
              <Link href="/" className="flex flex-row items-center gap-2">
                <SparklesIcon className="size-5 font-bold text-accent" />
                <h1 className="text-lg font-semibold">Open3 Chat</h1>
              </Link>
            </SidebarHeader>
            <SidebarContent className="bg-neutral-950 overflow-y-auto">
              <SidebarGroup className="flex flex-col mt-4 gap-1">
                <SidebarGroupLabel className="text-white text-lg font-semibold px-4">My Chats</SidebarGroupLabel>
                <SidebarGroupContent className="flex flex-col gap-2">
                  {chats && chats.length > 0 ? chats.map((chat) => (
                    currentChatId === chat._id ? (
                      <SidebarMenuItem key={chat._id} className="flex flex-row items-center gap-2" onClick={() => {
                        router.push(`/chat/${chat._id}`)
                        if (isMobile) {
                          setSidebarOpen(false)
                        }
                      }}>
                        <SidebarMenuButton className="flex flex-row items-center justify-between gap-2 bg-accent/10 hover:bg-accent/20 text-white hover:text-white rounded-md p-2 py-5 ml-2 w-full cursor-pointer transition-all border border-accent/20 purple-glow-sm group/chat-title">
                          <div className="flex flex-row items-center gap-1 h-full">
                            <MessageCircleIcon className="size-5 text-accent/80" />
                            <span className="truncate max-w-[8rem]">{chat.title}</span>
                          </div>
                          <div className="flex flex-row items-center justify-end h-full">
                            <div
                              className="flex items-center justify-center cursor-pointer text-neutral-400 hover:text-white group-hover/chat-title:opacity-100 opacity-0 transition-all p-1"
                              onClick={(e) => {
                                renameChat({
                                  id: chat._id,
                                  name: prompt("Rename chat", chat.title)!
                                })
                                e.stopPropagation()
                              }}
                            >
                              <PencilIcon className="size-4" />
                            </div>
                            <div
                              className="flex items-center justify-center cursor-pointer text-neutral-400 hover:text-red-500 group-hover/chat-title:opacity-100 opacity-0 transition-all p-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteChat({ id: chat._id })
                                router.push("/")
                              }}
                            >
                              <TrashIcon className="size-4" />
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : (
                      <SidebarMenuItem key={chat._id} className="flex flex-row items-center gap-2 group" onClick={() => {
                        router.push(`/chat/${chat._id}`)
                        if (isMobile) {
                          setSidebarOpen(false)
                        }
                      }}>
                        <SidebarMenuButton className="flex flex-row items-center justify-between bg-transparent hover:bg-neutral-800 hover:border-accent/20 active:bg-neutral-800 text-white hover:text-white rounded-md p-2 py-5 ml-2 max-w-full w-full cursor-pointer transition-all group/chat-title">
                          <div className="flex flex-row items-center gap-1 h-full">
                            <MessageCircleIcon className="size-5 text-accent/80" />
                            <span className="truncate max-w-[8rem]">{chat.title}</span>
                          </div>
                          <div className="flex flex-row items-center justify-end h-full">
                            <div
                              className="flex items-center justify-center cursor-pointer text-neutral-400 hover:text-white group-hover/chat-title:opacity-100 opacity-0 transition-all p-1"
                              onClick={(e) => {
                                renameChat({
                                  id: chat._id,
                                  name: prompt("Rename chat", chat.title)!
                                })
                                e.stopPropagation()
                              }}
                            >
                              <PencilIcon className="size-4" />
                            </div>
                            <div
                              className="flex items-center justify-center cursor-pointer text-neutral-400 hover:text-red-500 group-hover/chat-title:opacity-100 opacity-0 transition-all p-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteChat({ id: chat._id })
                              }}
                            >
                              <TrashIcon className="size-4" />
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  )) : (
                    <SidebarMenuItem className="flex flex-row items-center gap-2">
                      <span className="w-full mt-1 p-4 text-neutral-400 text-md text-center">No chats found</span>
                    </SidebarMenuItem>
                  )}

                  <SidebarMenuItem className="flex flex-row items-center gap-2" onClick={makeNewChat}>
                    <SidebarMenuButton className={chatFound ? 'flex flex-row items-center justify-between bg-transparent hover:bg-neutral-800 hover:border-accent/20 text-white hover:text-white rounded-md p-2 py-5 ml-2 max-w-full w-full cursor-pointer transition-all' : 'flex flex-row items-center gap-2 bg-accent/10 hover:bg-accent/20 text-white hover:text-white rounded-md p-2 py-5 ml-2 w-full cursor-pointer transition-all border border-accent/20 purple-glow-sm'}>
                      <div className="flex flex-row items-center gap-1 h-full">
                        <PlusIcon className="size-5 text-accent" />
                        <span>New Chat</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="bg-neutral-950 border-t border-neutral-700/50 text-white p-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <div className="flex flex-row items-center gap-2 justify-center cursor-pointer w-full hover:text-accent transition-colors">
                    <LogInIcon className="size-4" />
                    <span>Sign In</span>
                  </div>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex flex-row items-center gap-2 justify-center cursor-pointer w-full relative overflow-hidden">
                  {/* <UserButton showName={true} appearance={{
                    variables: {
                      fontSize: '1rem',
                      fontWeight: {
                        medium: 300,
                      }
                    },
                    elements: {
                      userButtonBox: {
                        padding: '0 2rem',
                      }
                    }
                  }} /> */}
                  <Link href="/settings" className="flex flex-row items-center gap-2 justify-center cursor-pointer w-full transition-colors">
                    <span>{user?.fullName}</span>
                    <img src={user?.imageUrl} alt="User" className="size-8 rounded-full" />
                  </Link>
                </div>
              </SignedIn>
            </SidebarFooter>
          </Sidebar>
          
          <main className="flex-1 relative h-full overflow-hidden flex flex-col bg-neutral-950">
            <div className="absolute top-0 left-0 z-20 m-2">
              <SidebarTrigger className="size-10 bg-transparent text-accent cursor-pointer p-2 hover:bg-transparent hover:text-white" />
            </div>
            <div className="flex-1 overflow-auto w-full max-w-full">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default LayoutWithSidebar