import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-24 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#8f7f6e]" />
      <p className="text-sm text-[#8f7f6e] mt-3">loading profile...</p>
    </div>
  );
}
