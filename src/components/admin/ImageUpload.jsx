import { useState } from "react";
import { uploadImage } from "@/lib/server-fns";
import { Loader2, Upload, X } from "lucide-react";

const MAX_EDGE = 2400;

// Large photos are scaled down in the browser before upload (server uploads
// are limited to ~4 MB on Vercel). GIFs and SVGs are sent as they are.
async function shrinkImage(file) {
  if (/image\/(gif|svg)/.test(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
      bitmap.close?.();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const type = file.type === "image/png" ? "image/png" : "image/webp";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.86));
    if (!blob || blob.size >= file.size) return file;
    const base = (file.name || "image").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.${type === "image/png" ? "png" : "webp"}`, { type });
  } catch {
    return file;
  }
}

export default function ImageUpload({ label, value, onChange, hint, aspect = "aspect-[16/10]", compact = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setError("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("Choose an image under 25 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const prepared = await shrinkImage(file);
      if (prepared.size > 4 * 1024 * 1024) throw new Error("Choose an image under 4 MB.");
      const form = new FormData();
      form.append("file", prepared);
      form.append("token", window.sessionStorage.getItem("cn_admin_token") || "");
      const res = await uploadImage({ data: form });
      if (!res?.ok) throw new Error(res?.error || "That upload didn't go through.");
      onChange(res.file_url);
    } catch (err) {
      setError(err?.message || "That upload didn't go through. Try a JPG or PNG under 4 MB.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase" style={{ letterSpacing: "0.16em", color: "var(--brand-muted)" }}>
          {label}
        </span>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 text-[10px] uppercase hover:opacity-70"
            style={{ letterSpacing: "0.1em", color: "var(--brand-muted)" }}
          >
            <X size={11} /> Remove
          </button>
        ) : null}
      </div>

      <label
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden ${compact ? "aspect-[3/1]" : aspect}`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--brand-ink) 4%, transparent)",
          border: "1px dashed color-mix(in srgb, var(--brand-ink) 18%, transparent)",
          borderRadius: "var(--brand-radius)",
        }}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-[11px]" style={{ color: "var(--brand-muted)" }}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} strokeWidth={1.5} />}
            {busy ? "Uploading" : "Upload image"}
          </span>
        )}
        {value && busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
          </span>
        ) : null}
        <input type="file" accept="image/*" onChange={pick} className="absolute inset-0 cursor-pointer opacity-0" disabled={busy} />
      </label>

      {hint ? (
        <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: "var(--brand-muted)" }}>
          {hint}
        </p>
      ) : null}
      {error ? <p className="mt-1.5 text-[11px]" style={{ color: "#fda4af" }}>{error}</p> : null}
    </div>
  );
}