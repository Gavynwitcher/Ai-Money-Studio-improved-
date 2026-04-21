import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/stripe/server";
import {
  handleInvoiceEvent,
  recordStripeEvent,
  syncCheckoutSession,
  upsertSubscriptionFromStripeSubscription
} from "@/lib/server/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getEventUserId(event: Stripe.Event) {
  const object = event.data.object as unknown as Record<string, unknown>;
  const metadata = (object.metadata ?? {}) as Record<string, string | undefined>;
  return metadata.userId ?? null;
}

export async function POST(req: Request) {
  try {
    const stripe = getStripeServerClient();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = getStripeWebhookSecret();
    const payload = await req.text();

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Stripe webhook secret or signature is missing." },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    const userId = getEventUserId(event);

    switch (event.type) {
      case "checkout.session.completed":
        await syncCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscriptionFromStripeSubscription(event.data.object as Stripe.Subscription, userId);
        break;
      case "invoice.paid":
        await handleInvoiceEvent(event.data.object as Stripe.Invoice, true);
        break;
      case "invoice.payment_failed":
        await handleInvoiceEvent(event.data.object as Stripe.Invoice, false);
        break;
      default:
        break;
    }

    await recordStripeEvent(event, userId);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe webhook processing failed." },
      { status: 400 }
    );
  }
}
