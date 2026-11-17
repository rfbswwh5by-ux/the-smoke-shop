// Server-only replacements for Base44's Core integrations.

function env(name) {
  return globalThis.process?.env?.[name] || "";
}

// Optional: Resend (https://resend.com). Without RESEND_API_KEY this throws,
// and the caller records the reply without emailing it.
export async function sendEmail({ to, from_name, subject, html, text }) {
  const key = env("RESEND_API_KEY");
  if (!key) {
    const error = new Error("Email is not configured (RESEND_API_KEY is not set).");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }
  const fromAddress = env("EMAIL_FROM") || "onboarding@resend.dev";
  const from = from_name && !fromAddress.includes("<") ? `${String(from_name).replace(/[<>"]/g, "")} <${fromAddress}>` : fromAddress;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const error = new Error(`Email send failed (${res.status}): ${await res.text().catch(() => "")}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Vercel Blob (BLOB_READ_WRITE_TOKEN is set when a Blob store is connected).
export async function uploadPublicFile({ file }) {
  if (!env("BLOB_READ_WRITE_TOKEN")) {
    const error = new Error("Image uploads are not configured (BLOB_READ_WRITE_TOKEN is not set).");
    error.code = "UPLOADS_NOT_CONFIGURED";
    throw error;
  }
  const { put } = await import("@vercel/blob");
  const name = String(file?.name || "upload").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80) || "upload";
  const blob = await put(`uploads/${name}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file?.type || undefined,
  });
  return { file_url: blob.url };
}
