import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import models from "@/models/models";

export default defineSchema({
  chats: defineTable({
    title: v.string(),
    clerkId: v.string(),
    hasBeenRenamed: v.boolean(),
  }),
  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    model: v.union(...models.map((model) => v.literal(model.id)), v.literal("user")),
    isComplete: v.boolean(),
    parentId: v.union(v.id("messages"), v.literal("root")),
    childrenIds: v.array(v.id("messages")),
  }).index("by_chat", ["chatId"]),
}); 