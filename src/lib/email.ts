// src/lib/email.ts
// ─── Email Service ────────────────────────────────────────────────────────────
// Centralised email delivery. All email sends go through this module.
// Non-blocking callers should .catch() and log — never await in request handlers
// where a send failure would break the booking flow.

import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { BUSINESS_TIMEZONE } from "@/lib/utils";

// ─── Transport ────────────────────────────────────────────────────────────────

function createTransport() {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.EMAIL_SERVER_PORT ?? 587);
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (!host || !user || !pass) {
    // Return a fake transport in development when not configured
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Email] Not configured — emails will be logged only");
      return null;
    }
    throw new Error("EMAIL_SERVER_HOST, EMAIL_SERVER_USER, and EMAIL_SERVER_PASSWORD must be set");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
  });
}

const FROM = process.env.EMAIL_FROM ?? "AutoKos <noreply@autokos.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function sendMail(opts: nodemailer.SendMailOptions): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    console.log("[Email DEV] Would send:", { to: opts.to, subject: opts.subject });
    return;
  }
  await transport.sendMail({ from: FROM, ...opts });
}

// ─── Security: HTML escape ─────────────────────────────────────────────────────
// Prevent HTML injection when user-supplied data appears inside email templates.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ─── Dynamic business info (from SiteSettings) ────────────────────────────────

interface EmailBizInfo {
  businessName: string;
  phone: string;
  supportEmail: string;
  address: string;
  appUrl: string;
}

async function getEmailBizInfo(): Promise<EmailBizInfo> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["business_name", "contact_phone", "contact_email", "contact_address"] } },
    });
    const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      businessName: m.business_name || "AutoKos",
      phone: m.contact_phone || "+383 44 123 456",
      supportEmail: m.contact_email || "info@autokos.com",
      address: m.contact_address || "Rr. Nënë Tereza, Nr. 45, Prishtinë 10000, Kosovo",
      appUrl: APP_URL,
    };
  } catch {
    return {
      businessName: "AutoKos",
      phone: "+383 44 123 456",
      supportEmail: "info@autokos.com",
      address: "Rr. Nënë Tereza, Nr. 45, Prishtinë 10000, Kosovo",
      appUrl: APP_URL,
    };
  }
}

// ─── Base template ────────────────────────────────────────────────────────────

function htmlWrapper(bodyHtml: string, biz: EmailBizInfo): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(biz.businessName)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <!-- Header -->
        <tr>
          <td style="background:#0F1E3C;padding:24px 32px;">
            <table><tr>
              <td style="background:#E63B2E;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
                <span style="color:white;font-size:18px;font-weight:bold;">AK</span>
              </td>
              <td style="padding-left:12px;">
                <span style="color:white;font-size:22px;font-weight:bold;font-family:Georgia,serif;">${escapeHtml(biz.businessName)}</span>
                <br/>
                <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Premium Car Rental Kosovo</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e4e4e7;">
            <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
              ${escapeHtml(biz.businessName)} &middot; ${escapeHtml(biz.address)}<br/>
              &#128222; ${escapeHtml(biz.phone)} &middot; &#9993; ${escapeHtml(biz.supportEmail)}<br/>
              <a href="${escapeHtml(biz.appUrl)}" style="color:#0F1E3C;">${escapeHtml(biz.appUrl)}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Email senders ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName?: string | null
): Promise<void> {
  const biz = await getEmailBizInfo();
  const resetUrl = `${biz.appUrl}/reset-password?token=${token}`;
  const safeName = escapeHtml(firstName ?? "there");

  await sendMail({
    to: email,
    subject: `Reset your ${biz.businessName} password`,
    html: htmlWrapper(`
      <h2 style="color:#0F1E3C;margin-top:0;">Password Reset Request</h2>
      <p style="color:#374151;">Hi ${safeName},</p>
      <p style="color:#374151;">We received a request to reset your ${escapeHtml(biz.businessName)} account password. Click the button below to create a new password:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${escapeHtml(resetUrl)}" style="background:#E63B2E;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
          Reset My Password
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px;">This link will expire in <strong>1 hour</strong>.</p>
      <p style="color:#6b7280;font-size:14px;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;">If the button above doesn&apos;t work, copy this link: <br/><a href="${escapeHtml(resetUrl)}" style="color:#0F1E3C;word-break:break-all;">${escapeHtml(resetUrl)}</a></p>
    `, biz),
  });
}

