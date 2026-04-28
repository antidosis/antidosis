import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#2a2420]">
      <div className="px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="antidosis"
              width={80}
              height={32}
              className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
            <span className="text-xs text-[#7a6b5a]">{new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/needs" className="text-xs text-[#b8a078] hover:text-[#e8d5a3] transition-colors">browse</Link>
            <Link href="/needs/new" className="text-xs text-[#b8a078] hover:text-[#e8d5a3] transition-colors">post</Link>
            <Link href="/examples" className="text-xs text-[#b8a078] hover:text-[#e8d5a3] transition-colors">examples</Link>
            <Link href="/how-it-works" className="text-xs text-[#b8a078] hover:text-[#e8d5a3] transition-colors">how it works</Link>
            <Link href="/terms" className="text-xs text-[#b8a078] hover:text-[#e8d5a3] transition-colors">terms</Link>
            <Link href="/privacy" className="text-xs text-[#b8a078] hover:text-[#e8d5a3] transition-colors">privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
