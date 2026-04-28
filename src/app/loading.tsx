import { Loader2 } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-[#0a0806] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#f5a623]" />
    </div>
  );
}
