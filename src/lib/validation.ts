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

export const flowCreateSchema = z.object({
  name: z.string().min(1).max(200),
  trigger: z.enum(["keyword", "new_contact"]),
  triggerValue: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  nodes: z.string().min(2).refine((v) => {
    try {
      const p = JSON.parse(v);
      return (
        p &&
        Array.isArray(p.nodes) &&
        typeof p.startId === "string" &&
        p.nodes.length > 0
      );
    } catch {
      return false;
    }
  }, "nodes geçerli FlowGraph JSON olmalı"),
});

export const flowUpdateSchema = flowCreateSchema.partial().extend({
  id: z.string().min(1),
});

export const quickReplyCreateSchema = z.object({
  shortcut: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Küçük harf, rakam, tire/alt çizgi"),
  content: z.string().min(1).max(4000),
  mediaUrl: z.string().url().optional().nullable(),
});

export const teamInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "AGENT", "VIEWER"]),
});

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().positive().max(3650).optional().nullable(),
});

export const outgoingWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.string().min(1).max(500),
  isActive: z.boolean().optional().default(true),
});

export const v1SendMessageSchema = z.object({
  to: z.string().min(1),
  message: z.string().min(1).max(4000),
  mediaType: z.enum(["image", "document", "video", "audio"]).optional(),
  mediaUrl: z.string().url().optional(),
});

export const v1ContactCreateSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(1).max(200),
  tags: z.string().max(500).optional(),
  language: z.string().max(10).optional(),
  source: z.string().max(100).optional(),
});

export const v1FlowTriggerSchema = z.object({
  flowId: z.string().min(1),
  contactId: z.string().min(1),
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
  aiEnabled: z.boolean().optional(),
  aiProvider: z.enum(["anthropic"]).optional(),
  aiModel: z.string().max(100).optional(),
  aiSystemPrompt: z.string().max(4000).optional().nullable(),
  aiDailyTokenLimit: z.number().int().positive().max(10_000_000).optional(),
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
