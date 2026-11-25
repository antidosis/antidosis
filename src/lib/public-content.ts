import type { Prisma } from "@prisma/client";

import { EXCHANGE_MODE_VALUES } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export interface PublicNeedItem {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  needCategory: string | null;
  offerType: string;
  offerDescription: string;
  isLocal: boolean;
  locationName: string | null;
  destinationName: string | null;
  urgency: number;
  allowUrgentContact: boolean;
  poster: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
    locationName: string | null;
  };
  requiredSkills: { id: string; name: string }[];
  _count: { acceptances: number; views: number; watches: number };
  boostedUntil: string | null;
  boostTier: string | null;
}

export interface PublicNeedsResponse {
  needs: PublicNeedItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  availableFilters: {
    offerTypes: string[];
    categories: string[];
    skills: string[];
  };
}

interface PublicNeedsQuery {
  q?: string;
  skill?: string;
  offerType?: string;
  location?: string;
  category?: string;
  page: number;
  limit: number;
}

export async function getPublicNeeds({
  q,
  skill,
  offerType,
  location,
  category,
  page,
  limit,
}: PublicNeedsQuery): Promise<PublicNeedsResponse> {
  const where: Prisma.NeedWhereInput = { status: "open" };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (offerType) where.offerType = offerType;
  if (location) where.locationName = { contains: location, mode: "insensitive" };
  if (category && EXCHANGE_MODE_VALUES.includes(category)) where.needCategory = category;
  if (skill) where.requiredSkills = { some: { name: { contains: skill, mode: "insensitive" } } };

  const [needs, total, offerTypesWithNeeds, categoriesWithNeeds, skillsWithNeeds] =
    await Promise.all([
      prisma.need.findMany({
        where,
        orderBy: [
          { boostedUntil: { sort: "desc", nulls: "last" } },
          { urgency: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          poster: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              ratingAvg: true,
              ratingCount: true,
              locationName: true,
            },
          },
          requiredSkills: true,
          _count: { select: { acceptances: true, views: true, watches: true } },
        },
      }),
      prisma.need.count({ where }),
      prisma.need.findMany({
        where: { status: "open" },
        select: { offerType: true },
        distinct: ["offerType"],
      }),
      prisma.need.findMany({
        where: { status: "open", needCategory: { not: null } },
        select: { needCategory: true },
        distinct: ["needCategory"],
      }),
      prisma.$queryRaw<{ name: string }[]>`
        SELECT DISTINCT ns.name
        FROM need_skills ns
        INNER JOIN needs n ON ns.need_id = n.id
        WHERE n.status = 'open'
      `,
    ]);

  return {
    needs: needs.map((need) => ({
      ...need,
      createdAt: need.createdAt.toISOString(),
      boostedUntil: need.boostedUntil?.toISOString() ?? null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
    availableFilters: {
      offerTypes: offerTypesWithNeeds.map((need) => need.offerType),
      categories: categoriesWithNeeds
        .map((need) => need.needCategory)
        .filter((value): value is string => Boolean(value)),
      skills: skillsWithNeeds.map((skill) => skill.name),
    },
  };
}

export interface DirectoryProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locationName: string | null;
  publicPhone: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  isVerified: boolean;
  accountType: string;
  abn: string | null;
  abnVerified: boolean;
  audienceSize: number | null;
  skills: { name: string }[];
  credentials: { id: string }[];
  specialties: {
    profession: string;
    headline: string | null;
    attributes: string | null;
  }[];
}

export async function getDirectoryProfiles(
  query?: string,
  type?: string,
  profession?: string
): Promise<DirectoryProfile[]> {
  const accountType = type === "businesses" ? "business" : type === "people" ? "individual" : null;
  const where: Prisma.ProfileWhereInput = {
    isVerified: true,
    mobileVerified: true,
    showInDirectory: true,
    bannedAt: null,
  };
  if (accountType) where.accountType = accountType;
  if (profession) {
    where.directorySpecialties = { some: { profession } };
  }
  if (query) {
    const search: Prisma.ProfileWhereInput = {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
        { skills: { some: { name: { contains: query, mode: "insensitive" } } } },
        { locationName: { contains: query, mode: "insensitive" } },
      ],
    };
    // AND-combine so a profession filter and a text search narrow together
    // instead of overriding each other.
    const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
    where.AND = [...existingAnd, search];
  }

  const profiles = await prisma.profile.findMany({
    where,
    orderBy: { ratingAvg: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
      locationName: true,
      publicPhone: true,
      businessPhone: true,
      businessEmail: true,
      ratingAvg: true,
      ratingCount: true,
      jobsCompleted: true,
      isVerified: true,
      accountType: true,
      abn: true,
      abnVerified: true,
      audienceSize: true,
      skills: { select: { name: true } },
      credentials: { where: { isPublic: true }, select: { id: true } },
      directorySpecialties: {
        select: { profession: true, headline: true, attributes: true },
      },
    },
  });

  return profiles.map(({ directorySpecialties, ...profile }) => ({
    ...profile,
    specialties: directorySpecialties,
    abn: profile.accountType === "business" ? profile.abn : null,
    abnVerified: profile.accountType === "business" ? profile.abnVerified : false,
    audienceSize: profile.accountType === "individual" ? profile.audienceSize : null,
  }));
}
