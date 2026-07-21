/**
 * SERR (Sharing Economy Reporting Regime) reporting support.
 *
 * Electronic distribution platforms must report seller transactions to the
 * ATO for each half-year period (1 Jan–30 Jun, due 31 Jul; 1 Jul–31 Dec,
 * due 31 Jan). Antidosis does not hold user-to-user funds, so the export
 * reports *agreed consideration* on completed exchanges: the cash amount
 * where the offer is monetary, and $0 (with the offer type preserved) for
 * barter/service/item exchanges. Lodge the CSV via ATO Online services for
 * business, or use it as source data for SERR-enabled software.
 */

export interface SerrTransaction {
  source: "contract" | "acceptance";
  id: string;
  completedAt: Date;
  needTitle: string;
  offerType: string;
  /** Agreed cash consideration in AUD; 0 for non-cash exchanges */
  cashAmountAud: number;
}

export interface SerrSeller {
  profileId: string;
  fullName: string | null;
  email: string;
  mobile: string | null;
  abn: string | null;
  locationName: string | null;
  transactions: SerrTransaction[];
}

export interface SerrSellerSummary {
  profileId: string;
  fullName: string | null;
  email: string;
  mobile: string | null;
  abn: string | null;
  locationName: string | null;
  transactionCount: number;
  cashTransactionCount: number;
  totalCashAud: number;
}

export interface SerrPeriod {
  label: string;
  from: Date;
  to: Date;
}

/**
 * The two statutory SERR reporting periods for a given calendar year.
 * H1: 1 Jan – 30 Jun (due 31 Jul). H2: 1 Jul – 31 Dec (due 31 Jan).
 */
export function serrPeriodsForYear(year: number): SerrPeriod[] {
  return [
    {
      label: `${year} H1 (Jan–Jun)`,
      from: new Date(Date.UTC(year, 0, 1)),
      to: new Date(Date.UTC(year, 5, 30, 23, 59, 59, 999)),
    },
    {
      label: `${year} H2 (Jul–Dec)`,
      from: new Date(Date.UTC(year, 6, 1)),
      to: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
    },
  ];
}

/** The most recently completed statutory half-year period. */
export function mostRecentSerrPeriod(now: Date = new Date()): SerrPeriod {
  const year = now.getUTCFullYear();
  const mid = new Date(Date.UTC(year, 6, 1));
  if (now >= mid) {
    return serrPeriodsForYear(year)[0];
  }
  return serrPeriodsForYear(year - 1)[1];
}

export function summarizeSellers(sellers: SerrSeller[]): SerrSellerSummary[] {
  return sellers
    .map((s) => ({
      profileId: s.profileId,
      fullName: s.fullName,
      email: s.email,
      mobile: s.mobile,
      abn: s.abn,
      locationName: s.locationName,
      transactionCount: s.transactions.length,
      cashTransactionCount: s.transactions.filter((t) => t.cashAmountAud > 0).length,
      totalCashAud: round2(s.transactions.reduce((sum, t) => sum + t.cashAmountAud, 0)),
    }))
    .sort((a, b) => b.totalCashAud - a.totalCashAud);
}

const CSV_HEADER = [
  "Payee ABN",
  "Payee Name",
  "Payee Email",
  "Payee Phone",
  "Payee Location",
  "Transaction ID",
  "Source",
  "Completion Date",
  "Need Title",
  "Consideration Type",
  "Gross Consideration (AUD)",
  "Currency",
] as const;

/** Flatten seller detail into CSV rows (one row per transaction). */
export function toSerrCsv(sellers: SerrSeller[]): string {
  const rows: string[] = [CSV_HEADER.join(",")];
  for (const seller of sellers) {
    for (const t of seller.transactions) {
      rows.push(
        [
          csvCell(seller.abn),
          csvCell(seller.fullName),
          csvCell(seller.email),
          csvCell(seller.mobile),
          csvCell(seller.locationName),
          csvCell(t.id),
          csvCell(t.source),
          csvCell(t.completedAt.toISOString().slice(0, 10)),
          csvCell(t.needTitle),
          csvCell(t.offerType),
          t.cashAmountAud.toFixed(2),
          "AUD",
        ].join(",")
      );
    }
  }
  return rows.join("\r\n") + "\r\n";
}

function csvCell(value: string | null | undefined): string {
  const v = value ?? "";
  if (/[",\r\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
