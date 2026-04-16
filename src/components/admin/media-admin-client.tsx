// src/components/admin/media-admin-client.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Copy, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import type { MediaFile } from "@prisma/client";
import { formatFileSize } from "@/lib/utils";

export function MediaAdminClient({ files: init }: { files: MediaFile[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState(init);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    Array.from(selected).forEach(f => formData.append("files", f));

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }
      setFiles(prev => [...data.files, ...prev]);
      router.refresh();
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
        const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFiles(files.filter(f => f.id !== id));
    } else {
      alert("Failed to delete file");
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Media Library</h1>
          <p className="text-gray-500 text-sm mt-1">{files.length} files uploaded</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-primary text-sm px-4 py-2.5"
          >
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload Images</>}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{uploadError}</div>
      )}

      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-navy-300 hover:bg-gray-50 transition-colors"
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600">Drop files here or click to browse</p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 5MB each</p>
      </div>

      {/* Files grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {files.map(file => (
            <div key={file.id} className="group relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {file.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={file.alt ?? file.filename} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-gray-700 truncate">{file.filename}</p>
                <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              {/* Hover actions */}
              <div className="absolute inset-0 bg-navy-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(file.url, file.id)}
                  className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  title="Copy URL"
                >
                  {copiedId === file.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-navy-900" />}
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No media files yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload images for cars, banners, and content.</p>
        </div>
      )}
    </div>
  );
}
