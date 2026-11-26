import { describe, expect, it } from "vitest";

import { deliverySummary, formatPostage, paymentTermLabel, postageLine } from "./store-delivery";

const BASE = {
  offerPostage: false,
  postageAudCents: null,
  localPickup: false,
  paymentTerms: ["bank_transfer"],
};

describe("formatPostage", () => {
  it("formats flat rates, free postage and chat-arranged postage", () => {
    expect(formatPostage(1200)).toBe("AU$12");
    expect(formatPostage(1250)).toBe("AU$12.50");
    expect(formatPostage(0)).toBe("free");
    expect(formatPostage(null)).toBe("worked out in chat");
  });
});

describe("deliverySummary", () => {
  it("combines postage and pickup with the suburb", () => {
    expect(
      deliverySummary(
        { ...BASE, offerPostage: true, postageAudCents: 1200, localPickup: true },
        "Noraville"
      )
    ).toBe("Postage AU$12 · Pickup Noraville");
  });

  it("shows free postage", () => {
    expect(deliverySummary({ ...BASE, offerPostage: true, postageAudCents: 0 })).toBe(
      "Free postage"
    );
  });

  it("shows chat-arranged postage when no flat rate is set", () => {
    expect(deliverySummary({ ...BASE, offerPostage: true })).toBe("Postage worked out in chat");
  });

  it("shows pickup only without a suburb", () => {
    expect(deliverySummary({ ...BASE, localPickup: true })).toBe("Local pickup");
  });

  it("never returns an empty summary", () => {
    expect(deliverySummary(BASE)).toBe("Delivery arranged in chat");
  });
});

describe("postageLine", () => {
  it("is null when postage is not offered", () => {
    expect(postageLine(BASE)).toBeNull();
  });

  it("describes each postage mode", () => {
    expect(postageLine({ ...BASE, offerPostage: true, postageAudCents: 0 })).toBe(
      "Free postage, Australia-wide"
    );
    expect(postageLine({ ...BASE, offerPostage: true, postageAudCents: 900 })).toBe(
      "Flat postage AU$9 Australia-wide"
    );
    expect(postageLine({ ...BASE, offerPostage: true })).toBe(
      "Postage worked out with you in chat before you pay"
    );
  });
});

describe("paymentTermLabel", () => {
  it("labels known terms and passes unknown ones through", () => {
    expect(paymentTermLabel("payid")).toBe("PayID");
    expect(paymentTermLabel("cash_on_pickup")).toBe("Cash on pickup");
    expect(paymentTermLabel("mystery")).toBe("mystery");
  });
});
