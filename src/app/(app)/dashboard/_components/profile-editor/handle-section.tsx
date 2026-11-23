import { useState } from "react";

import { AtSign, Loader2, Lock, TriangleAlert } from "lucide-react";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/ui/copy-link";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { RESERVED_HANDLE_MESSAGE, isReservedHandle } from "@/lib/handles";
import { HANDLE_FORMAT_RE } from "@/lib/schemas";

interface HandleSectionProps {
  handle: string | null;
}

const FORMAT_HINT = "3–20 characters: letters, numbers, underscore — starting with a letter.";

export function HandleSection({ handle }: HandleSectionProps) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  function validate(candidate: string): boolean {
    if (!HANDLE_FORMAT_RE.test(candidate)) {
      setError(FORMAT_HINT);
      return false;
    }
    if (isReservedHandle(candidate)) {
      setError(RESERVED_HANDLE_MESSAGE);
      return false;
    }
    setError(null);
    return true;
  }

  /** Step 1 — validate locally, then show the confirmation panel. */
  function requestClaim() {
    const candidate = value.trim().toLowerCase();
    if (!validate(candidate)) return;
    setConfirming(candidate);
  }

  /** Step 2 — the member has seen the permanent warning; claim it. */
  async function claim() {
    const candidate = confirming;
    if (!candidate) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/profiles/me/handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: candidate }),
      });
      if (res.ok) {
        toast(`@${candidate} is yours`, "success");
        setValue("");
        setConfirming(null);
        mutate("/api/v1/profiles/me");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setConfirming(null);
      if (res.status === 409 && data.code === "HANDLE_TAKEN") {
        setError("That handle is taken");
      } else if (res.status === 409 && data.code === "HANDLE_LOCKED") {
        setError("Handles are permanent and cannot be changed");
      } else if (res.status === 400 && data.code === "HANDLE_RESERVED") {
        setError(RESERVED_HANDLE_MESSAGE);
      } else if (res.status === 400) {
        setError(Array.isArray(data.error) ? FORMAT_HINT : (data.error ?? FORMAT_HINT));
      } else {
        setError(typeof data.error === "string" ? data.error : "Couldn't claim handle — try again");
      }
    } catch {
      setConfirming(null);
      setError("Couldn't claim handle — try again");
    } finally {
      setPending(false);
    }
  }

  if (handle) {
    return (
      <section className="vessel p-5 sm:p-6">
        <header className="mb-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-gold">Handle</h3>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="heading-display truncate text-2xl text-sun">@{handle}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ash">
              <Lock className="h-3 w-3 shrink-0" /> Handles are permanent — yours forever, and they
              can&rsquo;t be changed.
            </p>
          </div>
          <CopyLinkButton
            url={`${window.location.origin}/profile/@${handle}`}
            label="Copy profile link"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="vessel p-5 sm:p-6">
      <header className="mb-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-gold">Handle</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-ash">
          Claim your unique <span className="text-parchment">@handle</span> — a short, memorable
          link to your public profile. {FORMAT_HINT}
        </p>
      </header>

      {confirming ? (
        /* Step 2 — confirmation. Handles are permanent, so the member must
           explicitly confirm the exact handle before anything is claimed. */
        <div
          className="border border-sun/30 bg-sun/5 p-4"
          role="alertdialog"
          aria-label="Confirm handle"
        >
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-sun">
            <TriangleAlert className="h-3.5 w-3.5" /> confirm your handle
          </p>
          <p className="heading-display mt-2 text-3xl text-gold">@{confirming}</p>
          <ul className="mt-3 space-y-1 text-xs text-parchment">
            <li>· This handle is permanent — it can never be changed or transferred.</li>
            <li>· Your public profile link will be antidosis.com/profile/@{confirming}.</li>
            <li>· Typos can&rsquo;t be undone — double-check every character.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={claim} disabled={pending} size="sm">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Yes, claim @{confirming}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(null)}
              disabled={pending}
            >
              Back
            </Button>
          </div>
        </div>
      ) : (
        /* Step 1 — enter the desired handle */
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
              <Input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.toLowerCase());
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    requestClaim();
                  }
                }}
                placeholder="your_handle"
                aria-label="Handle"
                autoComplete="off"
                className="pl-9 font-mono text-base lowercase"
              />
            </div>
            <Button onClick={requestClaim} disabled={pending} className="sm:w-auto">
              Check &amp; claim
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-bad">{error}</p>}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ash">
            <Lock className="h-3 w-3 shrink-0" /> Handles are permanent — you&rsquo;ll be asked to
            confirm before claiming.
          </p>
        </>
      )}
    </section>
  );
}
