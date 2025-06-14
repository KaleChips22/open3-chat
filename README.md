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
- [ ] BYOK (w/ Most major carriers (OpenAI, Anthropic, etc.) maybe...) as well as OpenRouter (fs)
- [X] Guest Chatting
  - [ ] Limit guest chats to free models, unless they have their own key
- [X] Syntax Highlighting
- [X] Documentation
- [ ] Chat actions (retry/delete)
  - [ ] Layout
  - [ ] Convex ftns

### Requirements
 - [X] **All Done!**

### Actual AI Stuff / Required Features
- [X] Let users select a model
- [X] Use streams to generate data live

### Other Features
- [X] Reasoning Detials
- [X] Syntax Highlighting
- [X] Guest Chatting
- [ ] BYOK
- [ ] Resumable streams
- [X] Settings Page

#### Serious Settings
- [ ] Light/Dark Toggle
- [X] BYOK inputs
- [ ] BYOK backend support

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
- [X] Syntax Highlighting
- [X] Select Model
  - [X] UI Selector (soon)
  - [X] Backend selection
- [X] Settings Page
  - [X] Themes
- [X] Code theme (?)
- [X] Switch Themes
  - Purple (default)
  - Red
  - Pink
  - Blue
  - Green
- [X] Chat with Various LLMs
- [X] Authentication & Sync
- [X] Browser Friendly
- [X] Easy to Try
  - [X] Guest Chatting

### Doing Next
- [ ] Add user model to convex
  - [ ] Add custom API key
- [ ] Add system prompts
- [ ] Manage State in Stream **IN PROGRESS**
  - ~~**fix whatever is wrong with the freaking code blocks!!!!!!!!!!!**~~ (I can't believe i litteraly just forgot an item in the dependancy array this was killing me all night smh)
  - [X] Lock input until stream is done
  - [X] Distinguish between thinking and normal responses
  - [ ] Web search integration (?)
#### **Last Updated: 06/14/2025,  01:13 PM**