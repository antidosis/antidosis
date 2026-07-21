import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// ─── Global mocks used by virtually every test ───
// These are truly universal — no test file needs to configure them differently.

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
