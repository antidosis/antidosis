"use client";

import { CopyLinkButton } from "@/components/ui/copy-link";

export function ProfileActions({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2">
      <CopyLinkButton url={url} label="Copy link" />
    </div>
  );
}
