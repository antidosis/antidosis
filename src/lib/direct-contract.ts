export const DIRECT_AGREEMENT_NOTICE =
  "Created directly between the parties without an Exchange listing. Antidosis provides the agreement record and messaging tools, but is not a party to the agreement and does not process or guarantee payment.";

export const DIRECT_AGREEMENT_PREAMBLE =
  "This direct agreement was created between the parties without a marketplace need or listing. It records the scope and terms they have chosen to exchange. Antidosis is a records and communication platform only — it is not a party to this agreement and does not hold, transfer, or guarantee any payment, goods, or services. Where a party supplies goods or services in trade or commerce, applicable Australian Consumer Law obligations continue to apply.";

export function contractTitle(contract: {
  kind: string;
  title?: string | null;
  need?: { title: string } | null;
}): string {
  return contract.kind === "direct"
    ? contract.title || "Direct agreement"
    : contract.need?.title || contract.title || "Exchange agreement";
}
