"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex items-center justify-center px-6 font-mono">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-xs text-[#7a6b5a] font-mono">$ dmesg | tail -n 1</p>
        <h1 className="heading-display text-4xl tracking-tight">
          <span className="text-[#ff5252]">Error.</span>
        </h1>
        <p className="text-sm text-[#7a6b5a] leading-relaxed">
          An unexpected error occurred. We have logged it and will investigate.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="secondary" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
