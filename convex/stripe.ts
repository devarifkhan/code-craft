"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { createHmac } from "crypto";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function verifySignature(payload: string, signature: string): boolean {
  // Stripe signature format: t=timestamp,v1=hash
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const hmac = createHmac("sha256", webhookSecret);
  const computedSignature = hmac.update(signedPayload).digest("hex");

  return computedSignature === v1;
}

export const verifyWebhook = internalAction({
  args: {
    payload: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const isValid = verifySignature(args.payload, args.signature);

    if (!isValid) {
      throw new Error("Invalid Stripe webhook signature");
    }

    return JSON.parse(args.payload);
  },
});
