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

// Made-to-order accessories & boards (AliExpress-sourced, MeshCore-capable).
// Flashed items include our connection service (MeshCore flash, Australia Mid
// profile, named, test-messaged); passive gear (antennas, batteries, cases,
// solar) ships as-is — nothing to flash. Prices absorb supplier shipping +
// AusPost; stockCount stays null (ordered when the customer pays).
const accessoryData = [
  {
    name: "Heltec WiFi LoRa 32 V3 — MeshCore dev board, flashed & ready",
    category: "board",
    description:
      'The board the MeshCore community runs on. ESP32-S3 + SX1262 with a 0.96" OLED, ' +
      "WiFi and Bluetooth — the cheapest honest way onto the mesh.\n\n" +
      "Connection service included: we flash MeshCore, set the Australia Mid profile " +
      "(915 MHz), name it, and test-message it on the live Coast network before it " +
      "ships. Add a case and battery from this store and you're field-ready.",
    specs:
      'Heltec WiFi LoRa 32 V3 · ESP32-S3FN8 + SX1262 · 0.96" OLED · WiFi + BLE 5.0 · ' +
      "SH1.25 battery connector · MeshCore firmware, Australia Mid profile",
    priceAudCents: 6900,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote:
      "Free tracked post — 2–4 weeks: ordered for you, flashed and tested before dispatch.",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: [
      "MeshCore flashed for you",
      "ESP32-S3 + SX1262",
      '0.96" OLED',
      "Australia Mid · 915 MHz",
    ],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/heltec-v3-hero.webp", "/images/store/heltec-v3-3.webp"],
  },
  {
    name: "RAK WisBlock starter kit — modular MeshCore board",
    category: "board",
    description:
      "The pro-grade modular path: RAK4631 (nRF52840 + SX1262) on a WisBlock base — " +
      "stack sensors, GNSS and IO modules as your build grows. Ultra-low power, the " +
      "favourite for solar repeaters and long-life nodes.\n\n" +
      "Connection service included: flashed to MeshCore, Australia Mid profile, named " +
      "and test-messaged before dispatch.",
    specs:
      "RAK WisBlock Meshtastic starter kit · RAK4631 core (nRF52840 + SX1262) · " +
      "modular WisBlock slots · MeshCore firmware, Australia Mid profile",
    priceAudCents: 7900,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote:
      "Free tracked post — 2–4 weeks: ordered for you, flashed and tested before dispatch.",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: [
      "Modular WisBlock",
      "nRF52840 + SX1262",
      "Ultra-low power",
      "MeshCore flashed for you",
    ],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/rak-starter-1.webp", "/images/store/rak-starter-2.webp"],
  },
  {
    name: "3000 mAh LiPo battery — Heltec / T114 drop-in",
    category: "power",
    description:
      "Genuine capacity 3000 mAh LiPo with the SH1.25 plug Heltec boards expect — " +
      "no soldering, no adapter. Roughly triples the runtime of the stock 800 mAh " +
      "pack on a Heltec V3.",
    specs: "3.7V 3000 mAh LiPo · SH1.25 connector · fits Heltec V3 / V4 / T114",
    priceAudCents: 3200,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote: "Free tracked post — 2–4 weeks (ordered for you).",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: ["3000 mAh genuine", "SH1.25 plug — no soldering", "Fits Heltec V3 / T114"],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/heltec-battery-1.webp"],
  },
  {
    name: "Folding 915 MHz whip antenna — SMA upgrade",
    category: "antenna",
    description:
      "A fold-flat 915 MHz whip that outperforms the stubby stock antennas on pocket " +
      "nodes. Folds sideways for a pocket, snaps upright for range. Tuned for the " +
      "Australian 915–928 MHz band.",
    specs: "915 MHz foldable whip · SMA connector · tuned for AU 915–928 MHz",
    priceAudCents: 1500,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote: "Free post (large letter) — 2–4 weeks (ordered for you).",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: ["Fold-flat pocket friendly", "915 MHz — AU legal", "SMA connector"],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/whip-antenna-3.webp", "/images/store/whip-antenna-2.webp"],
  },
  {
    name: "Outdoor omni antenna, 915 MHz — N-male base station whip",
    category: "antenna",
    description:
      "A proper outdoor omni for home bases and repeaters: weatherproof fibreglass-style " +
      "radome, N-male connector, tuned for 915 MHz. Mount it high, run good coax, and " +
      "watch your hop count change.",
    specs: "915/923 MHz outdoor omni · N-male · weatherproof radome",
    priceAudCents: 2900,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote: "Free tracked post — 2–4 weeks (ordered for you).",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: ["Outdoor rated", "N-male connector", "915 MHz — AU legal"],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/outdoor-antenna-hero.webp", "/images/store/outdoor-antenna-2.webp"],
  },
  {
    name: "D5 solar power kit — keep a Heltec node alive off-grid",
    category: "power",
    description:
      "5V solar panel, charge management and a four-slot 18650 battery holder in one " +
      "kit (batteries not included) — bolt it together with a Heltec board and case " +
      "and you have a self-sufficient outdoor node for the shed, the boat or the " +
      "fenceline.",
    specs:
      "D5 solar kit · 5V panel + charge management + battery holder · pairs with Heltec V3 / RAK nodes",
    priceAudCents: 10900,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote: "Free tracked post — 2–4 weeks (ordered for you).",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: ["Solar + charge management", "Pairs with Heltec / RAK", "Off-grid ready"],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/d5-solar-1.webp", "/images/store/d5-solar-2.webp"],
  },
  {
    name: "Heltec V3 case — colour options",
    category: "enclosure",
    description:
      "A snug snap-together case for the Heltec WiFi LoRa 32 V3 — protects the board, " +
      "keeps the OLED visible, and leaves the antenna and USB-C clear. Tell us your " +
      "colour in the order notes.",
    specs: "Case only · fits Heltec WiFi LoRa 32 V3 · colours on request",
    priceAudCents: 1500,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote: "Free post (large letter) — 2–4 weeks (ordered for you).",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: ["Fits Heltec V3", "OLED stays visible", "Colour options"],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/heltec-case-2.webp"],
  },
  {
    name: "Heltec V3 field kit — board, case & battery, flashed",
    category: "kit",
    description:
      "Everything a first node needs in one box: Heltec WiFi LoRa 32 V3, protective " +
      "case and 800 mAh battery.\n\n" +
      "Connection service included: we flash MeshCore, set the Australia Mid profile " +
      "(915 MHz), name it, and test-message it on the live Coast network — unbox, " +
      "charge, send your first message.",
    specs:
      "Heltec WiFi LoRa 32 V3 + case + 800 mAh battery · ESP32-S3 + SX1262 · " +
      "MeshCore firmware, Australia Mid profile",
    priceAudCents: 7500,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote:
      "Free tracked post — 2–4 weeks: ordered for you, flashed and tested before dispatch.",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: ["Board + case + battery", "MeshCore flashed for you", "Australia Mid · 915 MHz"],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/heltec-kit-1.webp", "/images/store/heltec-kit-2.webp"],
  },
  {
    name: "Heltec 4W solar outdoor node — IP67, flashed & tested",
    category: "gateway",
    description:
      "A budget-friendly outdoor relay: Heltec board, 4W solar panel, battery and " +
      "IP66 weatherproof enclosure, pre-assembled. Mount it on a post or fence and " +
      "your street gains a relay that runs itself.\n\n" +
      "Connection service included: flashed to MeshCore (repeater role on request), " +
      "Australia Mid profile, named and test-messaged before dispatch.",
    specs:
      "Heltec LoRa32 node + 4W solar + IP67 enclosure (4× 18650 slots, batteries not included) · SX1262 · " +
      "MeshCore firmware, Australia Mid profile",
    priceAudCents: 12900,
    stockStatus: "made_to_order",
    offerPostage: true,
    postageAudCents: 0,
    localPickup: false,
    postageNote:
      "Free tracked post — 3–4 weeks: ordered for you, flashed and tested before dispatch.",
    paymentTerms: ["payid", "bank_transfer"],
    paymentNote: "Quote your order reference so we can match your transfer.",
    highlights: [
      "Solar + IP67 — runs itself",
      "MeshCore flashed for you",
      "Australia Mid · 915 MHz",
    ],
    soldByAntidosis: true,
    stockCount: null,
    images: ["/images/store/heltec-solar-node-hero.webp", "/images/store/heltec-solar-node-2.webp"],
  },
];
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

  for (const data of [productData, repeaterData, ...accessoryData]) {
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
