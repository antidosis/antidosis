import { Check, FileText, LockKeyhole, ShieldCheck } from "lucide-react";

export function DirectAgreementVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface/50 p-5 shadow-[0_32px_100px_-58px_rgb(var(--c-sun)/0.35)] sm:p-6">
      <div className="flex items-center justify-between border-b border-line/70 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
          Direct agreement
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-ok/25 bg-ok/5 px-2.5 py-1 text-[11px] text-ok">
          <LockKeyhole className="h-3 w-3" /> Private
        </span>
      </div>

      <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <PartyNode letter="A" label="You" />
        <svg className="h-10 w-10 text-linehi sm:w-14" viewBox="0 0 56 40" fill="none" aria-hidden>
          <path d="M2 20H54" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx="28" cy="20" r="4" fill="rgb(var(--c-sun))" />
        </svg>
        <PartyNode letter="B" label="Invitee" />
      </div>

      <div className="relative mx-auto -mt-1 max-w-sm rounded-lg border border-paperline bg-paper p-5 text-paperink shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-paperline pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-paperlabel">
              Agreement reference
            </p>
            <p className="mt-1 font-serif text-lg font-semibold text-paperhead">
              Website for local café
            </p>
          </div>
          <FileText className="h-5 w-5 shrink-0 text-paperlabel" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-1.5 w-full rounded bg-paperline/60" />
          <div className="h-1.5 w-11/12 rounded bg-paperline/60" />
          <div className="h-1.5 w-4/5 rounded bg-paperline/60" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <Signature name="Party A" signed />
          <Signature name="Party B" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-1 border-t border-line/70 pt-4 text-center">
        {["Invite", "Agree", "Sign", "Review"].map((step, index) => (
          <div key={step} className="relative">
            <span
              className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px] ${
                index === 0 ? "border-ok/40 bg-ok/10 text-ok" : "border-line bg-inset text-ash"
              }`}
            >
              {index === 0 ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <p className="mt-1.5 text-[11px] text-ash sm:text-xs">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartyNode({ letter, label }: { letter: string; label: string }) {
  return (
    <div className="relative z-10 text-center">
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-mercury/30 bg-inset font-mono text-lg text-mercury shadow-[0_0_30px_rgb(var(--c-mercury)/0.08)]">
        {letter}
        <ShieldCheck className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-surface p-0.5 text-ok" />
      </div>
      <p className="mt-2 text-xs text-parchment">{label}</p>
    </div>
  );
}

function Signature({ name, signed = false }: { name: string; signed?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-paperlabel">{name}</p>
      <div className="mt-2 border-b border-paperline pb-1.5">
        {signed ? (
          <span className="font-serif text-sm italic text-paperhead">Accepted</span>
        ) : (
          <span className="text-[10px] text-paperlabel">Awaiting review</span>
        )}
      </div>
    </div>
  );
}
