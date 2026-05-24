import { z } from "zod";

import { uuidSchema } from "./common";

export const createReviewSchema = z.object({
  contractId: uuidSchema.optional(),
  acceptanceId: uuidSchema.optional(),
  receiverId: uuidSchema,
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(2000).optional(),
  privateFeedback: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
