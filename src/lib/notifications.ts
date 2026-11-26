import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  type,
  title,
  body,
  data,
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: (data ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
