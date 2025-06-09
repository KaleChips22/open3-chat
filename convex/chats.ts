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
    return await ctx.db.query("chats").filter((q) => q.eq(q.field("clerkId"), args.clerkId)).collect()
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
      clerkId: args.clerkId
    })

    return chat
  }
})

export const deleteChat = mutation({
  args: {
    id: v.id("chats")
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").filter((q) => q.eq(q.field("chatId"), args.id)).collect()

    for (const message of messages) {
      await ctx.db.delete(message._id)
    }

    await ctx.db.delete(args.id)
  }
})