export async function sendBookingConfirmationEmail(
  email: string,
  booking: {
    bookingRef: string;
    firstName: string;
    carName: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupDateTime: Date;
    dropoffDateTime: Date;
    totalAmount: number;
    depositAmount: number;
  }
): Promise<void> {
  const biz = await getEmailBizInfo();

  const pickupStr = booking.pickupDateTime.toLocaleString("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const returnStr = booking.dropoffDateTime.toLocaleString("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const safeRef = escapeHtml(booking.bookingRef);
  const safeName = escapeHtml(booking.firstName);
  const safeCar = escapeHtml(booking.carName);
  const safePickup = escapeHtml(booking.pickupLocation);
  const safeDropoff = escapeHtml(booking.dropoffLocation);

  await sendMail({
    to: email,
    subject: `Booking Confirmed — ${booking.bookingRef} | ${biz.businessName}`,
    html: htmlWrapper(`
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px 20px;border-radius:4px;margin-bottom:24px;">
        <p style="color:#166534;font-weight:bold;font-size:18px;margin:0;">&#10003; Booking Confirmed!</p>
      </div>
      <p style="color:#374151;">Hi ${safeName},</p>
      <p style="color:#374151;">Your car rental booking has been confirmed. Here are your details:</p>

      <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e4e4e7;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;width:45%;">Booking Reference:</td>
            <td style="padding:8px 0;font-weight:bold;color:#0F1E3C;font-family:monospace;font-size:16px;">${safeRef}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;border-top:1px solid #e4e4e7;">Vehicle:</td>
            <td style="padding:8px 0;font-weight:bold;color:#0F1E3C;border-top:1px solid #e4e4e7;">${safeCar}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;border-top:1px solid #e4e4e7;">Pickup:</td>
            <td style="padding:8px 0;color:#374151;border-top:1px solid #e4e4e7;">${safePickup}<br/><strong>${pickupStr}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;border-top:1px solid #e4e4e7;">Return:</td>
            <td style="padding:8px 0;color:#374151;border-top:1px solid #e4e4e7;">${safeDropoff}<br/><strong>${returnStr}</strong></td>
          </tr>
          <tr>
            <td style="padding:12px 0 8px;color:#6b7280;font-size:14px;border-top:1px solid #e4e4e7;">Total Amount:</td>
            <td style="padding:12px 0 8px;font-weight:bold;font-size:20px;color:#E63B2E;border-top:1px solid #e4e4e7;">&#8364;${booking.totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Security Deposit:</td>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">&#8364;${booking.depositAmount.toFixed(2)} (pre-authorised at pickup, not charged)</td>
          </tr>
        </table>
      </div>

      <h3 style="color:#0F1E3C;margin-top:24px;">What to bring at pickup:</h3>
      <ul style="color:#374151;font-size:14px;line-height:2;">
        <li>Valid passport or national ID card</li>
        <li>Original driving licence</li>
        <li>Credit or debit card (for the security deposit)</li>
        <li>This booking confirmation</li>
      </ul>

      <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:24px;">
        <p style="color:#1e40af;font-size:14px;margin:0;font-weight:bold;">Questions? We&apos;re here 24/7</p>
        <p style="color:#1d4ed8;font-size:14px;margin:4px 0 0;">&#128222; ${escapeHtml(biz.phone)} &nbsp;|&nbsp; &#9993; ${escapeHtml(biz.supportEmail)}</p>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${escapeHtml(biz.appUrl)}/dashboard/bookings" style="background:#0F1E3C;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;">
          View Booking in My Account
        </a>
      </div>
    `, biz),
  });
}

export async function sendBookingStatusEmail(
  email: string,
  data: {
    bookingRef: string;
    firstName: string;
    carName: string;
    newStatus: string;
    reason?: string;
  }
): Promise<void> {
  const biz = await getEmailBizInfo();

  const safeRef = escapeHtml(data.bookingRef);
  const safeName = escapeHtml(data.firstName);
  const safeCar = escapeHtml(data.carName);
  const safeReason = data.reason ? escapeHtml(data.reason) : null;

  const statusMessages: Record<string, { subject: string; headline: string; body: string; color: string }> = {
    CONFIRMED: {
      subject: `Booking Confirmed — ${data.bookingRef}`,
      headline: "&#10003; Your booking is confirmed",
      body: "Great news! Your booking has been confirmed. See you at pickup.",
      color: "#22c55e",
    },
    CANCELLED: {
      subject: `Booking Cancelled — ${data.bookingRef}`,
      headline: "Your booking has been cancelled",
      body: safeReason
        ? `Your booking has been cancelled. Reason: ${safeReason}`
        : "Your booking has been cancelled. If you have questions, please contact us.",
      color: "#ef4444",
    },
    REJECTED: {
      subject: `Booking Update — ${data.bookingRef}`,
      headline: "We&apos;re unable to confirm your booking",
      body: safeReason
        ? `Unfortunately we cannot confirm your booking. Reason: ${safeReason}. Please contact us to discuss alternatives.`
        : "Unfortunately we cannot confirm this booking. Please contact us for assistance.",
      color: "#f97316",
    },
    COMPLETED: {
      subject: `Thank you for renting with ${biz.businessName} — ${data.bookingRef}`,
      headline: `Thank you for choosing ${escapeHtml(biz.businessName)}!`,
      body: "We hope you had a great experience. We&apos;d love to hear your feedback and look forward to serving you again.",
      color: "#0F1E3C",
    },
  };

  const msg = statusMessages[data.newStatus];
  if (!msg) return; // No email for this transition

  await sendMail({
    to: email,
    subject: msg.subject,
    html: htmlWrapper(`
      <div style="border-left:4px solid ${msg.color};padding:16px 20px;border-radius:4px;margin-bottom:24px;background:${msg.color}12;">
        <p style="color:${msg.color};font-weight:bold;font-size:18px;margin:0;">${msg.headline}</p>
      </div>
      <p style="color:#374151;">Hi ${safeName},</p>
      <p style="color:#374151;">${msg.body}</p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #e4e4e7;">
        <p style="color:#6b7280;font-size:14px;margin:0;">Booking Reference: <strong style="color:#0F1E3C;font-family:monospace;">${safeRef}</strong></p>
        <p style="color:#6b7280;font-size:14px;margin:4px 0 0;">Vehicle: <strong style="color:#0F1E3C;">${safeCar}</strong></p>
      </div>
      <p style="color:#374151;font-size:14px;">Questions? Contact us: &#128222; ${escapeHtml(biz.phone)} &nbsp;|&nbsp; &#9993; ${escapeHtml(biz.supportEmail)}</p>
    `, biz),
  });
}

export async function sendEmailVerificationEmail(
  email: string,
  token: string,
  firstName?: string | null
): Promise<void> {
  const biz = await getEmailBizInfo();
  const verifyUrl = `${biz.appUrl}/verify-email?token=${token}`;
  const safeName = escapeHtml(firstName ?? "there");

  await sendMail({
    to: email,
    subject: `Verify your ${biz.businessName} email address`,
    html: htmlWrapper(`
      <h2 style="color:#0F1E3C;margin-top:0;">Confirm Your Email Address</h2>
      <p style="color:#374151;">Hi ${safeName},</p>
      <p style="color:#374151;">Thank you for creating an account with ${escapeHtml(biz.businessName)}. Please verify your email address to complete your registration:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${escapeHtml(verifyUrl)}" style="background:#0F1E3C;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px;">This link will expire in <strong>24 hours</strong>.</p>
      <p style="color:#6b7280;font-size:14px;">If you did not create an account, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;">If the button above doesn&apos;t work, copy this link:<br/><a href="${escapeHtml(verifyUrl)}" style="color:#0F1E3C;word-break:break-all;">${escapeHtml(verifyUrl)}</a></p>
    `, biz),
  });
}

export async function sendContactNotificationEmail(
  adminEmail: string,
  submission: {
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    message: string;
  }
): Promise<void> {
  const biz = await getEmailBizInfo();

  const safeName = escapeHtml(submission.name);
  const safeEmail = escapeHtml(submission.email);
  const safePhone = submission.phone ? escapeHtml(submission.phone) : null;
  const safeSubject = submission.subject ? escapeHtml(submission.subject) : null;
  const safeMessage = escapeHtml(submission.message);

  await sendMail({
    to: adminEmail,
    subject: `New Contact Form Submission — ${safeSubject ?? "General Enquiry"}`,
    html: htmlWrapper(`
      <h2 style="color:#0F1E3C;margin-top:0;">New Contact Form Submission</h2>
      <div style="background:#f8fafc;border-radius:8px;padding:20px;border:1px solid #e4e4e7;">
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        ${safePhone ? `<p><strong>Phone:</strong> ${safePhone}</p>` : ""}
        ${safeSubject ? `<p><strong>Subject:</strong> ${safeSubject}</p>` : ""}
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:16px 0;" />
        <p><strong>Message:</strong></p>
        <p style="color:#374151;white-space:pre-wrap;">${safeMessage}</p>
      </div>
      <p style="font-size:13px;color:#6b7280;margin-top:16px;">Reply directly to this email or visit the admin panel to respond.</p>
    `, biz),
    replyTo: submission.email,
  });
}
