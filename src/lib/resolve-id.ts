import { prisma } from "@/lib/prisma";

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const PREFIX_RE = /^[a-f0-9]{4,12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/** True for strings that look like an id prefix printed in terminal tables. */
export function isIdPrefixLike(id: string): boolean {
  return PREFIX_RE.test(id);
}

type IdEntity = "need" | "acceptance" | "contract" | "profile";

/**
 * Resolve an entity id that may be a full UUID or a unique hex prefix
 * (as printed in terminal tables). Full UUIDs pass through untouched.
 * Returns the matching full id, or null when the prefix matches nothing
 * or is ambiguous.
 */
export async function resolveEntityId(entity: IdEntity, id: string): Promise<string | null> {
  if (isUuid(id)) return id;
  if (!PREFIX_RE.test(id)) return null;

  const delegate = (prisma as unknown as Record<string, any>)[entity];
  const matches = await delegate.findMany({
    where: { id: { startsWith: id.toLowerCase() } },
    select: { id: true },
    take: 2,
  });

  return matches.length === 1 ? (matches[0].id as string) : null;
}
