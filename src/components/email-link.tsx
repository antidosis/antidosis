"use client";

import { useEffect, useState } from "react";

/**
 * Renders an email link without the address in the server HTML.
 * Cloudflare's email obfuscation rewrites mailto: links at the edge,
 * which breaks React hydration — so the href is assembled on mount.
 */
export function EmailLink({
  email,
  subject,
  className,
  children,
}: {
  email: string;
  subject?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [href, setHref] = useState<string | undefined>(undefined);

  useEffect(() => {
    setHref(`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`);
  }, [email, subject]);

  return (
    <a href={href} className={className}>
      {children ?? email}
    </a>
  );
}
