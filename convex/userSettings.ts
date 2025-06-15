import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const get = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return settings;
  },
});

export const update = mutation({
  args: {
    clerkId: v.string(),
    colorTheme: v.optional(v.union(v.literal("purple"), v.literal("red"), v.literal("pink"), v.literal("blue"), v.literal("green"))),
    codeTheme: v.optional(v.string()),
    darkMode: v.optional(v.boolean()),
    openRouterApiKey: v.optional(v.string()),
    customPrompt: v.optional(v.boolean()),
    customPromptText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, ...updates } = args;
    
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingSettings) {
      return await ctx.db.patch(existingSettings._id, updates);
    } else {
      return await ctx.db.insert("userSettings", {
        clerkId,
        colorTheme: "purple",
        codeTheme: "dark-plus",
        darkMode: true,
        ...updates,
      });
    }
  },
}); 