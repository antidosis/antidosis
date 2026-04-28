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
  data?: Record<string, any>;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data || {},
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
