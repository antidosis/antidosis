import { z } from "zod";

import { uuidSchema } from "./common";

export const reportTargetTypes = ["need", "profile", "message"] as const;
export const reportReasons = ["scam", "abuse", "spam", "safety", "other"] as const;

export const createReportSchema = z.object({
  targetType: z.enum(reportTargetTypes),
  targetId: uuidSchema,
  reason: z.enum(reportReasons),
  details: z.string().max(2000).optional(),
});

export const updateReportSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
