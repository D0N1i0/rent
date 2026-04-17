// src/app/(auth)/reset-password/page.tsx
"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Car, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { useT, useLanguage } from "@/lib/i18n/context";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="h-8 w-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const t = useT();
  const { locale } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-bold text-navy-900 text-xl mb-2">
            {locale === "al" ? "Lidhje e Pavlefshme" : "Invalid Reset Link"}
          </h1>
          <p className="text-gray-600 text-sm mb-5">
            This password reset link is missing or invalid.
          </p>
          <Link href="/forgot-password" className="btn-primary text-sm px-5 py-2.5">
            {locale === "al" ? "Kërko Lidhje të Re" : "Request New Link"}
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.error ?? "Failed to reset password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setServerError(t.common.errorOccurred);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="h-10 w-10 bg-navy-900 rounded-xl flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-display text-2xl font-bold text-navy-900">Auto</span>
                <span className="font-display text-2xl font-bold text-crimson-500">Kos</span>
              </div>
            </Link>
            <h1 className="text-xl font-bold text-navy-900">{t.auth.resetTitle}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.auth.resetSubtitle}</p>
          </div>

          {done ? (
            <div className="text-center py-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="font-bold text-navy-900 mb-2">
                {locale === "al" ? "Fjalëkalimi u ndryshua me sukses" : "Password updated successfully"}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {locale === "al" ? "Duke ju ridrejtuar..." : "Redirecting to sign in..."}
              </p>
              <Link href="/login" className="btn-primary text-sm px-5 py-2.5">
                {t.auth.backToLogin}
              </Link>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    {locale === "al" ? "Fjalëkalimi i Ri" : "New Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min 8 chars, A-Z, a-z, 0-9"
                      className={cn("form-input pr-10", errors.password && "border-red-400")}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    {t.auth.confirmPasswordLabel}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    className={cn("form-input", errors.confirmPassword && "border-red-400")}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 mt-1"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {locale === "al" ? "Duke përditësuar..." : "Updating..."}</>
                  ) : (
                    t.auth.resetButton
                  )}
                </button>
              </form>
              <p className="text-center text-sm text-gray-600 mt-5">
                <Link href="/login" className="text-navy-900 font-semibold hover:underline">
                  {t.auth.backToLogin}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
