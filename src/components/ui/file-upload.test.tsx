import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { FileUpload } from "./file-upload";

describe("FileUpload", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: "https://cdn.example.com/image.png" }),
        })
      ) as unknown as typeof fetch
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders upload button with default text", () => {
    render(<FileUpload onUpload={vi.fn()} />);
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("renders custom children text", () => {
    render(<FileUpload onUpload={vi.fn()}>Choose File</FileUpload>);
    expect(screen.getByRole("button", { name: "Choose File" })).toBeInTheDocument();
  });

  it("opens file input when button is clicked", () => {
    render(<FileUpload onUpload={vi.fn()} />);
    const button = screen.getByRole("button", { name: /upload/i });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.click(button);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("shows preview after file selection and calls onUpload on success", async () => {
    const onUpload = vi.fn();
    render(<FileUpload onUpload={onUpload} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Mock FileReader
    const mockReadAsDataURL = vi.fn();
    const mockFileReader = {
      readAsDataURL: mockReadAsDataURL,
      onload: null as ((ev: { target: { result: string } }) => void) | null,
      result: "data:image/png;base64,abc123",
    };
    vi.stubGlobal(
      "FileReader",
      vi.fn(() => mockFileReader)
    );

    fireEvent.change(input, { target: { files: [file] } });

    // Trigger FileReader load
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: "data:image/png;base64,abc123" } });
    }

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith("https://cdn.example.com/image.png");
    });
  });

  it("clears preview when X button is clicked", async () => {
    const onUpload = vi.fn();
    render(<FileUpload onUpload={onUpload} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as ((ev: { target: { result: string } }) => void) | null,
      result: "data:image/png;base64,abc123",
    };
    vi.stubGlobal(
      "FileReader",
      vi.fn(() => mockFileReader)
    );

    fireEvent.change(input, { target: { files: [file] } });

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: "data:image/png;base64,abc123" } });
    }

    // Wait for upload to complete
    await waitFor(() => {
      expect(onUpload).toHaveBeenCalled();
    });

    // Preview should be visible; find and click the clear button
    const clearButton = screen.getByRole("button", { name: "" });
    fireEvent.click(clearButton);

    // Button text should return
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("does not call onUpload when upload fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Upload failed" }),
        })
      ) as unknown as typeof fetch
    );

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const onUpload = vi.fn();
    render(<FileUpload onUpload={onUpload} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as ((ev: { target: { result: string } }) => void) | null,
      result: "data:image/png;base64,abc123",
    };
    vi.stubGlobal(
      "FileReader",
      vi.fn(() => mockFileReader)
    );

    fireEvent.change(input, { target: { files: [file] } });

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: "data:image/png;base64,abc123" } });
    }

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("Upload failed:", "Upload failed");
    });

    expect(onUpload).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("disables button while uploading", async () => {
    let resolveUpload: (value: Response) => void;
    const uploadPromise = new Promise<Response>((resolve) => {
      resolveUpload = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => uploadPromise) as unknown as typeof fetch);

    render(<FileUpload onUpload={vi.fn()} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as ((ev: { target: { result: string } }) => void) | null,
      result: "data:image/png;base64,abc123",
    };
    vi.stubGlobal(
      "FileReader",
      vi.fn(() => mockFileReader)
    );

    fireEvent.change(input, { target: { files: [file] } });

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: "data:image/png;base64,abc123" } });
    }

    // While uploading, the hidden input should be disabled
    await waitFor(() => {
      expect(input).toBeDisabled();
    });

    resolveUpload!(
      new Response(JSON.stringify({ url: "https://cdn.example.com/image.png" }), { status: 200 })
    );
  });

  it("respects custom accept prop", () => {
    render(<FileUpload onUpload={vi.fn()} accept=".pdf" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute("accept", ".pdf");
  });

  it("applies custom className", () => {
    render(<FileUpload onUpload={vi.fn()} className="my-uploader" />);
    const wrapper = screen.getByRole("button", { name: /upload/i }).parentElement;
    expect(wrapper).toHaveClass("my-uploader");
  });

  it("handles fetch error gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Network error"))) as unknown as typeof fetch
    );

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const onUpload = vi.fn();
    render(<FileUpload onUpload={onUpload} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as ((ev: { target: { result: string } }) => void) | null,
      result: "data:image/png;base64,abc123",
    };
    vi.stubGlobal(
      "FileReader",
      vi.fn(() => mockFileReader)
    );

    fireEvent.change(input, { target: { files: [file] } });

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: "data:image/png;base64,abc123" } });
    }

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("Upload error:", expect.any(Error));
    });

    expect(onUpload).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
