# ~~T3 Chat~~ **Open3 Chat**
An open source LLM chat application built for [Theo's T3 Chat Cloneathon](https://cloneathon.t3.chat).

[![Netlify Status](https://api.netlify.com/api/v1/badges/07c92033-5691-4e8c-8a80-3cd56af71e1e/deploy-status)](https://app.netlify.com/projects/open3-chat/deploys)

---

[https://open3-chat.netlify.app/](https://open3-chat.netlify.app/)

## About
Open3 Chat is built with the [T3 Stack](https://create.t3.gg/)

### Frontend
The frontend is written in react, and uses tailwindcss for styling and some shadcn/ui components.

### Database
Open3 Chat uses convex as its database, due to the live syncing of convex. 

### Backend
The backend is composed entirely of next.js server actions and convex functions 

## Todo

- [X] Model selection
- [X] Have multiple models
- [ ] BYOK (w/ Most major carriers (OpenAI, Anthropic, etc.) maybe...) as well as OpenRouter
- [ ] Guest Chatting
- [X] Syntax Highlighting
- [ ] Documentation

### Requirements
- [ ] Chat with Various LLMs
- [X] Authentication & Sync
- [X] Browser Friendly
- [X] Easy to Try
  - [ ] Guest Chatting

### Actual AI Stuff / Required Features
- [X] Let users select a model
- [X] Use streams to generate data live

### Other Features
- [ ] Thinking Detials
- [X] Syntax Highlighting
- [ ] Guest Chatting
- [ ] BYOK
- [ ] Resumable streams
- [ ] Settings Page

#### Serious Settings
- [ ] Switch Themes
  - Purple (default)
  - Red
  - Pink
  - Blue
  - Green
- [ ] Light/Dark Toggle
- [ ] BYOK inputs
- [ ] Code theme (?)

#### Fun dumb shit
- [ ] Silly system prompts
  - you are stupid
  - answer only in brainrot
  - etc...
- [ ] Some other dumb shit :)

### Done
- [X] Main UI
  - [X] Landing Page UI
  - [X] Chat Page UI
  - [X] Sidebar UI
- [X] Clerk Integration
- [X] Convex Integration
- [X] Add chats to convex (still need to integrate with clerk)
- [X] Show chats in sidebar
- [X] Create Chat
- [X] View a chat page (/chat/:id)
- [X] Add clerk user id to chats, messages
- [X] Add messages table to Convex
- [X] Users can only see chats in the sidebar with their clerkId
- [X] Protect chats by auth
- [X] Add first model
- [X] Use the same functinality to call *all* models
- [X] AI responses should go directly to the sync enginge (convex)
- [X] Render markdown properly during stream input

### Doing Next
- [X] Select Model
  - [ ] UI Selector (soon)
  - [X] Backend selection
- [ ] Manage State in Stream **IN PROGRESS**
  - ~~**fix whatever is wrong with the freaking code blocks!!!!!!!!!!!**~~ (I can't believe i litteraly just forgot an item in the dependancy array this was killing me all night smh)
  - [X] Lock input until stream is done
  - [ ] Distinguish between thinking and normal responses
  - [ ] Web search integration (?)
- [X] Syntax Highlighting
- [ ] Settings Page
  - [ ] Themes
  - [ ] Light/Dark
#### **Last Updated: 06/09/2025,  08:27 AM**