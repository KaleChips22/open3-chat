import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllChats = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chats").collect()
  }
})

export const getChat = query({
  args: {
    id: v.id("chats")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  }
})

export const createChat = mutation({
  args: {},
  handler: async (ctx) => {
    const chat = await ctx.db.insert("chats", {
      title: "New Chat",
      messages: []
    })

    return chat
  }
})