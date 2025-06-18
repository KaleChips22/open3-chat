'use client'

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { LogInIcon, MessageCircleIcon, PencilIcon, PlusIcon, SparklesIcon, TrashIcon, CheckIcon, XIcon, ChevronLeftIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { Button } from './ui/button'
import type { Id } from 'convex/_generated/dataModel'
import { useTheme } from './ThemeProvider'

const LayoutWithSidebar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [localChats, setLocalChats] = useState<{ id: string, title: string }[]>([])
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState("")

  const pathname = usePathname()
  const isChatPage = pathname.startsWith("/chat")
  const chatId = isChatPage ? pathname.split("/")[2] as Id<"chats"> : null

  const { colorTheme } = useTheme()

  // Only query Convex if user is authenticated
  const chats = useQuery(api.chats.getMyChats, user ? { clerkId: user.id } : "skip")
  const newChat = useMutation(api.chats.createChat)
  const deleteChat = useMutation(api.chats.deleteChat)
  const renameChat = useMutation(api.chats.renameChat)

  const [chatFound, setChatFound] = useState(false)

  // Load local chats for unauthenticated users
  useEffect(() => {
    if (!isLoaded) return
    if (user) return // Skip if user is authenticated

    const chatIds = JSON.parse(localStorage.getItem("open3:chatIds") ?? "[]")
    const loadedChats = chatIds.map((id: string) => {
      const chatData = JSON.parse(localStorage.getItem(`open3:chat:${id}`) ?? "{}")
      return {
        id,
        title: chatData.title || "New Chat"
      }
    })
    setLocalChats(loadedChats)
  }, [isLoaded, user])

  useEffect(() => {
    if (user) {
      if (chats && chats.length > 0 && chatId && chats.find((chat) => chat._id === chatId)) {
        setChatFound(true)
      } else {
        setChatFound(false)
      }
    } else {
      if (localChats && localChats.length > 0 && chatId && localChats.find((chat) => chat.id === chatId)) {
        setChatFound(true)
      } else {
        setChatFound(false)
      }
    }
  }, [chats, localChats, chatId, user])

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
    if (user) {
      const newId = await newChat({ clerkId: user.id })
      router.push(`/chat/${newId}`)

      if (isMobile) {
        setSidebarOpen(false)
      }
    } else {
      const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const allLocalChatIds = JSON.parse(localStorage.getItem("open3:chatIds") ?? "[]")
      allLocalChatIds.push(newId)
      localStorage.setItem("open3:chatIds", JSON.stringify(allLocalChatIds))
      localStorage.setItem(`open3:chat:${newId}`, JSON.stringify({
        title: "New Chat",
        messages: []
      }))
      router.push(`/chat/${newId}`)

      if (isMobile) {
        setSidebarOpen(false)
      }
    }
    
    // Auto-close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleRenameChat = (chatId: string, currentTitle: string) => {
    setRenamingChatId(chatId)
    setRenameInput(currentTitle)
  }

  const handleConfirmRename = () => {
    if (!renameInput.trim()) return
    
    if (user) {
      renameChat({
        id: renamingChatId as Id<"chats">,
        name: renameInput
      })
    } else {
      const chatData = JSON.parse(localStorage.getItem(`open3:chat:${renamingChatId}`) ?? "{}")
      chatData.title = renameInput
      localStorage.setItem(`open3:chat:${renamingChatId}`, JSON.stringify(chatData))
      setLocalChats(chats => chats.map(chat => 
        chat.id === renamingChatId ? { ...chat, title: renameInput } : chat
      ))
    }
    setRenamingChatId(null)
    setRenameInput("")
  }

  const handleCancelRename = () => {
    setRenamingChatId(null)
    setRenameInput("")
  }

  const handleDeleteChat = (chatId: string) => {
    if (user) {
      deleteChat({ id: chatId as Id<"chats"> })
      if (chatId === chatId) {
        router.push("/")

        if (isMobile) {
          setSidebarOpen(false)
        }
      }
    } else {
      const allLocalChatIds = JSON.parse(localStorage.getItem("open3:chatIds") ?? "[]")
      const updatedChatIds = allLocalChatIds.filter((id: string) => id !== chatId)
      localStorage.setItem("open3:chatIds", JSON.stringify(updatedChatIds))
      localStorage.removeItem(`open3:chat:${chatId}`)
      setLocalChats(chats => chats.filter(chat => chat.id !== chatId))
      if (chatId === chatId) {
        router.push("/")

        if (isMobile) {
          setSidebarOpen(false)
        }
      }
    }
  }

  // Get chats based on authentication status
  const displayChats = user ? chats : localChats

  return (
    <div className="h-screen w-full bg-neutral-950 overflow-x-hidden">
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex h-full w-full">
          <Sidebar className="bg-neutral-950 border-r border-neutral-700/50 h-full z-20 flex-shrink-0">
            <SidebarHeader className="bg-neutral-950 border-b border-neutral-700/50 text-white text-lg p-4 flex gap-2 flex-row items-center justify-between">
              <Link href="/" className="flex flex-row items-center gap-2">
                <SparklesIcon className="size-5 font-bold text-accent" />
                <h1 className="text-lg font-semibold">Open3 Chat</h1>
              </Link>
              {isMobile && (

                <SidebarTrigger
                  className='bg-neutral-900 border-0 text-neutral-300 hover:bg-neutral-800 hover:text-white cursor-pointer'
                />
              )}
            </SidebarHeader>
            <SidebarContent className="bg-neutral-950 overflow-y-auto">
              <SidebarGroup className="flex flex-col mt-4 gap-1">
                <SidebarGroupContent className="flex flex-col gap-2">
                  <SidebarMenuItem className="flex flex-row items-center gap-2" onClick={makeNewChat}>
                    <SidebarMenuButton className={chatFound ? 'flex flex-row items-center justify-between bg-transparent hover:bg-neutral-800 hover:border-accent/20 text-white hover:text-white rounded-md p-2 py-5 ml-2 max-w-full w-full cursor-pointer transition-all' : `flex flex-row items-center gap-2 bg-accent/10 hover:bg-accent/20 text-white hover:text-white rounded-md p-2 py-5 ml-2 w-full cursor-pointer transition-all border border-accent/20 ${colorTheme}-glow-sm`}>
                      <div className="flex flex-row items-center gap-1 h-full">
                        <PlusIcon className="size-5 text-accent" />
                        <span>New Chat</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarGroupLabel className="text-white text-lg font-semibold px-4">My Chats</SidebarGroupLabel>
                  
                  {displayChats && displayChats.length > 0 ? displayChats.reverse().map((chat) => (
                    chatId === (user ? chat._id : chat.id) ? (
                      <SidebarMenuItem key={user ? chat._id : chat.id} className="flex flex-row items-center gap-2" onClick={() => {
                        router.push(`/chat/${user ? chat._id : chat.id}`)
                        if (isMobile) {
                          setSidebarOpen(false)
                        }
                      }}>
                        <SidebarMenuButton className={`flex flex-row items-center justify-between gap-2 bg-accent/10 hover:bg-accent/20 text-white hover:text-white rounded-md p-2 py-5 ml-2 w-full cursor-pointer transition-all border border-accent/20 ${colorTheme}-glow-sm group/chat-title`}>
                          <div className="flex flex-row items-center gap-1 h-full">
                            <MessageCircleIcon className="size-5 text-accent/80" />
                            {renamingChatId === (user ? chat._id : chat.id) ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={renameInput}
                                  onChange={(e) => setRenameInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleConfirmRename()
                                    } else if (e.key === "Escape") {
                                      handleCancelRename()
                                    }
                                  }}
                                  className="bg-transparent border border-accent/30 rounded px-1 py-0.5 text-sm focus:outline-none focus:border-accent/50 max-w-[9rem] text-white"
                                  autoFocus
                                />
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleConfirmRename}
                                  className="text-neutral-400 hover:text-white transition-colors size-5 p-0.5"
                                >
                                  <CheckIcon className="size-4" />
                                </Button>
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleCancelRename}
                                  className="text-neutral-400 hover:text-red-500 transition-colors size-5 p-0.5"
                                >
                                  <XIcon className="size-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="truncate max-w-[8rem]">{chat.title}</span>
                            )}
                          </div>
                          
                          {renamingChatId !== (user ? chat._id : chat.id) && (
                            <div className="flex items-center gap-1">
                              <div
                                className="flex items-center justify-center cursor-pointer text-neutral-400 hover:text-white group-hover/chat-title:opacity-100 sm:opacity-0 transition-all p-1"
                                onClick={(e) => {
                                  handleRenameChat(user ? chat._id : chat.id, chat.title)
                                  e.stopPropagation()
                                }}
                              >
                                <PencilIcon className="size-4" />
                              </div>
                              <div
                                className="flex items-center justify-center cursor-pointer text-neutral-400 hover:text-red-500 group-hover/chat-title:opacity-100 sm:opacity-0 transition-all p-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteChat(user ? chat._id : chat.id)
                                }}
                              >
                                <TrashIcon className="size-4" />
                              </div>
                            </div>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : (
                      <SidebarMenuItem key={user ? chat._id : chat.id} className="flex flex-row items-center gap-2 group" onClick={() => {
                        router.push(`/chat/${user ? chat._id : chat.id}`)
                        if (isMobile) {
                          setSidebarOpen(false)
                        }
                      }}>
                        <SidebarMenuButton className="flex flex-row items-center justify-between bg-transparent hover:bg-neutral-800 hover:border-accent/20 active:bg-neutral-800 text-white hover:text-white rounded-md p-2 py-5 ml-2 max-w-full w-full cursor-pointer transition-all group/chat-title">
                          <div className="flex flex-row items-center gap-1 h-full">
                            <MessageCircleIcon className="size-5 text-accent/80" />
                            {renamingChatId === (user ? chat._id : chat.id) ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={renameInput}
                                onChange={(e) => setRenameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleConfirmRename()
                                  } else if (e.key === "Escape") {
                                    handleCancelRename()
                                  }
                                }}
                                className="bg-transparent border border-accent/30 rounded px-1 py-0.5 text-sm focus:outline-none focus:border-accent/50 max-w-[9rem] text-white"
                                autoFocus
                              />
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                onClick={handleConfirmRename}
                                className="text-neutral-400 hover:text-white transition-colors size-5 p-0.5"
                              >
                                <CheckIcon className="size-4" />
                              </Button>
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelRename}
                                className="text-neutral-400 hover:text-red-500 transition-colors size-5 p-0.5"
                              >
                                <XIcon className="size-4" />
                              </Button>
                            </div>
                            ) : (
                              <span className="truncate max-w-[8rem]">{chat.title}</span>
                            )}
                          </div>
                          
                          {renamingChatId !== (user ? chat._id : chat.id) && (
                            <div className="flex items-center gap-1">
                              <div
                                className="flex items-center justify-center cursor-pointer text-neutral-400 hover:text-white group-hover/chat-title:opacity-100 sm:opacity-0 transition-all p-1"
                                onClick={(e) => {
                                  handleRenameChat(user ? chat._id : chat.id, chat.title)
                                  e.stopPropagation()
                                }}
                              >
                                <PencilIcon className="size-4" />
                              </div>
                              <div
                                className="flex items-center justify-center cursor-pointer text-neutral-400 hover:text-red-500 group-hover/chat-title:opacity-100 sm:opacity-0 transition-all p-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteChat(user ? chat._id : chat.id)
                                }}
                              >
                                <TrashIcon className="size-4" />
                              </div>
                            </div>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  )) : (
                    <SidebarMenuItem className="flex flex-row items-center gap-2">
                      <span className="w-full mt-1 p-4 text-neutral-400 text-md text-center">No chats found</span>
                    </SidebarMenuItem>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="bg-neutral-950 border-t border-neutral-700/50 p-4 py-6 sm:py-4 flex flex-row items-center justify-center gap-0">
              <SignedOut>
                <SignInButton mode="modal">
                  <div className="flex flex-row items-center gap-2 justify-center cursor-pointer w-auto hover:text-accent transition-colors pr-4 border-r-1 border-neutral-700 text-neutral-100">
                    <LogInIcon className="size-4" />
                    <span>Sign In</span>
                  </div>
                </SignInButton>
                <div className='pl-4 m-0 hover:text-accent cursor-pointer text-neutral-100' onClick={() => router.push('/settings')}>
                  <SettingsIcon className='size-5' />
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex flex-row items-center gap-2 justify-center cursor-pointer w-full relative overflow-hidden">
                  <Link href="/settings" className="flex flex-row items-center gap-2 justify-center cursor-pointer w-full transition-colors">
                    <span>{user?.fullName}</span>
                    <img src={user?.imageUrl} alt="User" className="size-8 rounded-full" />
                  </Link>
                </div>
              </SignedIn>
            </SidebarFooter>
          </Sidebar>
          
          <main className="flex-1 relative h-full overflow-hidden flex flex-col bg-neutral-950">
            <div className={`fixed top-0 left-0 z-20 m-2 bg-neutral-900/50 backdrop-blur-xs rounded-md transition-all ${!isMobile && sidebarOpen && 'translate-x-72'}`}>
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