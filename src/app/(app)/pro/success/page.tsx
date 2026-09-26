"use client";

import { Suspense } from "react";

import SuccessContent from "./success-content";

export default function ProSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-24 text-center text-ash">
          Confirming your subscription...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
