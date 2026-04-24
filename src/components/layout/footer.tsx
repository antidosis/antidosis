import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a]">
      <div className="px-4 md:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12px] text-[#7a6b4a]">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="antidosis" className="h-[90px] w-auto opacity-50 hover:opacity-100 transition-opacity" />
            <span>-- {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/needs" className="hover:text-[#e8c97c] transition-colors">browse</Link>
            <Link href="/needs/new" className="hover:text-[#e8c97c] transition-colors">post</Link>
            <Link href="/terms" className="hover:text-[#e8c97c] transition-colors">terms</Link>
            <Link href="/privacy" className="hover:text-[#e8c97c] transition-colors">privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
