import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMessagesForChat = query({
  args: {
    chatId: v.id("chats")
  },
  handler: async (ctx, args) => {
    return (await ctx.db
      .query("messages")
      .filter(
        (q) => q.eq(q.field("chatId"), args.chatId)
      )
      .order("desc")
      .collect())
      .reverse()
  }
})

export const createMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      role: args.role
    })
  }
})

export const deleteMessage = mutation({
  args: {
    id: v.id("messages")
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id)
  }
})