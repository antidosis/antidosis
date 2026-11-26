import { randomInt } from "crypto";

import { prisma } from "@/lib/prisma";

// Unambiguous alphabet (no I, L, O, 0, 1) so codes survive being read out
// over the phone or copied off a bank transfer description.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

/** "ANT-XXXXXX" — permanent public member ID. */
export function generateMemberCode(): string {
  return `ANT-${randomCode(6)}`;
}

/** "MESH-XXXXXX" — human-facing store order reference quoted on transfers. */
export function generateOrderRef(): string {
  return `MESH-${randomCode(6)}`;
}

/**
 * Allocate a member code that is not taken. The unique index is the real
 * guard; the pre-check just keeps collisions out of the happy path.
 */
export async function allocateMemberCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateMemberCode();
    const clash = await prisma.profile.findUnique({
      where: { memberCode: code },
      select: { id: true },
    });
    if (!clash) return code;
  }
  throw new Error("Could not allocate a unique member code");
}

/** Allocate an order reference that is not taken. */
export async function allocateOrderRef(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const ref = generateOrderRef();
    const clash = await prisma.meshOrder.findUnique({
      where: { orderRef: ref },
      select: { id: true },
    });
    if (!clash) return ref;
  }
  throw new Error("Could not allocate a unique order reference");
}
