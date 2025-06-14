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
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
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
    parentId: v.union(v.id("messages"), v.literal("root"))
  },
  handler: async (ctx, args) => {
    // Create the new message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      role: args.role,
      isComplete: false,
      model: args.model,
      parentId: args.parentId,
      childrenIds: []
    })

    // If this message has a parent, update the parent's childrenIds
    if (args.parentId !== "root") {
      const parent = await ctx.db.get(args.parentId)
      if (parent) {
        await ctx.db.patch(args.parentId, {
          childrenIds: [...parent.childrenIds, messageId]
        })
      }
    }

    return messageId
  }
})

export const appendMessage = mutation({
  args: {
    id: v.id("messages"),
    content: v.string()
  },
  handler: async (ctx, args) => {
    const previousContent = (await ctx.db.get(args.id))?.content ?? ""
    return await ctx.db.patch(args.id, {
      content: previousContent + args.content
    })
  }
})

export const completeMessage = mutation({
  args: {
    id: v.id("messages")
  },
  handler: async (ctx, args) => {
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
    const message = await ctx.db.get(args.id)
    if (!message) return

    // Recursively delete all child messages
    for (const childId of message.childrenIds) {
      await ctx.db.delete(childId)
    }

    // Remove this message from parent's childrenIds
    if (message.parentId !== "root") {
      const parent = await ctx.db.get(message.parentId)
      if (parent) {
        await ctx.db.patch(message.parentId, {
          childrenIds: parent.childrenIds.filter(id => id !== args.id)
        })
      }
    }

    return await ctx.db.delete(args.id)
  }
})

export const getMessageContext = query({
  args: {
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    const context: any[] = []
    let currentMessage = await ctx.db.get(args.messageId)
    
    while (currentMessage && currentMessage.parentId !== "root") {
      context.unshift(currentMessage)
      currentMessage = await ctx.db.get(currentMessage.parentId)
    }
    
    if (currentMessage) {
      context.unshift(currentMessage)
    }
    
    return context
  }
})