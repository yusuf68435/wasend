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

export const autoReplyCreateSchema = z.object({
  trigger: z.string().min(1).max(200),
  response: z.string().min(1).max(4000),
  isActive: z.boolean().optional().default(true),
});

export const autoReplyUpdateSchema = z.object({
  id: z.string(),
  trigger: z.string().min(1).max(200).optional(),
  response: z.string().min(1).max(4000).optional(),
  isActive: z.boolean().optional(),
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
  scheduledAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Geçerli tarih değil")
    .optional()
    .nullable(),
  rateLimit: z.number().int().positive().max(1000).optional(),
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
