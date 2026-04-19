// src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, Car, Eye, EyeOff } from "lucide-react";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { cn } from "@/lib/utils";
import { useT, useLanguage } from "@/lib/i18n/context";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const t = useT();
  const { locale } = useLanguage();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false, phone: "", nationality: "" },
  });

  const onSubmit = async (data: RegisterValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          nationality: data.nationality,
          password: data.password,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.error ?? (locale === "al" ? "Regjistrimi dështoi" : "Registration failed"));
        return;
      }

      // Sign in immediately so the user lands in a logged-in state, then
      // redirect to the "check email" page instead of the dashboard.
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      router.push(`/check-email?email=${encodeURIComponent(data.email)}`);
      router.refresh();
    } catch {
      setServerError(t.common.errorOccurred);
    }
  };

  const Field = ({
    id,
    label,
    error,
    children,
  }: {
    id: string;
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-10 w-10 bg-navy-900 rounded-xl flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-display text-2xl font-bold text-navy-900">Auto</span>
                <span className="font-display text-2xl font-bold text-crimson-500">Kos</span>
              </div>
            </Link>
            <h1 className="text-xl font-bold text-navy-900 mt-4">{t.auth.registerTitle}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.auth.registerSubtitle}</p>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.auth.firstNameLabel}</label>
                <input id="firstName" type="text" autoComplete="given-name" placeholder="John" className={cn("form-input", errors.firstName && "border-red-400")} {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.auth.lastNameLabel}</label>
                <input id="lastName" type="text" autoComplete="family-name" placeholder="Doe" className={cn("form-input", errors.lastName && "border-red-400")} {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.auth.emailLabel}</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={cn("form-input", errors.email && "border-red-400")} {...register("email")} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <Field id="phone" label={t.auth.phoneLabel} error={errors.phone?.message}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="phone"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="44 123 456"
                  />
                )}
              />
            </Field>

            <Field id="nationality" label={t.auth.nationalityLabel} error={errors.nationality?.message}>
              <Controller
                name="nationality"
                control={control}
                render={({ field }) => (
                  <CountrySelect
                    id="nationality"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Select nationality"
                    valueType="nationality"
                    error={errors.nationality?.message}
                  />
                )}
              />
            </Field>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                {t.auth.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
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
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.auth.confirmPasswordLabel}</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" className={cn("form-input", errors.confirmPassword && "border-red-400")} {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("acceptTerms")}
                  className="h-4 w-4 mt-0.5 rounded border-gray-300 text-navy-900"
                />
                <span className="text-xs text-gray-600">
                  {locale === "al"
                    ? "Pranoj Kushtet dhe Rregullat dhe konfirmoj se jam mbi 18 vjeç"
                    : "I accept the Terms and Conditions and confirm I am 18 years of age or older"}
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-500 mt-1 ml-6">{errors.acceptTerms.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {locale === "al" ? "Duke krijuar llogarinë..." : "Creating Account..."}</>
              ) : (
                t.auth.registerButton
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            {t.auth.haveAccount}{" "}
            <Link href="/login" className="text-navy-900 font-semibold hover:underline">{t.auth.loginButton}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
