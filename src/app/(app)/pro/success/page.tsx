"use client";

import { Suspense } from "react";
import SuccessContent from "./success-content";

export const dynamic = "force-dynamic";

export default function ProSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-24 text-center text-zinc-400">
          Confirming your subscription...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
