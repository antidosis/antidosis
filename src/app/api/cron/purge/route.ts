import { type NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Data-retention purge — schedule daily (see vercel.json crons).
// Matches the retention commitments in the Privacy Policy:
//   audit logs 12 months; expired OTP codes; read notifications 90 days;
//   soft-deleted relay/DM messages 30 days.
export const GET = withApiHandler(async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed — an unprotected purge endpoint is worse than none.
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [otpCodes, auditLogs, notifications, terminalMessages, directMessages] =
    await prisma.$transaction([
      prisma.mobileVerificationCode.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      prisma.auditLog.deleteMany({
        where: { createdAt: { lt: twelveMonthsAgo } },
      }),
      prisma.notification.deleteMany({
        where: { isRead: true, createdAt: { lt: ninetyDaysAgo } },
      }),
      prisma.terminalMessage.deleteMany({
        where: { deletedAt: { not: null, lt: thirtyDaysAgo } },
      }),
      prisma.directMessage.deleteMany({
        where: { deletedAt: { not: null, lt: thirtyDaysAgo } },
      }),
    ]);

  return NextResponse.json({
    success: true,
    deleted: {
      otpCodes: otpCodes.count,
      auditLogs: auditLogs.count,
      notifications: notifications.count,
      terminalMessages: terminalMessages.count,
      directMessages: directMessages.count,
    },
  });
});
