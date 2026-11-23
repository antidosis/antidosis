export function presentContract<
  T extends { inviteTokenHash?: string | null; inviteEmail?: string | null },
>(contract: T): Omit<T, "inviteTokenHash" | "inviteEmail"> {
  const { inviteTokenHash: _inviteTokenHash, inviteEmail: _inviteEmail, ...safe } = contract;
  return safe;
}
