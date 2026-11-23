import {
  LayoutDashboard,
  BarChart3,
  Briefcase,
  HandHelping,
  FileText,
  User,
  Star,
  Users,
  Settings,
} from "lucide-react";

export type DashboardTabId =
  | "overview"
  | "analytics"
  | "needs"
  | "offers"
  | "contracts"
  | "profile"
  | "credentials"
  | "community"
  | "settings";

export interface DashboardTab {
  id: DashboardTabId;
  label: string;
  icon: typeof LayoutDashboard;
  section: string;
  subtitle: string;
}

export const DASHBOARD_TABS: DashboardTab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    section: "command",
    subtitle: "Your position on the network at a glance",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    section: "exchange",
    subtitle: "How your posts and offers are performing",
  },
  {
    id: "needs",
    label: "My Needs",
    icon: Briefcase,
    section: "exchange",
    subtitle: "Everything you have posted",
  },
  {
    id: "offers",
    label: "My Interests",
    icon: HandHelping,
    section: "exchange",
    subtitle: "Offers you have made on other people's needs",
  },
  {
    id: "contracts",
    label: "Contracts",
    icon: FileText,
    section: "exchange",
    subtitle: "Formal agreements you are party to",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    section: "account",
    subtitle: "How you appear to the network",
  },
  {
    id: "credentials",
    label: "Proof & ID",
    icon: Star,
    section: "account",
    subtitle: "Identity documents and verified credentials",
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    section: "account",
    subtitle: "Directory presence and relay activity",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    section: "account",
    subtitle: "Account type, directory preferences, danger zone",
  },
];

export const DASHBOARD_SECTIONS: { id: string; label: string }[] = [
  { id: "command", label: "command" },
  { id: "exchange", label: "exchange" },
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
