import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: (...args: unknown[]) => mockSend(...args),
    },
  })),
}));

async function loadEmail() {
  const mod = await import("./email");
  return mod;
}

describe("email functions with valid API key", () => {
  beforeEach(() => {
    mockSend.mockClear();
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "re_validkey123");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.antidosis.com");
  });

  describe("sendInterestReceivedEmail", () => {
    it("sends email with correct parameters", async () => {
      mockSend.mockResolvedValue({ id: "email-1" });
      const { sendInterestReceivedEmail } = await loadEmail();

      await sendInterestReceivedEmail("poster@example.com", "Fix my sink", "John Doe");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.from).toBe("Antidosis <noreply@antidosis.com>");
      expect(args.to).toBe("poster@example.com");
      expect(args.subject).toBe('Someone is interested in your need: "Fix my sink"');
      expect(args.html).toContain("John Doe");
      expect(args.html).toContain("Fix my sink");
      expect(args.html).toContain("https://app.antidosis.com/needs");
    });
  });

  describe("sendInterestAcceptedEmail", () => {
    it("sends email with needId link", async () => {
      mockSend.mockResolvedValue({ id: "email-2" });
      const { sendInterestAcceptedEmail } = await loadEmail();

      await sendInterestAcceptedEmail(
        "interested@example.com",
        "Fix my sink",
        "Jane Smith",
        "need-123"
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.subject).toBe("Your interest was accepted: Fix my sink");
      expect(args.html).toContain("Jane Smith");
      expect(args.html).toContain("https://app.antidosis.com/needs/need-123");
    });

    it("sends email with fallback link when no needId", async () => {
      mockSend.mockResolvedValue({ id: "email-3" });
      const { sendInterestAcceptedEmail } = await loadEmail();

      await sendInterestAcceptedEmail("interested@example.com", "Fix my sink", "Jane Smith");

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain("https://app.antidosis.com/needs");
      expect(args.html).not.toContain("/needs/undefined");
    });
  });

  describe("sendContractFormedEmail", () => {
    it("sends email with contractId link", async () => {
      mockSend.mockResolvedValue({ id: "email-4" });
      const { sendContractFormedEmail } = await loadEmail();

      await sendContractFormedEmail(
        "user@example.com",
        "Fix my sink",
        "Bob Builder",
        "contract-456"
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.subject).toBe("Contract formed: Fix my sink");
      expect(args.html).toContain("Bob Builder");
      expect(args.html).toContain("https://app.antidosis.com/contracts/contract-456");
    });

    it("sends email with fallback link when no contractId", async () => {
      mockSend.mockResolvedValue({ id: "email-5" });
      const { sendContractFormedEmail } = await loadEmail();

      await sendContractFormedEmail("user@example.com", "Fix my sink", "Bob Builder");

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain("https://app.antidosis.com/needs");
    });
  });

  describe("sendContractSignReminderEmail", () => {
    it("sends reminder with contractId link", async () => {
      mockSend.mockResolvedValue({ id: "email-6" });
      const { sendContractSignReminderEmail } = await loadEmail();

      await sendContractSignReminderEmail(
        "signer@example.com",
        "Fix my sink",
        "Alice Wonder",
        "contract-789"
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.subject).toBe("Reminder: please sign the contract for Fix my sink");
      expect(args.html).toContain("Alice Wonder");
      expect(args.html).toContain("https://app.antidosis.com/contracts/contract-789");
    });

    it("sends reminder with fallback link when no contractId", async () => {
      mockSend.mockResolvedValue({ id: "email-7" });
      const { sendContractSignReminderEmail } = await loadEmail();

      await sendContractSignReminderEmail("signer@example.com", "Fix my sink", "Alice Wonder");

      const args = mockSend.mock.calls[0][0];
      expect(args.html).toContain("https://app.antidosis.com/needs");
    });
  });

  describe("sendContractSignedEmail", () => {
    it("sends active contract email", async () => {
      mockSend.mockResolvedValue({ id: "email-8" });
      const { sendContractSignedEmail } = await loadEmail();

      await sendContractSignedEmail("user@example.com", "Fix my sink", "Charlie Day");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.subject).toBe("Contract active: Fix my sink");
      expect(args.html).toContain("Charlie Day");
      expect(args.html).toContain("https://app.antidosis.com/needs");
    });
  });

  describe("sendContractCompletedEmail", () => {
    it("sends completion email", async () => {
      mockSend.mockResolvedValue({ id: "email-9" });
      const { sendContractCompletedEmail } = await loadEmail();

      await sendContractCompletedEmail("user@example.com", "Fix my sink");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const args = mockSend.mock.calls[0][0];
      expect(args.subject).toBe("Contract completed: Fix my sink");
      expect(args.html).toContain("marked complete");
      expect(args.html).toContain("https://app.antidosis.com/needs");
    });
  });
});

describe("email functions with placeholder API key", () => {
  beforeEach(() => {
    mockSend.mockClear();
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "placeholder");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.antidosis.com");
  });

  it("does not send email when API key is placeholder", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendInterestReceivedEmail } = await loadEmail();

    await sendInterestReceivedEmail("to@example.com", "Title", "Name");

    expect(mockSend).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("RESEND_API_KEY is not configured")
    );

    consoleSpy.mockRestore();
  });
});

describe("email functions with test API key", () => {
  beforeEach(() => {
    mockSend.mockClear();
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "test_key_123");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.antidosis.com");
  });

  it("does not send email when API key contains 'test'", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendContractCompletedEmail } = await loadEmail();

    await sendContractCompletedEmail("to@example.com", "Title");

    expect(mockSend).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("RESEND_API_KEY is not configured")
    );

    consoleSpy.mockRestore();
  });
});

describe("email functions with missing API key", () => {
  beforeEach(() => {
    mockSend.mockClear();
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.antidosis.com");
  });

  it("does not send email when API key is empty", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendInterestAcceptedEmail } = await loadEmail();

    await sendInterestAcceptedEmail("to@example.com", "Title", "Name");

    expect(mockSend).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("RESEND_API_KEY is not configured")
    );

    consoleSpy.mockRestore();
  });
});
