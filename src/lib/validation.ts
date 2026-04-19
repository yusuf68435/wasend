import { z } from "zod";

const phoneRegex = /^\+?\d{7,20}$/;

export const normalizePhone = (v: string) =>
  v.replace(/\s|-|\(|\)/g, "").trim();

export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine((v) => phoneRegex.test(v), {
    message: "Geçerli bir telefon numarası girin",
  });

export const contactCreateSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(1, "İsim zorunlu").max(200),
  tags: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const contactUpdateSchema = contactCreateSchema.partial();

const matchTypeSchema = z.enum(["contains", "exact", "regex"]);

export const autoReplyCreateSchema = z.object({
  trigger: z.string().min(1).max(200),
  response: z.string().min(1).max(4000),
  isActive: z.boolean().optional().default(true),
  matchType: matchTypeSchema.optional().default("contains"),
  assignTags: z.string().max(500).optional().nullable(),
  priority: z.number().int().min(0).max(1000).optional().default(0),
});

export const autoReplyUpdateSchema = z.object({
  id: z.string(),
  trigger: z.string().min(1).max(200).optional(),
  response: z.string().min(1).max(4000).optional(),
  isActive: z.boolean().optional(),
  matchType: matchTypeSchema.optional(),
  assignTags: z.string().max(500).optional().nullable(),
  priority: z.number().int().min(0).max(1000).optional(),
});

export const reminderCreateSchema = z.object({
  contactId: z.string().min(1),
  message: z.string().min(1).max(4000),
  scheduledAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Geçerli tarih değil"),
});

export const broadcastCreateSchema = z.object({
  name: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
  targetTags: z.string().max(500).optional().nullable(),
  segmentId: z.string().optional().nullable(),
  mediaType: z.enum(["image", "document", "video", "audio"]).optional().nullable(),
  mediaUrl: z.string().url().optional().nullable(),
  scheduledAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Geçerli tarih değil")
    .optional()
    .nullable(),
  rateLimit: z.number().int().positive().max(1000).optional(),
});

export const templateCreateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Sadece küçük harf, rakam, alt çizgi"),
  language: z.string().min(2).max(10).default("tr"),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]).default("UTILITY"),
  bodyText: z.string().min(1).max(1024),
  variables: z.string().max(500).optional().nullable(),
});

export const segmentCreateSchema = z.object({
  name: z.string().min(1).max(200),
  rules: z.string().min(1).refine((v) => {
    try {
      const p = JSON.parse(v);
      return (
        p &&
        typeof p === "object" &&
        (p.mode === "and" || p.mode === "or") &&
        Array.isArray(p.rules)
      );
    } catch {
      return false;
    }
  }, "rules geçerli JSON olmalı ({mode, rules[]})"),
});

export const contactImportRowSchema = z.object({
  name: z.string().min(1).max(200),
  phone: phoneSchema,
  tags: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  language: z.string().max(10).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
});

export const sendMessageSchema = z.object({
  contactId: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(1).max(4000),
}).refine((d) => !!d.contactId || !!d.phone, {
  message: "contactId veya phone zorunlu",
});

const hhmm = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, "HH:mm formatı (örn. 09:00)");

export const settingsUpdateSchema = z.object({
  businessName: z.string().max(200).optional().nullable(),
  businessType: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  timezone: z.string().max(64).optional(),
  businessHoursStart: hhmm.optional().nullable(),
  businessHoursEnd: hhmm.optional().nullable(),
  workDays: z
    .string()
    .regex(/^(\d(,\d)*)?$/, "Sayılar virgülle ayrılmalı")
    .optional()
    .nullable(),
  offHoursReply: z.string().max(1000).optional().nullable(),
});

export type ZodIssueLike = { path: (string | number)[]; message: string };

export function formatZodError(err: z.ZodError): {
  error: string;
  issues: ZodIssueLike[];
} {
  return {
    error: "Doğrulama hatası",
    issues: err.issues.map((i) => ({
      path: i.path as (string | number)[],
      message: i.message,
    })),
  };
}
