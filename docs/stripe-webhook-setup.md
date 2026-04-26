# Stripe Webhook Setup

This document covers how to configure Stripe webhooks for three environments: local development, Vercel Preview, and production.

---

## Webhook endpoint

All environments use the same path:

```
POST /api/webhooks/stripe
```

---

## Events to subscribe to

Register the following events in every webhook endpoint you create:

| Event | Purpose |
|-------|---------|
| `payment_intent.succeeded` | Mark booking as paid, auto-confirm PENDING bookings |
| `payment_intent.payment_failed` | Log payment failure for operator visibility |
| `charge.refunded` | Update `paymentStatus` to REFUNDED or PARTIALLY_PAID |

---

## 1. Local development

Use the Stripe CLI to forward events to your local server.

**Step 1 — Install the Stripe CLI:**
```bash
# macOS
brew install stripe/stripe-cli/stripe
# Windows: download from https://github.com/stripe/stripe-cli/releases
```

**Step 2 — Log in:**
```bash
stripe login
```

**Step 3 — Forward to your local server:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI prints your local webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 4 — Add to `.env.local`:**
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 5 — Trigger a test event:**
```bash
stripe trigger payment_intent.succeeded
```

Check your Next.js server logs for `[Stripe Webhook] ...` messages.

---

## 2. Vercel Preview deployments

Each Vercel Preview branch gets a unique URL like:
```
https://autokos-launch-git-<branch>-<org>.vercel.app
```

To test Stripe payments on a preview branch, you need a **separate webhook endpoint** in the Stripe Dashboard. Use test-mode keys only.

**Step 1 — Open Stripe Dashboard (test mode):**
Go to [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)

**Step 2 — Add endpoint:**
Click **"Add endpoint"** and fill in:
- **Endpoint URL:** `https://autokos-launch-git-<your-branch>-<org>.vercel.app/api/webhooks/stripe`
- **Events:** select `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- **Version:** latest

**Step 3 — Copy the signing secret:**
After saving, click **"Reveal"** next to **Signing secret**.

**Step 4 — Add to Vercel environment variables:**
In Vercel → Project → Settings → Environment Variables:
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_...` (the preview webhook secret — different from production!)
- Environment: **Preview** only (not Production)

> ⚠️ The webhook secret for Preview must be different from Production. Each webhook endpoint in Stripe has its own signing secret.

**Step 5 — Verify:**
After deploying, go to Stripe Dashboard → Webhooks → click your endpoint → click **"Send test webhook"** → select `payment_intent.succeeded`. Check Vercel function logs for a `200 received: true` response.

---

## 3. Production

**Step 1 — Add endpoint:**
In Stripe Dashboard (**live mode**, not test):
- **Endpoint URL:** `https://yourdomain.com/api/webhooks/stripe`
- **Events:** same three events as above

**Step 2 — Add to Vercel environment variables:**
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_...` (live webhook secret)
- Environment: **Production** only

---

## Vercel log verification

To check that a webhook was received and processed:

1. Go to Vercel → Project → Deployments → select a deployment
2. Click **Functions** → search for `api/webhooks/stripe`
3. Click the function → **Logs**
4. Look for:
   - `[Stripe Webhook] ` — event type processing messages
   - No `[Stripe Webhook] Signature verification failed` errors
   - HTTP `200` responses

Stripe marks a webhook delivery as failed if it does not receive a `2xx` response within 30 seconds. It retries with exponential backoff up to 3 days.

---

## Security notes

- The webhook endpoint is intentionally **unauthenticated** (no session cookie) — Stripe cannot provide one.
- All requests are verified using the `stripe-signature` header and `STRIPE_WEBHOOK_SECRET`.
- Idempotency is enforced via the `WebhookEvent` table (`provider + eventId` unique index) — duplicate deliveries are safely ignored.
- Never log the full webhook payload as it may contain PII.

---

## Environment variable summary

| Variable | Dev (local) | Preview | Production |
|----------|-------------|---------|------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | CLI local secret | Preview endpoint secret | Production endpoint secret |
