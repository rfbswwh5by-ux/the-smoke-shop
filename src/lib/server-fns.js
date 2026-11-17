import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  adminAction,
  adminUpload,
  getPublicCatalog,
  getPublicFaqs,
  getPublicSettings,
  recoverCredential,
  submitContact,
} from "@/lib/store.server";

// Public reads never break the page: without a database (or during an outage)
// the site falls back to its built-in defaults.
export const getSiteSettings = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  return getPublicSettings(context.getBase44()).catch((error) => {
    console.error("getSiteSettings failed:", error?.message || error);
    return null;
  });
});

export const getCatalog = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  return getPublicCatalog(context.getBase44()).catch((error) => {
    console.error("getCatalog failed:", error?.message || error);
    return { products: [], categories: [] };
  });
});

export const getFaqs = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  return getPublicFaqs(context.getBase44()).catch((error) => {
    console.error("getFaqs failed:", error?.message || error);
    return [];
  });
});

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().max(160).optional().default(""),
  phone: z.string().max(60).optional().default(""),
  message: z.string().min(5).max(4000),
  website: z.string().max(200).optional().default(""),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator(contactSchema)
  .handler(async ({ data, context }) => {
    if (data.website) return { ok: true };
    return submitContact(context.getBase44(), data);
  });

const adminSchema = z.object({
  action: z.string().min(1).max(64),
  token: z.string().max(200).optional().nullable(),
  payload: z.record(z.string(), z.any()).optional().nullable(),
});

export const adminApi = createServerFn({ method: "POST" })
  .validator(adminSchema)
  .handler(async ({ data, context }) => {
    return adminAction(context.getBase44(), {
      action: data.action,
      token: data.token || null,
      payload: data.payload || {},
    });
  });

// Image upload for the dashboard: multipart form with `file` and the admin
// session `token`. Stored in Vercel Blob; returns { ok, file_url }.
export const uploadImage = createServerFn({ method: "POST" })
  .validator((data) => {
    if (!(data instanceof FormData)) throw new Error("Expected form data.");
    const file = data.get("file");
    const token = data.get("token");
    if (!file || typeof file === "string") throw new Error("No file was sent.");
    return { file, token: typeof token === "string" ? token : "" };
  })
  .handler(async ({ data, context }) => {
    return adminUpload(context.getBase44(), data);
  });

// Lost owner code: whoever knows the ADMIN_SETUP_KEY (set in the Vercel
// project's environment variables) can set a new owner code.
export const recoverAdminCode = createServerFn({ method: "POST" })
  .validator(z.object({ code: z.string().min(8).max(128), setupKey: z.string().max(400).optional().default("") }))
  .handler(async ({ data, context }) => {
    return recoverCredential(context.getBase44(), data.code, data.setupKey);
  });
