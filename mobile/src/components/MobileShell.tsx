import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, Hash, Search, User, WifiOff, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { hapticImpact } from "@mobile/lib/native";
import { useNetworkStatus } from "@mobile/hooks/useNetworkStatus";

const TABS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/needs", label: "Needs", icon: ClipboardList },
  { path: "/chat", label: "Chat", icon: Hash },
  { path: "/discover", label: "Discover", icon: Search },
  { path: "/profile", label: "Profile", icon: User },
];

function TabButton({
  tab,
  isActive,
  onPress,
  layout,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
  layout: "bottom" | "rail";
}) {
  const Icon = tab.icon;
  if (layout === "rail") {
    return (
      <button
        key={tab.path}
        onClick={onPress}
        className={`
          relative flex flex-col items-center justify-center gap-1
          w-full py-3 rounded-lg mx-2
          tap-highlight-none touch-manipulation
          transition-all duration-200
          ${isActive ? "bg-[var(--bronze)]/20 text-[var(--sun)]" : "text-[var(--leather)] hover:bg-[var(--bronze)]/10 hover:text-[var(--parchment)]"}
        `}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
        <span className="text-[9px] font-mono font-medium tracking-wider uppercase">
          {tab.label}
        </span>
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--sun)] rounded-r-full shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
        )}
      </button>
    );
  }

  return (
    <button
      key={tab.path}
      onClick={onPress}
      className={`
        relative flex flex-col items-center gap-0.5
        py-2 px-3 min-w-[56px]
        tap-highlight-none touch-manipulation
        transition-all duration-200
        ${isActive ? "active:scale-95" : "active:scale-95 opacity-70"}
      `}
    >
      {isActive && (
        <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-px bg-[var(--sun)] shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
      )}
      <Icon
        size={20}
        strokeWidth={isActive ? 2.5 : 1.5}
        className={isActive ? "text-[var(--sun)]" : "text-[var(--leather)]"}
      />
      <span
        className={`
          text-[9px] font-mono font-medium tracking-wider uppercase
          ${isActive ? "text-[var(--sun)]" : "text-[var(--leather)]"}
        `}
      >
        {tab.label}
      </span>
    </button>
  );
}

export function MobileShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const online = useNetworkStatus();

  useEffect(() => {
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  const activeTab = TABS.find((t) => location.pathname.startsWith(t.path))?.path ?? "/home";

  const handleTabPress = (path: string) => {
    hapticImpact("light");
    navigate(path);
  };

  return (
    <div className="h-[100dvh] flex bg-[var(--void)] overflow-hidden">
      {/* ═══ Side Navigation Rail (tablet landscape) ═══ */}
      <nav className="hidden md:flex flex-col w-20 bg-[var(--void-raised)]/95 backdrop-blur-md border-r border-[var(--bronze)] z-40 safe-top safe-bottom py-2 shrink-0">
        <div className="flex flex-col items-center gap-1 flex-1">
          {TABS.map((tab) => (
            <TabButton
              key={tab.path}
              tab={tab}
              isActive={activeTab === tab.path}
              onPress={() => handleTabPress(tab.path)}
              layout="rail"
            />
          ))}
        </div>
      </nav>

      {/* ═══ Main Content Area ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Offline Banner */}
        {!online && (
          <div className="shrink-0 bg-[var(--ruby)]/90 px-4 py-1.5 flex items-center justify-center gap-2">
            <WifiOff size={12} className="text-white" />
            <span className="text-[10px] font-mono text-white uppercase tracking-wider">
              Offline — reconnect to sync
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>

        {/* ═══ Bottom Tab Bar (phone only) ═══ */}
        <nav className="md:hidden shrink-0 bg-[var(--void-raised)]/95 backdrop-blur-md border-t border-[var(--bronze)] safe-bottom z-40">
          <div className="flex items-center justify-around px-1 max-w-2xl mx-auto">
            {TABS.map((tab) => (
              <TabButton
                key={tab.path}
                tab={tab}
                isActive={activeTab === tab.path}
                onPress={() => handleTabPress(tab.path)}
                layout="bottom"
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
