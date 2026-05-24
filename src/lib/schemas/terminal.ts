import { z } from "zod";

import { attachmentSchema, uuidSchema } from "./common";

export const sendTerminalMessageSchema = z.object({
  channelId: uuidSchema,
  content: z.string().min(1).max(2000),
  attachments: z.array(attachmentSchema).optional(),
});

export type SendTerminalMessageInput = z.infer<typeof sendTerminalMessageSchema>;

export const terminalReactionSchema = z.object({
  messageId: uuidSchema,
  emoji: z.string().min(1).max(10),
});

export type TerminalReactionInput = z.infer<typeof terminalReactionSchema>;

export const sendDirectMessageSchema = z.object({
  userId: uuidSchema,
  content: z.string().min(1).max(2000),
  attachments: z.array(attachmentSchema).optional(),
});

export type SendDirectMessageInput = z.infer<typeof sendDirectMessageSchema>;

export const dmReactionSchema = z.object({
  messageId: uuidSchema,
  emoji: z.string().min(1).max(10),
});

export type DmReactionInput = z.infer<typeof dmReactionSchema>;
