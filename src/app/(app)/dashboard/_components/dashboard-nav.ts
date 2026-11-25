import {
  Bookmark,
  Briefcase,
  FileText,
  HandHelping,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Radio,
  Settings,
  User,
} from "lucide-react";

export type DashboardTabId =
  | "overview"
  | "needs"
  | "offers"
  | "contracts"
  | "watchlist"
  | "profile"
  | "inbox"
  | "relay"
  | "support"
  | "settings";

export interface DashboardTab {
  id: DashboardTabId;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  section: string;
  subtitle: string;
}

export const DASHBOARD_TABS: DashboardTab[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    icon: LayoutDashboard,
    section: "command",
    subtitle: "Your next actions, exchange activity and reputation in one place",
  },
  {
    id: "needs",
    label: "My Needs",
    shortLabel: "Needs",
    icon: Briefcase,
    section: "exchange",
    subtitle: "Manage your posts and open their individual performance",
  },
  {
    id: "offers",
    label: "My Interests",
    shortLabel: "Interests",
    icon: HandHelping,
    section: "exchange",
    subtitle: "Offers you have made on other people's needs",
  },
  {
    id: "contracts",
    label: "Agreements",
    shortLabel: "Agreements",
    icon: FileText,
    section: "exchange",
    subtitle: "Exchange contracts and private direct agreements",
  },
  {
    id: "watchlist",
    label: "Watchlist",
    shortLabel: "Watching",
    icon: Bookmark,
    section: "exchange",
    subtitle: "Needs you are following, without expressing interest yet",
  },
  {
    id: "inbox",
    label: "Inbox",
    shortLabel: "Inbox",
    icon: Inbox,
    section: "network",
    subtitle: "Recent notifications and your notification archive",
  },
  {
    id: "relay",
    label: "Relay",
    shortLabel: "Relay",
    icon: Radio,
    section: "network",
    subtitle: "Direct messages, channels, friends, blocks and recent relay activity",
  },
  {
    id: "profile",
    label: "Profile & Presence",
    shortLabel: "Profile",
    icon: User,
    section: "account",
    subtitle: "Your public identity, directory presence, social profiles and privacy",
  },
  {
    id: "settings",
    label: "Settings & Security",
    shortLabel: "Settings",
    icon: Settings,
    section: "account",
    subtitle: "Appearance, sign-in security, account details and privacy controls",
  },
  {
    id: "support",
    label: "Support & Report",
    shortLabel: "Support",
    icon: LifeBuoy,
    section: "account",
    subtitle: "Get help from the Antidosis team, track tickets and follow your reports",
  },
];

export const DASHBOARD_SECTIONS: { id: string; label: string }[] = [
  { id: "command", label: "command" },
  { id: "exchange", label: "exchange" },
  { id: "network", label: "network" },
  { id: "account", label: "account" },
];

export function statusBadgeVariant(status: string) {
  switch (status) {
    case "active":
    case "contracted":
    case "accepted":
    case "completed":
    case "selected":
      return "success" as const;
    case "pending":
    case "open":
    case "draft":
      return "outline" as const;
    case "declined":
    case "cancelled":
    case "withdrawn":
      return "destructive" as const;
    case "negotiating":
    case "pending_terms":
    case "pending_completion":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

export function wizardKey(profileId: string) {
  return `antidosis-wizard-dismissed:${profileId}`;
}
