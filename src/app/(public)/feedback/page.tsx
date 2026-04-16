// src/app/(public)/feedback/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { CheckCircle, AlertCircle, Loader2, MessageSquare, Star, Bug, Lightbulb, ThumbsUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["COMPLAINT", "SUGGESTION", "FEATURE_REQUEST", "BUG_REPORT", "OTHER"]),
  subject: z.string().min(3, "Subject is required").max(200),
  message: z.string().min(10, "Please provide more detail (at least 10 characters)").max(3000),
  name: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});
type FeedbackValues = z.infer<typeof schema>;

const TYPE_OPTIONS: { value: FeedbackValues["type"]; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "COMPLAINT", label: "Complaint", icon: <ThumbsUp className="h-5 w-5 rotate-180" />, description: "Report a bad experience" },
  { value: "SUGGESTION", label: "Suggestion", icon: <Lightbulb className="h-5 w-5" />, description: "Share an improvement idea" },
  { value: "FEATURE_REQUEST", label: "Feature Request", icon: <Star className="h-5 w-5" />, description: "Request a new feature" },
  { value: "BUG_REPORT", label: "Bug Report", icon: <Bug className="h-5 w-5" />, description: "Report a technical issue" },
  { value: "OTHER", label: "Other", icon: <HelpCircle className="h-5 w-5" />, description: "Anything else on your mind" },
];

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "SUGGESTION",
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: FeedbackValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.error ?? "Failed to submit. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-3">Thank you!</h2>
          <p className="text-gray-600 mb-2">Your feedback has been received. We review every submission and use it to improve our service.</p>
          <p className="text-gray-400 text-sm">If you reported an issue requiring a response, our team will get back to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero */}
      <div className="bg-navy-900 py-14">
        <div className="page-container text-center">
          <MessageSquare className="h-10 w-10 text-crimson-400 mx-auto mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">Share Your Feedback</h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Complaints, suggestions, bug reports — your feedback helps us build a better service for everyone.
          </p>
        </div>
      </div>

      <div className="page-container py-10 max-w-2xl mx-auto">
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Type selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-navy-900 mb-4">What type of feedback is this?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("type", opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                    selectedType === opt.value
                      ? "border-navy-900 bg-navy-50 text-navy-900"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <span className={selectedType === opt.value ? "text-navy-900" : "text-gray-400"}>{opt.icon}</span>
                  <span className="font-semibold text-sm">{opt.label}</span>
                  <span className="text-xs text-gray-400 leading-tight">{opt.description}</span>
                </button>
              ))}
            </div>
            <input type="hidden" {...register("type")} />
          </div>

          {/* Subject + Message */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-navy-900 mb-1">Details</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Subject <span className="text-crimson-500">*</span></label>
              <input
                type="text"
                placeholder="Brief summary of your feedback"
                className={cn("form-input", errors.subject && "border-red-400")}
                {...register("subject")}
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Message <span className="text-crimson-500">*</span></label>
              <textarea
                rows={6}
                placeholder="Describe your feedback in detail. The more information you provide, the better we can help."
                className={cn("form-input resize-none", errors.message && "border-red-400")}
                {...register("message")}
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
              <p className="text-xs text-gray-400 mt-1">Max 3,000 characters</p>
            </div>
          </div>

          {/* Contact info (for guests) */}
          {!session?.user && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-navy-900 mb-1">Your Contact Info <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              <p className="text-sm text-gray-500">Provide your details if you&apos;d like us to follow up with you.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Name</label>
                  <input type="text" placeholder="Your name" className={cn("form-input", errors.name && "border-red-400")} {...register("name")} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" placeholder="your@email.com" className={cn("form-input", errors.email && "border-red-400")} {...register("email")} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              </div>
            </div>
          )}

          {session?.user && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
              Submitting as <strong>{session.user.email}</strong>. Your feedback will be linked to your account.
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-base">
            {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</> : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
