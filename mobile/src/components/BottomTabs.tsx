import { Home, ClipboardList, Terminal, Search, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/needs", label: "Needs", icon: ClipboardList },
  { path: "/chat", label: "Chat", icon: Terminal },
  { path: "/discover", label: "Discover", icon: Search },
  { path: "/profile", label: "Profile", icon: User },
];

export function BottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0806] border-t border-[var(--bronze)] safe-bottom tap-highlight-none">
      <div className="flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full tap-highlight-none touch-manipulation"
              aria-label={tab.label}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? "text-[var(--sun)]" : "text-[var(--leather)]"}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-[var(--sun)]" : "text-[var(--leather)]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
