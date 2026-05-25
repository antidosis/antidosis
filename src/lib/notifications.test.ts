import { describe, it, expect, vi } from "vitest";

import { createNotification } from "./notifications";

const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { create: (...args: unknown[]) => mockCreate(...args) },
  },
}));

describe("createNotification", () => {
  it("creates a notification with all fields", async () => {
    mockCreate.mockResolvedValueOnce({ id: "notif-1" });

    await createNotification({
      userId: "user-1",
      type: "contract_formed",
      title: "Contract formed",
      body: "A contract has been formed",
      data: { contractId: "c-1" },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "contract_formed",
        title: "Contract formed",
        body: "A contract has been formed",
        data: { contractId: "c-1" },
      },
    });
  });

  it("handles missing data field", async () => {
    mockCreate.mockResolvedValueOnce({ id: "notif-2" });

    await createNotification({
      userId: "user-1",
      type: "message",
      title: "New message",
      body: "You have a new message",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "message",
        title: "New message",
        body: "You have a new message",
        data: {},
      },
    });
  });
});
