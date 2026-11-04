// Seed realistic demo data for Play Store screenshots + visual audit.
// Idempotent: safe to re-run. Reads .env by parsing only — secrets never printed.
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// ---- parse .env without logging values ----
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();

const log = (msg) => console.log(`  ${msg}`);

// ---- users ----
async function ensureUser(email, password, fullName) {
  // find existing
  let page = 1;
  let found = null;
  while (!found) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
    if (found || data.users.length < 200) break;
    page++;
  }
  if (found) {
    await supabase.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    log(`reused user ${email}`);
    return found.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser(${email}) failed: ${error.message}`);
  log(`created user ${email}`);
  return data.user.id;
}

// ---- storage images ----
async function uploadImage(remoteUrl, path) {
  const res = await fetch(remoteUrl, { redirect: "follow" });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, buf, {
      contentType: res.headers.get("content-type") || "image/jpeg",
      upsert: true,
    });
  if (error) {
    log(`  (image upload skipped: ${path} — ${error.message})`);
    return null;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("uploads").getPublicUrl(path);
  return publicUrl;
}

async function main() {
  console.log("Seeding demo data...");

  const mayaId = await ensureUser(
    "demo.centralcoast@antidosis.test",
    "DemoPass123!",
    "Maya Richardson"
  );
  const daveId = await ensureUser("dave.kowalski@antidosis.test", "DemoPass123!", "Dave Kowalski");
  const karenId = await ensureUser("karen.boyle@antidosis.test", "DemoPass123!", "Karen Boyle");
  const samId = await ensureUser("sam.tran@antidosis.test", "DemoPass123!", "Sam Tran");

  // ---- avatars ----
  const mayaAvatar = await uploadImage(
    "https://randomuser.me/api/portraits/women/68.jpg",
    `avatars/${mayaId}/avatar.jpg`
  );
  const daveAvatar = await uploadImage(
    "https://randomuser.me/api/portraits/men/32.jpg",
    `avatars/${daveId}/avatar.jpg`
  );
  const karenAvatar = await uploadImage(
    "https://randomuser.me/api/portraits/women/12.jpg",
    `avatars/${karenId}/avatar.jpg`
  );
  const samAvatar = await uploadImage(
    "https://randomuser.me/api/portraits/men/75.jpg",
    `avatars/${samId}/avatar.jpg`
  );

  // ---- profiles ----
  async function ensureProfile(userId, email, data) {
    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (existing) {
      await prisma.profile.update({ where: { id: existing.id }, data });
      log(`updated profile ${data.handle ?? email}`);
      return existing.id;
    }
    const created = await prisma.profile.create({ data: { userId, email, ...data } });
    log(`created profile ${data.handle ?? email}`);
    return created.id;
  }

  const maya = await ensureProfile(mayaId, "demo.centralcoast@antidosis.test", {
    handle: "maya_r",
    fullName: "Maya Richardson",
    bio: "Local for 12 years — happiest in the garden or restoring old furniture. Happy to help neighbours with plant cuttings, a spare set of hands, or whatever's going. Pay it forward, Central Coast!",
    avatarUrl: mayaAvatar,
    locationName: "Gosford NSW",
    latitude: -33.4247,
    longitude: 151.3436,
    mobile: "+61400100101",
    mobileVerified: true,
    isVerified: true,
    showInDirectory: true,
    ratingAvg: 9.5,
    ratingCount: 2,
    jobsCompleted: 4,
  });

  const dave = await ensureProfile(daveId, "dave.kowalski@antidosis.test", {
    handle: "dave_k",
    fullName: "Dave Kowalski",
    bio: "Ex-carpenter turned all-rounder. Ute, tools, and a trailer — no job too small around Gosford and Erina. Fair dinkum, on time, and I never leave a mess.",
    avatarUrl: daveAvatar,
    locationName: "East Gosford NSW",
    latitude: -33.4386,
    longitude: 151.357,
    mobile: "+61400100102",
    mobileVerified: true,
    isVerified: true,
    showInDirectory: true,
    ratingAvg: 9.7,
    ratingCount: 3,
    jobsCompleted: 11,
  });

  const karen = await ensureProfile(karenId, "karen.boyle@antidosis.test", {
    handle: "karen_b",
    fullName: "Karen Boyle",
    bio: "Avid gardener and chook keeper from Springfield. Always got eggs to spare and opinions on compost.",
    avatarUrl: karenAvatar,
    locationName: "Springfield NSW",
    mobile: "+61400100103",
    mobileVerified: true,
  });

  const sam = await ensureProfile(samId, "sam.tran@antidosis.test", {
    handle: "sam_t",
    fullName: "Sam Tran",
    bio: "Student at Ourimbah, handy with bikes and anything with wheels.",
    avatarUrl: samAvatar,
    locationName: "Ourimbah NSW",
    mobile: "+61400100104",
    mobileVerified: true,
  });

  // ---- skills ----
  async function ensureSkills(profileId, names) {
    for (const name of names) {
      const exists = await prisma.skill.findFirst({ where: { profileId, name } });
      if (!exists) await prisma.skill.create({ data: { profileId, name } });
    }
  }
  await ensureSkills(maya, ["Gardening", "Furniture Restoration"]);
  await ensureSkills(dave, ["Carpentry", "Furniture Moving", "Odd Jobs"]);

  // ---- credentials ----
  async function ensureCredential(profileId, data) {
    const exists = await prisma.credential.findFirst({
      where: { profileId, type: data.type, title: data.title },
    });
    if (!exists) {
      await prisma.credential.create({ data: { profileId, ...data } });
      log(`credential for ${profileId.slice(0, 6)}: ${data.title}`);
    }
  }
  await ensureCredential(maya, {
    type: "wwcc",
    title: "Working With Children Check",
    issuedBy: "NSW Office of the Children's Guardian",
    issuedAt: new Date(Date.now() - 400 * 86400_000),
    expiresAt: new Date(Date.now() + 330 * 86400_000),
    isPublic: true,
    isVerified: true,
  });
  await ensureCredential(dave, {
    type: "license",
    title: "NSW Contractor Licence",
    issuedBy: "NSW Fair Trading",
    issuedAt: new Date(Date.now() - 900 * 86400_000),
    isPublic: true,
    isVerified: true,
  });

  // ---- social links ----
  async function ensureSocials(profileId, links) {
    for (const link of links) {
      const exists = await prisma.socialLink.findFirst({
        where: { profileId, platform: link.platform },
      });
      if (!exists) await prisma.socialLink.create({ data: { profileId, ...link } });
    }
  }
  await ensureSocials(maya, [
    { platform: "instagram", url: "https://instagram.com/maya_r", isPublic: true },
    { platform: "facebook", url: "https://facebook.com/maya.richardson", isPublic: true },
  ]);
  await ensureSocials(dave, [
    { platform: "facebook", url: "https://facebook.com/dave.kowalski", isPublic: true },
  ]);

  // ---- need images ----
  const sofaImgs = [];
  for (let i = 1; i <= 3; i++) {
    const url = await uploadImage(
      `https://picsum.photos/seed/antidosis-sofa-${i}/800/600`,
      `needs/${mayaId}/sofa-${i}.jpg`
    );
    if (url) sofaImgs.push(url);
  }
  const washerImgs = [];
  for (let i = 1; i <= 2; i++) {
    const url = await uploadImage(
      `https://picsum.photos/seed/antidosis-washer-${i}/800/600`,
      `needs/${mayaId}/washer-${i}.jpg`
    );
    if (url) washerImgs.push(url);
  }

  // ---- needs ----
  async function ensureNeed(posterId, title, data) {
    const existing = await prisma.need.findFirst({ where: { posterId, title } });
    if (existing) {
      await prisma.need.update({ where: { id: existing.id }, data });
      log(`updated need: ${title}`);
      return existing.id;
    }
    const created = await prisma.need.create({ data: { posterId, title, ...data } });
    log(`created need: ${title}`);
    return created.id;
  }

  const sofaNeed = await ensureNeed(maya, "Help moving a sofa — offering $80", {
    description:
      "Bought a new (well, new-to-me) sofa and the old one needs to go from the lounge room out to the carport — one step down at the front, nothing crazy. Two people, 20 minutes max. I've got a trolley and straps. $80 cash on the spot, plus I'll shout you a coffee from the good place on Dane Drive.",
    needCategory: "paid-work",
    offerType: "money",
    offerDescription: "$80 cash + coffee",
    offerValue: 80,
    locationName: "Gosford NSW",
    latitude: -33.4247,
    longitude: 151.3436,
    status: "open",
    isLocal: true,
    deadline: new Date(Date.now() + 3 * 86400_000),
    timeRange: "This weekend, morning preferred",
    images: sofaImgs,
  });

  await ensureNeed(maya, "Looking for fresh backyard eggs — trade homemade jam", {
    description:
      "My chooks have officially gone on strike (fox got into the run last month, long story). Looking for a local with happy backyard chooks who'd swap half a dozen fresh eggs for a jar of my fig & ginger jam — made from the monster fig tree out the back. Gosford/Springfield area.",
    needCategory: "goods-swap",
    offerType: "item",
    offerDescription: "Homemade fig & ginger jam (450ml jar)",
    locationName: "Gosford NSW",
    isLocal: true,
    status: "open",
  });

  await ensureNeed(maya, "Need a ride to Erina Fair Thursday — $20 + coffee", {
    description:
      "My car's in the shop until Friday and I've got a dentist appointment near Erina Fair around 10am Thursday. Anyone heading that way? $20 for your trouble plus a coffee, and happy to chat or sit quietly, your call.",
    needCategory: "paid-work",
    offerType: "money",
    offerDescription: "$20 + coffee",
    offerValue: 20,
    locationName: "Gosford NSW",
    isLocal: true,
    status: "open",
    deadline: new Date(Date.now() + 2 * 86400_000),
    timeRange: "Thursday ~9:30am",
  });

  await ensureNeed(maya, "Fence post replacement — swap for garden help", {
    description:
      "Two fence posts along the back boundary have rotted through and the whole run is starting to lean. Posts and concrete are here — I just need someone who knows which end of a post-hole digger is which. Happy to swap a full day of garden help (weeding, mulching, whatever you need) in return.",
    needCategory: "skill-swap",
    offerType: "service",
    offerDescription: "A day of garden help — weeding, mulching, planting",
    locationName: "Gosford NSW",
    isLocal: true,
    status: "open",
  });

  await ensureNeed(maya, "Borrow a pressure washer — will return with cookies", {
    description:
      "The deck is green enough to be a chia pet. Anyone near Gosford got a pressure washer I could borrow for an afternoon? I'll return it cleaner than I got it, with a batch of choc-chip cookies as a thank you. References available (my neighbours like me, promise).",
    needCategory: "borrow-lend",
    offerType: "item",
    offerDescription: "Fresh-baked choc-chip cookies",
    locationName: "Gosford NSW",
    isLocal: true,
    status: "open",
    images: washerImgs,
  });

  const sideboardNeed = await ensureNeed(
    maya,
    "Restore a mid-century sideboard — swap for jam + plants",
    {
      description:
        "Picked up a beautiful old sideboard at the Vinnies in Wyong and it's got great bones but the veneer is lifting in a few spots and the legs need a sand. Looking for someone who loves a furniture restoration project. Offering jars of homemade jam, plant cuttings from the garden, or both!",
      needCategory: "goods-for-skills",
      offerType: "item",
      offerDescription: "Homemade jam + plant cuttings",
      locationName: "Gosford NSW",
      isLocal: true,
      status: "completed",
    }
  );

  // ---- acceptance: Dave on the sofa need ----
  let acceptance = await prisma.acceptance.findFirst({
    where: { needId: sofaNeed, userId: dave },
  });
  if (!acceptance) {
    acceptance = await prisma.acceptance.create({
      data: {
        needId: sofaNeed,
        userId: dave,
        message:
          "G'day Maya — I've got a ute, straps and a trolley. Done this a hundred times. Saturday morning work for you?",
        status: "accepted",
        fulfillerMarkedComplete: false,
        posterMarkedComplete: false,
      },
    });
    log("created acceptance (Dave → sofa need)");
  }

  // ---- need messages (public thread + private) ----
  async function ensureMessage(needId, senderId, content, acceptanceId = null, isRead = true) {
    const existing = await prisma.needMessage.findFirst({
      where: { needId, senderId, content },
    });
    if (!existing) {
      await prisma.needMessage.create({
        data: { needId, senderId, content, acceptanceId, isRead },
      });
    }
  }
  await ensureMessage(
    sofaNeed,
    maya,
    "Hi all — the sofa's a standard 3-seater, about 90kg. Front step is the only tricky bit. Straps and trolley provided!"
  );
  await ensureMessage(
    sofaNeed,
    dave,
    "G'day Maya — I've got a ute, straps and a trolley. Done this a hundred times. Saturday morning work for you?"
  );
  await ensureMessage(
    sofaNeed,
    maya,
    "Saturday's perfect. Say 9am? I'll have the coffee order ready."
  );
  await ensureMessage(
    sofaNeed,
    karen,
    "If Dave falls through, my son's home from uni and has nothing but time. Good luck!"
  );
  await ensureMessage(
    sofaNeed,
    maya,
    "Thanks Karen! Dave's locked in for Saturday — but I might take you up on help with the fence posts next weekend."
  );
  await ensureMessage(sofaNeed, dave, "Saturday 9am locked in. See you then!", acceptance.id);
  await ensureMessage(
    sofaNeed,
    maya,
    "Legend. Address is 14 Hely St — the place with the overgrown lavender out front.",
    acceptance.id
  );

  // ---- contract (active) between Maya and Dave on the sofa need ----
  const existingContract = await prisma.contract.findFirst({
    where: { needId: sofaNeed, partyAId: maya, partyBId: dave },
  });
  if (!existingContract) {
    await prisma.contract.create({
      data: {
        needId: sofaNeed,
        acceptanceId: acceptance.id,
        partyAId: maya,
        partyBId: dave,
        terms:
          "Dave helps Maya move one 3-seater sofa from the lounge room to the carport on Saturday morning, 9am. Maya provides trolley and straps. Payment of $80 in cash plus one coffee is made on completion.",
        partyATerms:
          "I'll have everything cleared off the sofa and the path to the front door ready before you arrive.",
        partyBTerms: "I'll bring the ute, straps and trolley. Allow about half an hour all up.",
        deadlineTerms: "Saturday 9am, done by 9:45am at the latest.",
        completionMethodTerms: "Sofa in the carport, $80 cash handed over on the spot.",
        partyAUseMessageTerms: false,
        partyBUseMessageTerms: false,
        partyASubmittedAt: new Date(Date.now() - 2 * 86400_000),
        partyBSubmittedAt: new Date(Date.now() - 2 * 86400_000 + 3600_000),
        partyAAgreedAt: new Date(Date.now() - 2 * 86400_000 + 7200_000),
        partyBAgreedAt: new Date(Date.now() - 2 * 86400_000 + 7500_000),
        termsLockedAt: new Date(Date.now() - 2 * 86400_000 + 7500_000),
        partyASignedAt: new Date(Date.now() - 86400_000),
        partyBSignedAt: new Date(Date.now() - 86400_000 + 1800_000),
        partyASignature: "Maya Richardson",
        partyBSignature: "Dave Kowalski",
        status: "active",
      },
    });
    log("created contract (active, Maya ↔ Dave, sofa need)");
  }

  // ---- reviews ----
  async function ensureReview({
    giverId,
    receiverId,
    rating,
    comment,
    contractId = null,
    acceptanceId = null,
  }) {
    const existing = await prisma.review.findFirst({
      where: { giverId, receiverId, rating, comment },
    });
    if (!existing) {
      await prisma.review.create({
        data: { giverId, receiverId, rating, comment, contractId, acceptanceId },
      });
      log(`review ${rating}★ for receiver ${receiverId.slice(0, 6)}`);
    }
  }
  // Dave's reviews (ratings are on a 1–10 scale)
  await ensureReview({
    giverId: maya,
    receiverId: dave,
    rating: 10,
    comment:
      "Dave showed up at 8:55am with straps, a trolley and a grin. Sofa was out in 15 minutes and he even helped me reposition the new one. Absolute legend — don't hesitate.",
  });
  await ensureReview({
    giverId: karen,
    receiverId: dave,
    rating: 10,
    comment:
      "Fixed our gate that three other people said couldn't be saved. Tidy worker, fair price, lovely chat.",
  });
  await ensureReview({
    giverId: sam,
    receiverId: dave,
    rating: 9,
    comment:
      "Moved a fridge down a flight of stairs without a single mark on the wall. Only gripe: he talks more than he quotes jobs, so book extra time for the yarn. Would hire again.",
  });
  // Maya's reviews
  await ensureReview({
    giverId: dave,
    receiverId: maya,
    rating: 10,
    comment:
      "Maya's exactly what this site is for. Clear about the job, had everything ready, and the coffee was genuinely good. The jam she threw in was a bonus!",
  });
  await ensureReview({
    giverId: karen,
    receiverId: maya,
    rating: 9,
    comment:
      "Swapped eggs for her fig jam and I've been thinking about it for a week. Garden tips thrown in for free.",
  });

  // ---- terminal channels + messages ----
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
  for (const ch of CHANNELS) {
    await prisma.terminalChannel.upsert({ where: { slug: ch.slug }, update: {}, create: ch });
  }

  const general = await prisma.terminalChannel.findUnique({ where: { slug: "general" } });
  const trades = await prisma.terminalChannel.findUnique({ where: { slug: "trades" } });

  async function ensureTerminalMessage(channelId, senderId, content, hoursAgo) {
    const existing = await prisma.terminalMessage.findFirst({
      where: { channelId, senderId, content },
    });
    if (!existing) {
      await prisma.terminalMessage.create({
        data: {
          channelId,
          senderId,
          content,
          createdAt: new Date(Date.now() - hoursAgo * 3600_000),
        },
      });
    }
  }

  const msgCount = await prisma.terminalMessage.count({ where: { channelId: general.id } });
  if (msgCount < 8) {
    await ensureTerminalMessage(
      general.id,
      dave,
      "Morning all — anyone know a good spot for cheap mulch around Gosford?",
      26
    );
    await ensureTerminalMessage(
      general.id,
      maya,
      "The landscaping place on Mann St does a 'you load, you take' deal on Fridays. Grab a trailer!",
      25
    );
    await ensureTerminalMessage(
      general.id,
      karen,
      "Can confirm, did it last week. Two trailer loads for $40.",
      24
    );
    await ensureTerminalMessage(
      general.id,
      sam,
      "Also the tip shop sometimes has free mulch if you don't mind the odd weed in it",
      22
    );
    await ensureTerminalMessage(general.id, dave, "Friday it is then. Cheers legends.", 21);
    await ensureTerminalMessage(
      general.id,
      maya,
      "PSA: my fig tree is going OFF this year. Jam swaps open for business 🍯",
      8
    );
    await ensureTerminalMessage(
      general.id,
      karen,
      "I'll take two jars. Can trade eggs AND a jar of my chilli jam?",
      7
    );
    await ensureTerminalMessage(general.id, maya, "Deal. You drive a hard bargain Karen 😄", 6);
    log("seeded #general messages");
  }

  const tradesCount = await prisma.terminalMessage.count({ where: { channelId: trades.id } });
  if (tradesCount < 4) {
    await ensureTerminalMessage(
      trades.id,
      dave,
      "Offering: Saturday arvo fence post jobs around East Gosford. Happy to trade for garden labour or cash, whatever suits.",
      10
    );
    await ensureTerminalMessage(
      trades.id,
      maya,
      "Sent you a message about my back fence — two posts gone. Reckon it's a 3-hour job?",
      9
    );
    await ensureTerminalMessage(
      trades.id,
      dave,
      "2 posts, concrete's already there? Hour and a half tops. Swing by Saturday after the sofa job?",
      9
    );
    await ensureTerminalMessage(trades.id, maya, "Perfect. I'll have the kettle on.", 8);
    log("seeded #trades messages");
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
