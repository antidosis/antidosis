import { ScanLines } from "@/components/effects/scanlines";
import { LaunchBanner } from "@/components/launch-countdown";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { NotificationRealtime } from "@/components/layout/notification-realtime";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-void text-gold flex flex-col relative">
      <ScanLines />
      <Navbar />
      <LaunchBanner />
      <NotificationRealtime />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
