"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Link2, Check } from "lucide-react";

export function CopyLinkButton({ url, label = "Copy link" }: { url: string; label?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Failed to copy link", "error");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      className="text-[#7a6b5a] hover:text-[#e8d5a3] h-8 px-2"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 mr-1.5 text-[#00e676]" />
      ) : (
        <Link2 className="h-3.5 w-3.5 mr-1.5" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}
