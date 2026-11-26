// Seed the first-party "Antidosis" builder + the Wio Tracker L1 Pro listing.
// Idempotent: safe to re-run (upserts by name). Reads .env by parsing only.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const OWNER_EMAIL = process.argv[2] || "martinkhoury98@gmail.com";
const prisma = new PrismaClient();

const productData = {
  name: "Wio Tracker L1 Pro — MeshCore node, ready out of the box",
  category: "node",
  description:
    "A pocket MeshCore node that joins the NSW mesh network the moment you turn it on. " +
    "We flash it to YOUR mesh name on the Australia Mid profile (915.075 MHz, SF9) before " +
    "dispatch — unbox, charge, send your first message. No account with a telco, no " +
    "subscription, no phone signal needed.\n\n" +
    'nRF52840 + SX1262 radio, L76K GPS, 1.3" OLED, 2,000 mAh battery and case included. ' +
    "Each unit is inspected, charged to full and test-messaged on the local network before " +
    "it leaves the Central Coast.",
  specs:
    "Seeed Studio Wio Tracker L1 Pro · nRF52840 + SX1262 · L76K GPS (GPS/GLONASS/BDS) · " +
    '1.3" OLED · 2,000 mAh battery · 3D-printed case · USB-C charging · ' +
    "MeshCore firmware · Australia Mid profile (915.075 MHz, SF9)",
  priceAudCents: 8900,
  stockStatus: "in_stock",
  offerPostage: true,
  postageAudCents: 800,
  localPickup: true,
  postageNote: "Tracked Australia Post. Central Coast pickup available — arranged after payment.",
  paymentTerms: ["payid", "bank_transfer"],
  paymentNote: "Quote your order reference so we can match your transfer.",
  highlights: [
    "MeshCore pre-flashed",
    "Your name on it before it ships",
    "Australia Mid · 915.075 MHz",
    "2,000 mAh battery",
    "GPS built in",
    "First batch: 10 units",
  ],
  soldByAntidosis: true,
  stockCount: 10,
  images: [
    "/images/store/wio-tracker-hero.webp",
    "/images/store/wio-tracker-checklist.webp",
    "/images/store/wio-tracker-ports.webp",
    "/images/store/wio-tracker-l1-2.webp",
    "/images/store/wio-tracker-dimensions.webp",
  ],
};

// Made-to-order: we buy the unit when the customer pays, flash and test it
// ourselves, then ship AusPost. stockCount stays null (no shelf to run out of).
const repeaterData = {
  name: "SenseCAP P1-Pro — solar mesh repeater, mounted and on the air",
  category: "gateway",
  description:
    "A solar-powered MeshCore repeater that keeps your street, valley or worksite on the " +
    "air 24/7 — no mains power, no internet, no babysitting. Strap it to a pole or fix it " +
    "to a wall, and every mesh message in earshot gets a relay home.\n\n" +
    "Made to order: we buy your unit the day you pay, and when it lands with us we flash " +
    "it to the Australia Mid profile (915 MHz), name it, and test-message it on the live " +
    "Central Coast network before it ships to you. Allow 3–4 weeks door to door — the " +
    "listing graphics walk through exactly what happens and when.",
  specs:
    "Seeed SenseCAP Solar Node P1-Pro · nRF52840 + SX1262 (862–930 MHz, configured 915) · " +
    "5W solar panel · 18650 battery pack · L76K GPS · IP-rated enclosure · " +
    "pole/wall mount kit, clamp, antenna and cables included · MeshCore repeater firmware",
  priceAudCents: 25900,
  stockStatus: "made_to_order",
  offerPostage: true,
  postageAudCents: 0,
  localPickup: false,
  postageNote:
    "Free tracked Australia Post — delivery is 3–4 weeks total: ~2–3 weeks for your unit " +
    "to reach us, then flashing, testing and AusPost dispatch.",
  paymentTerms: ["payid", "bank_transfer"],
  paymentNote: "Quote your order reference so we can match your transfer.",
  highlights: [
    "Solar + battery — runs itself",
    "Australia Mid · 915 MHz",
    "Up to 9 km relay range",
    "Free postage",
    "3–4 weeks — ordered for you",
  ],
  soldByAntidosis: true,
  stockCount: null,
  images: [
    "/images/store/p1-pro-hero.webp",
    "/images/store/p1-pro-mto.webp",
    "/images/store/p1-pro-1.webp",
    "/images/store/p1-pro-3.webp",
    "/images/store/p1-pro-4.webp",
  ],
};

async function main() {
  const profile = await prisma.profile.findUnique({ where: { email: OWNER_EMAIL } });
  if (!profile) {
    console.error(`No profile found for ${OWNER_EMAIL}`);
    process.exit(1);
  }
  console.log(
    `owner: ${profile.fullName ?? profile.handle ?? profile.email} (${profile.memberCode})`
  );

  const builder = await prisma.meshBuilder.upsert({
    where: { profileId: profile.id },
    update: { status: "approved", businessName: "Antidosis" },
    create: {
      profileId: profile.id,
      businessName: "Antidosis",
      suburb: "Noraville NSW",
      website: "https://antidosis.com",
      description:
        "First-party Antidosis stock — seed units we hold, configure and ship ourselves. " +
        "Every unit is flashed to your mesh name on the Australia Mid profile, tested on the " +
        "local network and sent with a one-page start sheet.",
      status: "approved",
      reviewedAt: new Date(),
    },
  });
  console.log(`builder: ${builder.businessName} (${builder.status})`);

  for (const data of [productData, repeaterData]) {
    const existing = await prisma.meshProduct.findFirst({
      where: { builderId: builder.id, name: data.name },
    });
    if (existing) {
      const updated = await prisma.meshProduct.update({
        where: { id: existing.id },
        data,
      });
      console.log(
        `product updated: ${updated.name} — stock ${updated.stockCount ?? "made to order"}`
      );
    } else {
      const created = await prisma.meshProduct.create({
        data: { ...data, builderId: builder.id },
      });
      console.log(`product created: ${created.name}`);
      console.log(`product page: https://antidosis.com/store/product/${created.id}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
