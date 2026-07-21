"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowLeft, FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIndex = pathname === "/demo";

  return (
    <div className="min-h-screen bg-[#0a0806]">
      {/* Demo HUD */}
      <div className="bg-[#1a1714] border-b border-[#2a2420] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-[10px]">
              <FlaskConical className="h-3 w-3 mr-1" />
              DEMO MODE
            </Badge>
            <span className="text-xs text-[#7a6b5a] hidden sm:inline">
              Learn by doing — no real data, no consequences
            </span>
          </div>
          {!isIndex && (
            <Link
              href="/demo"
              className="inline-flex items-center text-xs text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              All demos
            </Link>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
