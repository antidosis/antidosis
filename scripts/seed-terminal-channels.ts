import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHANNELS = [
  {
    name: "#general",
    slug: "general",
    description: "The main lobby. Introduce yourself, share ideas, or just hang out.",
    type: "public",
    order: 0,
  },
  {
    name: "#trades",
    slug: "trades",
    description: "Discuss trades, barter deals, and skill exchanges.",
    type: "public",
    order: 1,
  },
  {
    name: "#help",
    slug: "help",
    description: "Ask questions about the platform, contracts, or verification.",
    type: "public",
    order: 2,
  },
  {
    name: "#staff",
    slug: "staff",
    description: "Reach out to the Antidosis team. Support, feedback, or bug reports.",
    type: "staff",
    order: 3,
  },
];

async function main() {
  console.log("Seeding terminal channels...");

  for (const ch of CHANNELS) {
    await prisma.terminalChannel.upsert({
      where: { slug: ch.slug },
      update: {},
      create: ch,
    });
    console.log(`  ✓ ${ch.name}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
