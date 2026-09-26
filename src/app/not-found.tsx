import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-void text-gold flex items-center justify-center px-6 font-mono">
      <div className="text-center space-y-6">
        <p className="text-xs text-ash font-mono">$ curl /nonexistent</p>
        <h1 className="heading-display text-6xl tracking-tight text-leather">404</h1>
        <p className="text-base text-ash">This page does not exist.</p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
