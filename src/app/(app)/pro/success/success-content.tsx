"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Check, ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("no session ID provided");
      return;
    }

    // Verify the session with our server, which verifies with Stripe
    fetch(`/api/v1/billing/verify-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          res
            .json()
            .then((data) => {
              setErrorMsg(data.error || "payment verification failed");
            })
            .catch(() => {
              setErrorMsg("payment verification failed");
            });
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("network error during verification");
      });
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="max-w-md mx-auto py-24 text-center text-[#7a6b5a]">
        confirming subscription with stripe...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <div className="inline-flex items-center justify-center p-3 border border-[#ff5252]/20 text-[#ff5252] mb-6">
          <X className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-4">verification failed</h1>
        <p className="text-[13px] text-[#7a6b5a] mb-8">{errorMsg}</p>
        <Button className="w-full" asChild>
          <Link href="/pro">Back to Pro</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-24 text-center">
      <div className="inline-flex items-center justify-center p-3 border border-[#00e676]/20 text-[#00e676] mb-6">
        <Check className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold mb-4">welcome to pro</h1>
      <p className="text-[13px] text-[#7a6b5a] mb-8">
        your subscription is active. you are now covered by our dispute resolution and loss
        protection.
      </p>
      <Button className="w-full" asChild>
        <Link href="/needs">
          Browse Needs
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
