import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("E-mail inválido.").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres.").max(72),
  full_name: z.string().trim().max(120).optional().default(""),
  role: z.enum(["user", "admin"]).default("user"),
});

export const settingsSchema = z.object({
  default_min_alert: z.coerce.number().int().min(0).optional(),
  email_enabled: z.boolean().optional(),
  alert_from: z.string().trim().max(200).nullable().optional(),
  alert_emails: z.array(z.string().trim()).optional(),
  resend_api_key: z.string().trim().max(200).optional(),
});

export const limitSchema = z.object({
  sku: z.string().trim().min(1, "SKU obrigatório."),
  min_alert: z
    .union([z.coerce.number().int().min(0), z.null(), z.literal("")])
    .transform((v) => (v === "" || v === null ? null : Number(v))),
});

export const positionSchema = z.object({
  sku: z.string().trim().min(1, "SKU obrigatório."),
  location: z.string().trim().min(1, "Local obrigatório."),
  description: z.string().trim().max(300).nullable().optional(),
  quantity: z.coerce.number().int().min(0).default(0),
  min_alert: z
    .union([z.coerce.number().int().min(0), z.null(), z.literal("")])
    .transform((v) => (v === "" || v === null ? null : Number(v)))
    .optional(),
});

export const positionUpdateSchema = positionSchema.partial().extend({
  id: z.string().uuid("ID inválido."),
});

// Helper: valida e retorna {data} ou {error} formatado.
type ParseOk<T> = { ok: true; data: T; error: null };
type ParseErr = { ok: false; data: null; error: string };

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): ParseOk<T> | ParseErr {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, data: null, error: first?.message ?? "Dados inválidos." };
  }
  return { ok: true, data: result.data, error: null };
}
