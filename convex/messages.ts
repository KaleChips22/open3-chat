import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import models from "@/models/models";

export const getMessagesForChat = query({
  args: {
    chatId: v.id("chats")
  },
  handler: async (ctx, args) => {
    return (await ctx.db
      .query("messages")
      .withIndex(
        "by_chat",
        (q) => q.eq("chatId", args.chatId)
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
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    model: v.union(...models.map((model) => v.literal(model.id)), v.literal("user")),
    reasoning: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      role: args.role,
      isComplete: false,
      model: args.model,
      reasoning: args.reasoning
    })
  }
})

export const updateMessage = mutation({
  args: {
    id: v.id("messages"),
    reasoning: v.string()
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id)
    if (!message) return null

    return await ctx.db.patch(args.id, {
      reasoning: args.reasoning
    })
  }
})

export const appendMessage = mutation({
  args: {
    id: v.id("messages"),
    content: v.string()
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id)
    if (!message) return null

    return await ctx.db.patch(args.id, {
      content: message.content + args.content
    })
  }
})

export const appendReasoning = mutation({
  args: {
    id: v.id("messages"),
    reasoning: v.string()
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id)
    if (!message) return null

    return await ctx.db.patch(args.id, {
      reasoning: (message.reasoning || "") + args.reasoning
    })
  }
})

export const completeMessage = mutation({
  args: {
    id: v.id("messages")
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id)
    if (!message) return null

    return await ctx.db.patch(args.id, {
      isComplete: true
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