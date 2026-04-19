// src/app/(auth)/verify-email/page.tsx
// Server Component — consumes the verification token on render, then shows
// a success or error state. No client-side JS required for the actual verify step.

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle, Car, Mail } from "lucide-react";

type VerifyResult =
  | { status: "success" }
  | { status: "already_verified" }
  | { status: "expired"; email: string }
  | { status: "invalid" }
  | { status: "no_token" };

async function verifyToken(token: string): Promise<VerifyResult> {
  try {
    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record) {
      // Could be already-used or never existed — distinguish by checking the DB
      return { status: "invalid" };
    }

    if (record.expires < new Date()) {
      // Remove expired token and tell user to request a new link
      await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }).catch(() => {});
      return { status: "expired", email: record.identifier };
    }

    // Consume the token and mark the user as verified atomically.
    // updateMany is intentional: if the user is somehow already verified,
    // this is a no-op instead of an error.
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { email: record.identifier, emailVerified: null },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: record.identifier, token } },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        action: "EMAIL_VERIFIED",
        entity: "User",
        details: { email: record.identifier },
      },
    }).catch(() => {});

    return { status: "success" };
  } catch {
    return { status: "invalid" };
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const result: VerifyResult = token
    ? await verifyToken(token)
    : { status: "no_token" };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-display text-2xl font-bold text-navy-900">Auto</span>
              <span className="font-display text-2xl font-bold text-crimson-500">Kos</span>
            </div>
          </Link>

          {result.status === "success" && (
            <>
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-9 w-9 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Email Verified!</h1>
              <p className="text-gray-500 text-sm mb-6">
                Your email address has been confirmed. Your account is now fully active.
              </p>
              <Link href="/dashboard" className="btn-primary w-full py-3 block">
                Go to My Dashboard
              </Link>
              <Link href="/" className="block text-sm text-gray-400 hover:text-navy-900 mt-3 transition-colors">
                Back to homepage
              </Link>
            </>
          )}

          {result.status === "already_verified" && (
            <>
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-9 w-9 text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Already Verified</h1>
              <p className="text-gray-500 text-sm mb-6">
                Your email address is already verified. You&apos;re all set.
              </p>
              <Link href="/dashboard" className="btn-primary w-full py-3 block">
                Go to My Dashboard
              </Link>
            </>
          )}

          {result.status === "expired" && (
            <>
              <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-9 w-9 text-amber-500" />
              </div>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Link Expired</h1>
              <p className="text-gray-500 text-sm mb-6">
                This verification link has expired (links are valid for 24 hours). Request a new one below.
              </p>
              <Link
                href={`/check-email?email=${encodeURIComponent(result.email)}`}
                className="btn-primary w-full py-3 block"
              >
                <span className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" /> Send New Verification Email
                </span>
              </Link>
            </>
          )}

          {(result.status === "invalid" || result.status === "no_token") && (
            <>
              <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="h-9 w-9 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Invalid Link</h1>
              <p className="text-gray-500 text-sm mb-6">
                This verification link is invalid or has already been used. If you need a new link, sign in and use the banner in your dashboard to resend it.
              </p>
              <Link href="/login" className="btn-primary w-full py-3 block">
                Sign In
              </Link>
              <Link href="/" className="block text-sm text-gray-400 hover:text-navy-900 mt-3 transition-colors">
                Back to homepage
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
