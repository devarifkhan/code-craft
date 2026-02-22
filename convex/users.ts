import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const syncUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!existingUser) {
      await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        isPro: false,
      });
    }
  },
});

export const getUser = query({
  args: { userId: v.string() },

  handler: async (ctx, args) => {
    if (!args.userId) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;

    return user;
  },
});

export const upgradeToPro = mutation({
  args: {
    email: v.string(),
    stripeCustomerId: v.string(),
    stripeSessionId: v.string(),
    amount: v.number(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    // If not found by email, try by userId
    if (!user && args.userId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_user_id")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
    }

    // If still not found, upsert the user so payment is never lost
    if (!user) {
      if (!args.userId) throw new Error("User not found");
      const id = await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: "",
        isPro: false,
      });
      user = await ctx.db.get(id);
    }

    await ctx.db.patch(user!._id, {
      isPro: true,
      proSince: Date.now(),
      stripeCustomerId: args.stripeCustomerId,
      stripeSessionId: args.stripeSessionId,
    });

    return { success: true };
  },
});
