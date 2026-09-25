import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Item 9: backfill banned_mobiles from currently-banned profiles
  const banned = await prisma.profile.findMany({
    where: { bannedAt: { not: null }, mobile: { not: null } },
    select: { id: true, mobile: true, bannedReason: true, bannedAt: true },
  });
  console.log(`Banned profiles with mobile: ${banned.length}`);
  for (const p of banned) {
    await prisma.bannedMobile.upsert({
      where: { mobile: p.mobile! },
      create: {
        mobile: p.mobile!,
        reason: p.bannedReason,
        bannedAt: p.bannedAt ?? new Date(),
        profileId: p.id,
      },
      update: {},
    });
    console.log(`  backfilled ${p.mobile}`);
  }

  // Item 6: RLS policies on messaging tables
  const policies = await prisma.$queryRawUnsafe<
    { tablename: string; policyname: string; cmd: string; qual: string | null }[]
  >(
    `SELECT tablename, policyname, cmd, qual FROM pg_policies
     WHERE tablename IN ('need_messages', 'direct_messages', 'terminal_messages', 'dm_threads', 'messages')
     ORDER BY tablename, policyname`
  );
  console.log(`\nRLS policies on messaging tables: ${policies.length}`);
  for (const p of policies) {
    console.log(`  ${p.tablename} | ${p.policyname} | ${p.cmd}`);
  }

  const rlsEnabled = await prisma.$queryRawUnsafe<{ relname: string; relrowsecurity: boolean }[]>(
    `SELECT relname, relrowsecurity FROM pg_class
     WHERE relname IN ('need_messages', 'direct_messages', 'terminal_messages', 'dm_threads', 'messages')`
  );
  console.log("\nRLS enabled flags:");
  for (const r of rlsEnabled) {
    console.log(`  ${r.relname}: rowsecurity=${r.relrowsecurity}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
