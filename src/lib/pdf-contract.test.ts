import { describe, expect, it } from "vitest";

import {
  BUSINESS_PAYMENT_NOTICE,
  formatPartyIdentityLine,
  generateContractPdf,
  isBusinessContract,
  isBusinessParty,
  type ContractPartyPdfData,
} from "./pdf-contract";

const individual: ContractPartyPdfData = {
  fullName: "Maya Richardson",
  email: "maya@example.com",
  locationName: "Erina",
  isVerified: true,
};

const business: ContractPartyPdfData = {
  fullName: "Acme Plumbing Pty Ltd",
  email: "jobs@acmeplumbing.example.com",
  locationName: "Gosford",
  isVerified: true,
  accountType: "business",
  abn: "51824753556",
  abnVerified: true,
};

const unverifiedBusiness: ContractPartyPdfData = {
  ...business,
  abnVerified: false,
};

describe("isBusinessParty / isBusinessContract", () => {
  it("treats missing accountType as an individual", () => {
    expect(isBusinessParty(individual)).toBe(false);
    expect(isBusinessParty({ ...individual, accountType: "individual" })).toBe(false);
  });

  it("recognises business accounts", () => {
    expect(isBusinessParty(business)).toBe(true);
  });

  it("a contract is a business contract when either party is a business", () => {
    expect(isBusinessContract({ partyA: individual, partyB: individual })).toBe(false);
    expect(isBusinessContract({ partyA: business, partyB: individual })).toBe(true);
    expect(isBusinessContract({ partyA: individual, partyB: business })).toBe(true);
  });
});

describe("formatPartyIdentityLine", () => {
  it("renders individuals with name, email, and verified flag", () => {
    expect(formatPartyIdentityLine(individual)).toBe(
      "Name: Maya Richardson  |  Email: maya@example.com  |  (verified)"
    );
  });

  it("renders businesses with legal name and verified ABN", () => {
    expect(formatPartyIdentityLine(business)).toBe(
      "Business: Acme Plumbing Pty Ltd  |  ABN (verified): 51824753556  |  Email: jobs@acmeplumbing.example.com  |  (verified)"
    );
  });

  it("labels an unverified ABN honestly", () => {
    expect(formatPartyIdentityLine(unverifiedBusiness)).toContain("ABN (unverified)");
  });

  it("omits the ABN segment for a business without one on file", () => {
    const line = formatPartyIdentityLine({ ...business, abn: null });
    expect(line).toContain("Business: Acme Plumbing Pty Ltd");
    expect(line).not.toContain("ABN");
  });

  it("falls back to N/A for a missing name", () => {
    expect(formatPartyIdentityLine({ ...individual, fullName: null })).toContain("Name: N/A");
  });
});

describe("BUSINESS_PAYMENT_NOTICE", () => {
  it("states that antidosis does not hold or transfer funds", () => {
    expect(BUSINESS_PAYMENT_NOTICE).toContain("directly between themselves");
    expect(BUSINESS_PAYMENT_NOTICE).toContain("does not hold, transfer, or guarantee funds");
  });
});

describe("generateContractPdf", () => {
  function baseData() {
    return {
      contractId: "abc12345-0000-0000-0000-000000000000",
      generatedAt: "2026-11-23T00:00:00.000Z",
      needTitle: "Fence post replacement",
      needDescription: "Replace three fence posts along the driveway.",
      needDeadline: null,
      needTimeRange: null,
      needLocation: null,
      offerType: "service",
      offerDescription: "Garden help in exchange",
      offerValue: null,
      terms: {
        startDate: null,
        deadline: null,
        timeRange: null,
        workLocation: null,
        reciprocationLocation: null,
        customTerms: null,
        notes: null,
      },
      partyATerms: null,
      partyBTerms: null,
      deadlineTerms: null,
      completionMethodTerms: null,
      additionalTerms: null,
      partyAUseMessageTerms: false,
      partyBUseMessageTerms: false,
      negotiationMessages: [],
      partyASignedAt: null,
      partyBSignedAt: null,
      partyASignature: null,
      partyBSignature: null,
    };
  }

  it("produces a non-empty PDF for a person-to-person contract", async () => {
    const bytes = await generateContractPdf({
      ...baseData(),
      partyA: individual,
      partyB: { ...individual, fullName: "Dave Kowalski", email: "dave@example.com" },
    });
    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(bytes[0]).toBe(0x25); // "%" — PDF magic
  });

  it("produces a non-empty PDF when a business is a party", async () => {
    const bytes = await generateContractPdf({
      ...baseData(),
      partyA: business,
      partyB: individual,
    });
    expect(bytes.byteLength).toBeGreaterThan(500);
  });
});
