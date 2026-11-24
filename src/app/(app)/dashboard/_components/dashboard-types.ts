export interface DashboardNeed {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count?: { acceptances?: number; views?: number; watches?: number };
  acceptances?: { id: string }[];
}

export interface DashboardContract {
  id: string;
  kind: "exchange" | "direct";
  title: string | null;
  status: string;
  partyAId?: string;
  partyBId?: string | null;
  partyA?: { id: string };
  partyBSignedAt?: string | null;
  need?: { title: string } | null;
}

export interface DashboardOffer {
  id: string;
  status: string;
  message?: string | null;
  need?: { id: string; title: string };
}
