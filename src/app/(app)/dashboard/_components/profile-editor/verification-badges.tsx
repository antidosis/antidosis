import Link from "next/link";

import { ArrowRight, Shield, ShieldAlert, Smartphone } from "lucide-react";

interface VerificationBadgesProps {
  isVerified: boolean;
  mobileVerified: boolean;
  mobile: string | null;
}

export function VerificationBadges({
  isVerified,
  mobileVerified,
  mobile,
}: VerificationBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isVerified ? (
        <span className="inline-flex items-center gap-1 rounded border border-ok/30 bg-ok/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ok">
          <Shield className="h-3 w-3" /> verified
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ash">
          <Shield className="h-3 w-3" /> not verified
        </span>
      )}
      {mobileVerified ? (
        <span className="inline-flex items-center gap-1 rounded border border-aero/30 bg-aero/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-aero">
          <Smartphone className="h-3 w-3" /> mobile verified
        </span>
      ) : mobile ? (
        <Link
          href="/verify-mobile"
          className="inline-flex items-center gap-1 rounded border border-sun/30 bg-sun/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-sun transition-colors hover:border-sun/60"
        >
          <ShieldAlert className="h-3 w-3" /> verify mobile
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ash">
          <Smartphone className="h-3 w-3" /> no mobile on file
        </span>
      )}
    </div>
  );
}
