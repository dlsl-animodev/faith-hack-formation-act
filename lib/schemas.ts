import { z } from "zod";

export const createEventBodySchema = z.object({}).optional();

export const joinSessionBodySchema = z.object({
  eventCode: z.string().min(4),
  displayName: z.string().max(120).optional(),
});

export const submitGroupBodySchema = z.object({
  sessionId: z.string().uuid(),
  summary: z.string().min(1).max(8000),
});

export const bugsBodySchema = z.object({
  sessionId: z.string().uuid(),
  bugs: z
    .array(
      z.object({
        label: z.string().min(1).max(500),
        is_custom: z.boolean(),
      })
    )
    .min(1)
    .max(5),
});

export const adminLoginBodySchema = z.object({
  secret: z.string().min(1),
});

export const adminPhaseBodySchema = z.object({
  action: z.enum(["advance", "endSharing"]),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
