import { describe, it, expect, vi, beforeEach } from "vitest";

import { createContractFromAcceptance } from "./contract-formation";

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockDeleteMany = vi.fn();

const mockTx = {
  acceptance: { findUnique: mockFindUnique, update: mockUpdate },
  contract: { findUnique: mockFindUnique, create: mockCreate, delete: mockDelete },
  need: { findUnique: mockFindUnique },
  needMessage: { findMany: mockFindMany },
  review: { deleteMany: mockDeleteMany },
  message: { deleteMany: mockDeleteMany },
};

const mockTransaction = vi.fn((cb) => cb(mockTx));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (cb: any) => mockTransaction(cb),
  },
}));

vi.mock("@/lib/email", () => ({
  sendContractFormedEmail: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

const mockAcceptance = {
  id: "accept-1",
  status: "accepted",
  userId: "user-b",
  needId: "need-1",
  need: {
    id: "need-1",
    posterId: "poster-1",
    title: "Need plumber",
    description: "Fix sink",
    deadline: new Date("2026-06-01"),
    timeRange: "Morning",
    locationName: "Terrigal",
  },
};

const mockNeedMessages = [
  {
    id: "msg-1",
    content: "I can help",
    createdAt: new Date("2026-05-01"),
    sender: { fullName: "John" },
  },
];

describe("createContractFromAcceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockReset();
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockDeleteMany.mockReset();
    mockFindMany.mockReset();
    mockTransaction.mockReset();
    mockTransaction.mockImplementation((cb) => cb(mockTx));
  });

  it("creates contract from accepted acceptance", async () => {
    mockFindUnique
      .mockResolvedValueOnce(mockAcceptance)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockAcceptance.need);
    mockFindMany.mockResolvedValueOnce(mockNeedMessages);
    mockCreate.mockResolvedValueOnce({ id: "contract-1" });
    mockUpdate.mockResolvedValueOnce({});

    const result = await createContractFromAcceptance("accept-1", "poster-1");

    expect(result.id).toBe("contract-1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.data.needId).toBe("need-1");
    expect(createCall.data.partyAId).toBe("poster-1");
    expect(createCall.data.partyBId).toBe("user-b");
    expect(createCall.data.status).toBe("draft");
    expect(createCall.data.terms).toContain("deadline");
  });

  it("throws when acceptance not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    await expect(createContractFromAcceptance("bad-id", "poster-1")).rejects.toThrow(
      "Acceptance not found"
    );
  });

  it("throws when acceptance is not accepted", async () => {
    mockFindUnique.mockResolvedValueOnce({
      ...mockAcceptance,
      status: "pending",
    });

    await expect(createContractFromAcceptance("accept-1", "poster-1")).rejects.toThrow(
      "Acceptance must be accepted"
    );
  });

  it("throws when user is not the poster", async () => {
    mockFindUnique.mockResolvedValueOnce(mockAcceptance);

    await expect(createContractFromAcceptance("accept-1", "wrong-poster")).rejects.toThrow(
      "Only the need poster can form a contract"
    );
  });

  it("throws when a non-cancelled contract already exists", async () => {
    mockFindUnique
      .mockResolvedValueOnce(mockAcceptance)
      .mockResolvedValueOnce({ id: "existing", status: "draft" });

    await expect(createContractFromAcceptance("accept-1", "poster-1")).rejects.toThrow(
      "A contract already exists"
    );
  });

  it("deletes existing cancelled contract before creating new one", async () => {
    mockFindUnique
      .mockResolvedValueOnce(mockAcceptance)
      .mockResolvedValueOnce({ id: "old-contract", status: "cancelled" })
      .mockResolvedValueOnce(mockAcceptance.need);
    mockFindMany.mockResolvedValueOnce([]);
    mockCreate.mockResolvedValueOnce({ id: "new-contract" });
    mockUpdate.mockResolvedValueOnce({});

    const result = await createContractFromAcceptance("accept-1", "poster-1");

    expect(result.id).toBe("new-contract");
    expect(mockDeleteMany).toHaveBeenCalledTimes(2);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "old-contract" } });
  });

  it("archives need messages in contract", async () => {
    mockFindUnique
      .mockResolvedValueOnce(mockAcceptance)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockAcceptance.need);
    mockFindMany.mockResolvedValueOnce(mockNeedMessages);
    mockCreate.mockResolvedValueOnce({ id: "contract-1" });
    mockUpdate.mockResolvedValueOnce({});

    await createContractFromAcceptance("accept-1", "poster-1");

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.data.negotiationMessages).toHaveLength(1);
    expect(createCall.data.negotiationMessages[0]).toMatchObject({
      senderName: "John",
      content: "I can help",
    });
  });

  it("updates acceptance status to selected", async () => {
    mockFindUnique
      .mockResolvedValueOnce(mockAcceptance)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockAcceptance.need);
    mockFindMany.mockResolvedValueOnce([]);
    mockCreate.mockResolvedValueOnce({ id: "contract-1" });
    mockUpdate.mockResolvedValueOnce({});

    await createContractFromAcceptance("accept-1", "poster-1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "accept-1" },
      data: { status: "selected" },
    });
  });

  it("includes need details in partyA terms", async () => {
    mockFindUnique
      .mockResolvedValueOnce(mockAcceptance)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockAcceptance.need);
    mockFindMany.mockResolvedValueOnce([]);
    mockCreate.mockResolvedValueOnce({ id: "contract-1" });
    mockUpdate.mockResolvedValueOnce({});

    await createContractFromAcceptance("accept-1", "poster-1");

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.data.partyATerms).toContain("Need: Need plumber");
    expect(createCall.data.partyATerms).toContain("Terrigal");
  });
});
