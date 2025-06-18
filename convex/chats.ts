import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const getAllChats = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chats").collect()
  }
})

export const getMyChats = query({
  args: {
    clerkId: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("chats").withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId)).collect()
  }
})

export const getChat = query({
  args: {
    id: v.union(v.id("chats"), v.string())
  },
  handler: async (ctx, args) => {
    try {
      const chat = await ctx.db.get(args.id as Id<"chats">)

      return chat
    } catch (error) {
      console.error(error)
      return null
    } 
  }
})

export const createChat = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.insert("chats", {
      title: "New Chat",
      clerkId: args.clerkId,
      hasBeenRenamed: false,
    })

    return chat
  }
})

export const renameChat = mutation({
  args: {
    id: v.id("chats"),
    name: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      title: args.name,
      hasBeenRenamed: true,
    })
  }
})

export const deleteChat = mutation({
  args: {
    id: v.id("chats")
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").withIndex("by_chat", (q) => q.eq("chatId", args.id)).collect()

    for (const message of messages) {
      await ctx.db.delete(message._id)
    }

    await ctx.db.delete(args.id)
  }
})

export const branchChat = mutation({
  args: {
    clerkId: v.string(),
    chatId: v.id("chats"),
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    const oldChat = await ctx.db.get(args.chatId)

    const newChat = await ctx.db.insert("chats", {
      title: "Branch of: " + oldChat!.title,
      clerkId: args.clerkId,
      hasBeenRenamed: false,
    })

    const baseMessage = await ctx.db.get(args.messageId)

    const messagesToSend = (await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect())
      .filter((m) => m._creationTime < baseMessage!._creationTime)
    
    for (const message of messagesToSend) {
      await ctx.db.insert("messages", {
        chatId: newChat,
        content: message.content,
        role: message.role,
        model: message.model,
        isComplete: message.isComplete,
        reasoning: message.reasoning,
      })
    }



    return newChat
  }
})