import { describe, it, expect } from "vitest";

import { createReviewSchema } from "./reviews";

describe("createReviewSchema", () => {
  it("accepts valid review with contractId", () => {
    const result = createReviewSchema.safeParse({
      contractId: "550e8400-e29b-41d4-a716-446655440000",
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 8,
      comment: "Great work!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid review with acceptanceId", () => {
    const result = createReviewSchema.safeParse({
      acceptanceId: "550e8400-e29b-41d4-a716-446655440000",
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 10,
    });
    expect(result.success).toBe(true);
  });

  it("requires receiverId", () => {
    const result = createReviewSchema.safeParse({
      rating: 5,
    });
    expect(result.success).toBe(false);
  });

  it("requires rating", () => {
    const result = createReviewSchema.safeParse({
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating below 1", () => {
    const result = createReviewSchema.safeParse({
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 10", () => {
    const result = createReviewSchema.safeParse({
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 11,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    const result = createReviewSchema.safeParse({
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 7.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects comment over 2000 chars", () => {
    const result = createReviewSchema.safeParse({
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 5,
      comment: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects privateFeedback over 2000 chars", () => {
    const result = createReviewSchema.safeParse({
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 5,
      privateFeedback: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid contractId", () => {
    const result = createReviewSchema.safeParse({
      contractId: "not-a-uuid",
      receiverId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts rating at boundaries", () => {
    expect(
      createReviewSchema.safeParse({
        receiverId: "550e8400-e29b-41d4-a716-446655440001",
        rating: 1,
      }).success
    ).toBe(true);
    expect(
      createReviewSchema.safeParse({
        receiverId: "550e8400-e29b-41d4-a716-446655440001",
        rating: 10,
      }).success
    ).toBe(true);
  });
});
