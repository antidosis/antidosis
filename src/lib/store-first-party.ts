/**
 * First-party mesh store config: Antidosis-stocked listings the platform
 * itself sells (seed batches). Payment is manual during the pilot — PayID or
 * bank transfer quoting the order reference; details come from env so no
 * account numbers live in the repo.
 */

export const FIRST_PARTY_SELLER_NAME = "Antidosis";
export const FIRST_PARTY_ENTITY = "Martin Khoury trading as antidosis (ABN 96 557 008 393)";

export type MeshPaymentInstructions = {
  payId: string | null;
  bsb: string | null;
  accountNumber: string | null;
  accountName: string | null;
  /** Always the order ref — the buyer quotes it so payment can be matched. */
  reference: string;
  /** True when no account details are configured and they'll be sent manually. */
  sentManually: boolean;
};

export function getMeshPaymentInstructions(reference: string): MeshPaymentInstructions {
  const payId = process.env.MESH_STORE_PAYID?.trim() || null;
  const bsb = process.env.MESH_STORE_BANK_BSB?.trim() || null;
  const accountNumber = process.env.MESH_STORE_BANK_ACCOUNT?.trim() || null;
  const accountName = process.env.MESH_STORE_BANK_NAME?.trim() || null;
  return {
    payId,
    bsb,
    accountNumber,
    accountName,
    reference,
    sentManually: !payId && !(bsb && accountNumber),
  };
}

export const MESH_ORDER_STATUS_LABEL: Record<string, string> = {
  placed: "order placed",
  paid: "payment received",
  preparing: "being flashed & tested",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};
