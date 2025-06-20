import models from "@/models/models";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    title: v.string(),
    clerkId: v.string(),
    hasBeenRenamed: v.optional(v.boolean()),
  }).index("by_clerkId", ["clerkId"]),
  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    model: v.union(...models.map((model) => v.literal(model.id)), v.literal("user")),
    isComplete: v.boolean(),
    reasoning: v.optional(v.string()),
    // parentId: v.union(v.id("messages"), v.literal("root")),
    // childrenIds: v.array(v.id("messages")),
  }).index("by_chat", ["chatId"]),
  userSettings: defineTable({
    clerkId: v.string(),
    colorTheme: v.union(v.literal("purple"), v.literal("red"), v.literal("pink"), v.literal("blue"), v.literal("green")),
    codeTheme: v.string(),
    darkMode: v.optional(v.boolean()),
    openRouterApiKey: v.optional(v.string()),
    customPrompt: v.optional(v.boolean()),
    customPromptText: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),
})