// src/app/(customer)/dashboard/security/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validations/auth";
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, ChevronLeft, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function SecurityPage() {
  const [pwStatus, setPwStatus] = useState<"idle" | "success" | "error">("idle");
  const [pwError, setPwError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    setPwStatus("idle");
    setPwError(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setPwStatus("error");
        setPwError(result.error ?? "Failed to change password");
        return;
      }
      setPwStatus("success");
      reset();
      setTimeout(() => setPwStatus("idle"), 5000);
    } catch {
      setPwStatus("error");
      setPwError("Something went wrong. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE MY ACCOUNT") {
      setDeleteError('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }
    if (!deletePassword) {
      setDeleteError("Please enter your password.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirm }),
      });
      const result = await res.json();
      if (!res.ok) {
        setDeleteError(result.error ?? "Failed to delete account.");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/?deleted=1" });
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 mb-3 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900 flex items-center gap-3">
            <Lock className="h-7 w-7 text-gray-400" /> Security
          </h1>
          <p className="text-gray-500 mt-1">Manage your password and account security</p>
        </div>
      </div>

      <div className="page-container py-8 max-w-lg mx-auto space-y-6">
        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-navy-900 mb-5">Change Password</h2>

          {pwStatus === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700">Password updated successfully!</p>
            </div>
          )}
          {pwStatus === "error" && pwError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{pwError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Current Password</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} autoComplete="current-password" placeholder="Your current password" className={cn("form-input pr-10", errors.currentPassword && "border-red-400")} {...register("currentPassword")} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">New Password</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} autoComplete="new-password" placeholder="Min 8 chars, A-Z, a-z, 0-9" className={cn("form-input pr-10", errors.newPassword && "border-red-400")} {...register("newPassword")} />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
              <input type="password" autoComplete="new-password" placeholder="Repeat new password" className={cn("form-input", errors.confirmPassword && "border-red-400")} {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
            </button>
          </form>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">Password Tips</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Use at least 12 characters for best security</li>
            <li>• Mix uppercase, lowercase, numbers and symbols</li>
            <li>• Never reuse passwords from other websites</li>
            <li>• Consider using a password manager</li>
          </ul>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <h2 className="font-bold text-red-700">Danger Zone</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone. Any pending or confirmed bookings will be cancelled.
          </p>
          <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" /> Delete My Account
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-navy-900">Delete Account</h2>
                <p className="text-xs text-gray-500">This is permanent and cannot be reversed</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 text-sm text-red-700">
              <strong>Warning:</strong> All your data will be permanently deleted, including your profile, booking history, and personal information. Any pending or confirmed bookings will be automatically cancelled.
            </div>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Your Password (to confirm identity)
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Type <span className="font-mono text-red-600 normal-case">DELETE MY ACCOUNT</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className={cn("form-input", deleteConfirm && deleteConfirm !== "DELETE MY ACCOUNT" && "border-red-400")}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteConfirm(""); setDeleteError(null); }}
                disabled={deleting}
                className="flex-1 btn-secondary py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== "DELETE MY ACCOUNT" || !deletePassword}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="h-4 w-4" /> Delete Account</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
