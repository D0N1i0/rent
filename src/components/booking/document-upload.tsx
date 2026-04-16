"use client";
// src/components/booking/document-upload.tsx
// Document upload widget for driving licence and ID during/after booking.

import { useState, useRef } from "react";
import { Upload, FileCheck, AlertCircle, Loader2, X } from "lucide-react";

interface DocumentUploadProps {
  bookingId: string;
  existingLicenseUrl?: string | null;
  existingIdUrl?: string | null;
  onUploadComplete?: (urls: { licenseUrl?: string; idUrl?: string }) => void;
}

interface FilePreview {
  file: File;
  preview: string;
}

export function DocumentUpload({
  bookingId,
  existingLicenseUrl,
  existingIdUrl,
  onUploadComplete,
}: DocumentUploadProps) {
  const [licenseFile, setLicenseFile] = useState<FilePreview | null>(null);
  const [idFile, setIdFile] = useState<FilePreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const licenseRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ".jpg,.jpeg,.png,.webp,.pdf";
  const MAX_MB = 8;

  function validateFile(file: File): string | null {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) return "Only JPG, PNG, WEBP, or PDF files allowed";
    if (file.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB} MB`;
    return null;
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: FilePreview | null) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError(null);
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setter({ file, preview });
  }

  async function handleUpload() {
    if (!licenseFile && !idFile) {
      setError("Please select at least one document to upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (licenseFile) formData.append("license", licenseFile.file);
      if (idFile) formData.append("identity", idFile.file);

      const res = await fetch(`/api/bookings/${bookingId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setSuccess(true);
      onUploadComplete?.({
        licenseUrl: data.documentLicenseUrl,
        idUrl: data.documentIdUrl,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <FileCheck className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-green-800">Documents uploaded successfully</p>
          <p className="text-sm text-green-600">Our team will review your documents before confirming your booking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-medium mb-1">Document Upload</p>
        <p className="text-xs text-blue-700">
          Please upload clear photos of your driving licence and a valid ID (passport or national ID card).
          Files must be JPG, PNG, WEBP, or PDF — max {MAX_MB} MB each.
        </p>
      </div>

      {/* Driving Licence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Driving Licence {existingLicenseUrl && <span className="text-green-600 text-xs font-normal">(already uploaded)</span>}
        </label>
        <div
          onClick={() => licenseRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-navy-400 transition-colors"
        >
          {licenseFile ? (
            <div className="flex items-center gap-3">
              {licenseFile.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={licenseFile.preview} alt="licence" className="h-12 w-16 object-cover rounded" />
              ) : (
                <FileCheck className="h-8 w-8 text-gray-400" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{licenseFile.file.name}</p>
                <p className="text-xs text-gray-400">{(licenseFile.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setLicenseFile(null); }} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              <Upload className="h-6 w-6" />
              <span className="text-sm">Click to upload driving licence</span>
            </div>
          )}
        </div>
        <input ref={licenseRef} type="file" accept={ACCEPTED} onChange={(e) => handleFileChange(e, setLicenseFile)} className="hidden" />
      </div>

      {/* ID / Passport */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Passport or National ID {existingIdUrl && <span className="text-green-600 text-xs font-normal">(already uploaded)</span>}
        </label>
        <div
          onClick={() => idRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-navy-400 transition-colors"
        >
          {idFile ? (
            <div className="flex items-center gap-3">
              {idFile.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={idFile.preview} alt="id" className="h-12 w-16 object-cover rounded" />
              ) : (
                <FileCheck className="h-8 w-8 text-gray-400" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{idFile.file.name}</p>
                <p className="text-xs text-gray-400">{(idFile.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setIdFile(null); }} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              <Upload className="h-6 w-6" />
              <span className="text-sm">Click to upload passport or ID card</span>
            </div>
          )}
        </div>
        <input ref={idRef} type="file" accept={ACCEPTED} onChange={(e) => handleFileChange(e, setIdFile)} className="hidden" />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading || (!licenseFile && !idFile)}
        className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload Documents
          </>
        )}
      </button>
    </div>
  );
}
