'use client'

import BackgroundEffects from '@/components/BackgroundEffects'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import useLocalStorage from '@/hooks/useLocalStorage'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme } from '@/components/ThemeProvider'
import { useClerk, useUser } from '@clerk/nextjs'
import { ArrowLeftIcon, LogOutIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

const themes = [
  {
    id: "purple",
    name: "Purple",
    color: "bg-purple-500"
  },
  {
    id: "red",
    name: "Red",
    color: "bg-red-500"
  },
  {
    id: "pink",
    name: "Pink",
    color: "bg-pink-500"
  },
  {
    id: "blue",
    name: "Blue",
    color: "bg-blue-500"
  },
  {
    id: "green",
    name: "Green",
    color: "bg-green-500"
  }
]

const SettingsPage = () => {
  const { colorTheme, setColorTheme } = useTheme()
  const [codeTheme, setCodeTheme] = useLocalStorage("open3:codeTheme", "dark-plus")
  const [stupidMode, setStupidMode] = useLocalStorage("open3:stupidMode", false)
  const [brainrotMode, setBrainrotMode] = useLocalStorage("open3:brainrotMode", false)
  const [customPrompt, setCustomPrompt] = useLocalStorage("open3:customPrompt", false)

  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()

  const router = useRouter()

  return (
    <LayoutWithSidebar currentChatId={null}>
      <div className="h-full w-full flex flex-col bg-neutral-950 text-neutral-100 relative">
        <BackgroundEffects variant="dark" />

        <div className="container max-w-4xl mx-auto py-8 px-4 z-10">
          <div className="flex flex-row items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <Button variant="link" className="text-neutral-100 hover:text-neutral-100 cursor-pointer transition-all duration-300" onClick={() => router.back()}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Account Settings */ }
          {isSignedIn && (
            <Card className="mb-6 bg-black/20 backdrop-blur-md border border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white text-2xl font-bold">Account</CardTitle>
                <CardDescription className='text-neutral-400 text-md'>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 w-full lg:grid-cols-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="space-y-0.5">
                      <Label className='text-neutral-100 text-md'>Email</Label>
                      <p className="text-sm text-neutral-400">{user?.emailAddresses[0]?.emailAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="space-y-0.5">
                      <Label className='text-neutral-100 text-md'>Name</Label>
                      <p className="text-sm text-neutral-400">{user?.firstName} {user?.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="space-y-0.5">
                      <Label className='text-neutral-100 text-md'>Username</Label>
                      <p className="text-sm text-neutral-400">{user?.username}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <Button variant="outline" className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-neutral-100 hover:border-neutral-600 hover:text-neutral-100 cursor-pointer transition-all duration-300" onClick={() => signOut()} size="lg">
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theme Selection */}
          <Card className="mb-6 bg-black/20 backdrop-blur-md border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-2xl font-bold">Theme</CardTitle>
              <CardDescription className='text-neutral-400 text-md'>Choose your preferred theme color</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={colorTheme} onValueChange={(value) => setColorTheme(value as any)} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <div key={theme.id}>
                    <RadioGroupItem value={theme.id} id={theme.id} className="peer sr-only" />
                    <Label
                      htmlFor={theme.id}
                      className="flex flex-col items-center justify-between rounded-md border-1 bg-neutral-900 border-neutral-800 p-4 hover:bg-neutral-800 peer-data-[state=checked]:bg-neutral-800 [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-full ${theme.color} mb-2`} />
                      <span className='text-neutral-100'>{theme.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="mb-6 bg-black/20 backdrop-blur-md border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-2xl font-bold">Appearance</CardTitle>
              <CardDescription className='text-neutral-400 text-md'>Customize how Open3 Chat looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className='text-neutral-100 text-md'>Dark Mode</Label>
                  <p className="text-sm text-neutral-400">Toggle dark mode on or off</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div> */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className='text-neutral-100 text-md'>Code Theme</Label>
                  <p className="text-sm text-neutral-400">Choose your preferred code block theme</p>
                </div>
                <Select value={codeTheme} onValueChange={(value) => setCodeTheme(value)}>
                  <SelectTrigger className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-neutral-100">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border border-neutral-800 rounded-md">
                    <SelectItem value="dark-plus" className="text-neutral-100 cursor-pointer hover:bg-neutral-800">Dark Plus</SelectItem>
                    <SelectItem value="light-plus" className="text-neutral-100 cursor-pointer hover:bg-neutral-800">Light Plus</SelectItem>
                    <SelectItem value="monokai" className="text-neutral-100 cursor-pointer hover:bg-neutral-800">Monokai</SelectItem>
                    <SelectItem value="github-dark" className="text-neutral-100 cursor-pointer hover:bg-neutral-800">GitHub Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="mb-6 bg-black/20 backdrop-blur-md border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-2xl font-bold">API Keys</CardTitle>
              <CardDescription className='text-neutral-400 text-md'>Configure your API keys for different providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="space-y-2">
                <Label htmlFor="openai-key" className='text-neutral-100 text-md'>OpenAI API Key</Label>
                <Input id="openai-key" type="password" placeholder="sk-..." className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-neutral-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anthropic-key" className='text-neutral-100 text-md'>Anthropic API Key</Label>
                <Input id="anthropic-key" type="password" placeholder="sk-ant-..." className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-neutral-100" />
              </div> */}
              <div className="space-y-2">
                <Label htmlFor="openrouter-key" className='text-neutral-100 text-md'>OpenRouter API Key</Label>
                <Input id="openrouter-key" type="password" placeholder="sk-or-..." className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-neutral-100" />
              </div>
            </CardContent>
          </Card>

          {/* Fun Settings */}
          <Card className="bg-black/20 backdrop-blur-md border border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-2xl font-bold">Fun Settings</CardTitle>
              <CardDescription className='text-neutral-400 text-md'>Add some personality to your chat experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className='text-neutral-100 text-md'>Stupid Mode</Label>
                  <p className="text-sm text-neutral-400">Make the AI act stupid</p>
                </div>
                <Switch checked={stupidMode} onCheckedChange={setStupidMode} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className='text-neutral-100 text-md'>Brainrot Mode</Label>
                  <p className="text-sm text-neutral-400">Make the AI answer only in brainrot</p>
                </div>
                <Switch checked={brainrotMode} onCheckedChange={setBrainrotMode} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className='text-neutral-100 text-md'>Custom Prompt</Label>
                  <p className="text-sm text-neutral-400">Use a custom system prompt</p>
                </div>
                <Switch checked={customPrompt} onCheckedChange={setCustomPrompt} />
              </div>
              {customPrompt && (
                <div className="space-y-2">
                  <Label htmlFor="custom-prompt" className='text-neutral-100 text-md'>Custom System Prompt</Label>
                  <Input 
                    id="custom-prompt" 
                    placeholder="Enter your custom system prompt..." 
                    className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-neutral-100"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}

export default SettingsPage