import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { mostRecentSerrPeriod, summarizeSellers, toSerrCsv, type SerrSeller } from "@/lib/serr";

export const dynamic = "force-dynamic";

const SELLER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  mobile: true,
  abn: true,
  locationName: true,
} as const;

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Admin SERR export (Sharing Economy Reporting Regime).
 *
 * Antidosis does not hold user-to-user funds, so rows report *agreed
 * consideration* on completed exchanges: the cash amount for monetary
 * offers, $0 (offer type preserved) for barter/service/item exchanges.
 * Contract completions use the contract's completedAt; free-form exchanges
 * (acceptances with both parties marked complete, no linked contract) use
 * the acceptance's updatedAt as the completion-date proxy.
 *
 * GET /api/v1/admin/serr?from=YYYY-MM-DD&to=YYYY-MM-DD&format=json|csv
 * Defaults to the most recently completed statutory half-year period.
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const params = req.nextUrl.searchParams;
  const fallback = mostRecentSerrPeriod();
  const from = parseDateParam(params.get("from")) ?? fallback.from;
  const to = parseDateParam(params.get("to")) ?? fallback.to;
  if (from > to) {
    return NextResponse.json({ error: "from must be before to" }, { status: 400 });
  }

  const contracts = await prisma.contract.findMany({
    where: { completedAt: { gte: from, lte: to } },
    select: {
      id: true,
      acceptanceId: true,
      completedAt: true,
      kind: true,
      title: true,
      considerationType: true,
      considerationValue: true,
      need: {
        select: {
          title: true,
          offerType: true,
          offerValue: true,
          postedAs: true,
          posterBusinessName: true,
          posterAbn: true,
          poster: { select: SELLER_SELECT },
        },
      },
      partyB: { select: SELLER_SELECT },
    },
  });

  const linkedAcceptanceIds = contracts
    .map((c) => c.acceptanceId)
    .filter((id): id is string => id !== null);

  const acceptances = await prisma.acceptance.findMany({
    where: {
      posterMarkedComplete: true,
      fulfillerMarkedComplete: true,
      updatedAt: { gte: from, lte: to },
      ...(linkedAcceptanceIds.length > 0 ? { id: { notIn: linkedAcceptanceIds } } : {}),
    },
    select: {
      id: true,
      updatedAt: true,
      need: {
        select: {
          title: true,
          offerType: true,
          offerValue: true,
          postedAs: true,
          posterBusinessName: true,
          posterAbn: true,
          poster: { select: SELLER_SELECT },
        },
      },
      user: { select: SELLER_SELECT },
    },
  });

  const sellersById = new Map<string, SerrSeller>();
  // Sellers are keyed by profile + context: the same person can appear as a
  // personal fulfiller and as a business poster in the same period, and the
  // ATO rows must carry the right name/ABN for each.
  const sellerFor = (
    p: (typeof contracts)[number]["partyB"],
    context: "personal" | "business" = "personal",
    overrides?: { fullName?: string | null; abn?: string | null }
  ): SerrSeller | null => {
    if (!p) return null;
    const key = `${p.id}:${context}`;
    let seller = sellersById.get(key);
    if (!seller) {
      seller = {
        profileId: p.id,
        fullName: overrides?.fullName ?? p.fullName,
        email: p.email,
        mobile: p.mobile,
        abn: overrides?.abn ?? p.abn,
        locationName: p.locationName,
        transactions: [],
      };
      sellersById.set(key, seller);
    }
    return seller;
  };
  const cashAmount = (need: { offerType: string; offerValue: number | null }) =>
    need.offerType === "money" ? (need.offerValue ?? 0) : 0;

  for (const c of contracts) {
    const seller = sellerFor(c.partyB);
    if (seller) {
      const offerType = c.need?.offerType ?? c.considerationType ?? "direct";
      seller.transactions.push({
        source: "contract",
        id: c.id,
        completedAt: c.completedAt as Date,
        needTitle: c.need?.title ?? c.title ?? "Direct agreement",
        offerType,
        cashAmountAud: c.need
          ? cashAmount(c.need)
          : c.considerationType === "money"
            ? (c.considerationValue ?? 0)
            : 0,
      });
    }
    // Business-posted needs: the poster provided value too (unless the offer
    // was cash, which makes them the buyer). Attribute that side of the
    // exchange to the business identity snapshotted at post time.
    if (c.need?.postedAs === "business" && c.need.offerType !== "money") {
      const businessSeller = sellerFor(c.need.poster, "business", {
        fullName: c.need.posterBusinessName,
        abn: c.need.posterAbn,
      });
      businessSeller?.transactions.push({
        source: "contract",
        id: c.id,
        completedAt: c.completedAt as Date,
        needTitle: c.need.title,
        offerType: c.need.offerType,
        cashAmountAud: 0,
      });
    }
  }
  for (const a of acceptances) {
    const seller = sellerFor(a.user);
    if (seller) {
      seller.transactions.push({
        source: "acceptance",
        id: a.id,
        completedAt: a.updatedAt,
        needTitle: a.need.title,
        offerType: a.need.offerType,
        cashAmountAud: cashAmount(a.need),
      });
    }
    if (a.need.postedAs === "business" && a.need.offerType !== "money") {
      const businessSeller = sellerFor(a.need.poster, "business", {
        fullName: a.need.posterBusinessName,
        abn: a.need.posterAbn,
      });
      businessSeller?.transactions.push({
        source: "acceptance",
        id: a.id,
        completedAt: a.updatedAt,
        needTitle: a.need.title,
        offerType: a.need.offerType,
        cashAmountAud: 0,
      });
    }
  }

  const sellers = Array.from(sellersById.values());
  for (const s of sellers) {
    s.transactions.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
  }

  if (params.get("format") === "csv") {
    const csv = toSerrCsv(sellers);
    const stamp = (d: Date) => d.toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="serr-${stamp(from)}-${stamp(to)}.csv"`,
      },
    });
  }

  const summaries = summarizeSellers(sellers);
  return NextResponse.json({
    period: { from: from.toISOString(), to: to.toISOString() },
    sellers: summaries,
    totals: {
      sellers: summaries.length,
      transactions: summaries.reduce((n, s) => n + s.transactionCount, 0),
      totalCashAud: summaries.reduce((n, s) => n + s.totalCashAud, 0),
    },
    notes: [
      "Amounts are agreed consideration at completion; Antidosis does not process user-to-user payments.",
      "Free-form (contractless) exchanges use the acceptance's last-updated date as the completion-date proxy.",
      "Business-posted needs attribute the poster's side of non-cash exchanges to the business name and ABN snapshotted when the need was posted.",
    ],
  });
});
