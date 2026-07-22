// Repro: terminal need-post + image upload against the local dev server.
// Creates a throwaway test user/profile, then exercises the exact API calls
// the terminal wizard makes. Reads .env internally; prints no secrets.
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const env = {};
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();

const EMAIL = "terminal-repro@example.com";
const PASSWORD = "repro-pass-12345";

async function main() {
  // 1. Ensure auth user exists (email confirmed)
  let userId;
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === EMAIL);
  if (existing) {
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true });
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }
  console.log("user:", userId);

  // 2. Ensure profile with verified mobile
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: { mobileVerified: true, mobile: "+61400000001" },
    create: {
      userId,
      email: EMAIL,
      fullName: "Repro User",
      mobile: "+61400000001",
      mobileVerified: true,
    },
  });
  console.log("profile:", profile.id, "mobileVerified:", profile.mobileVerified);

  // 3. Sign in for a bearer token
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (signInErr) throw signInErr;
  const token = signIn.session.access_token;
  const auth = { Authorization: `Bearer ${token}` };

  // 4. Upload a tiny PNG (magic bytes + random payload)
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(2048, 7),
  ]);
  const form = new FormData();
  form.append("file", new File([png], "test.png", { type: "image/png" }));
  form.append("folder", "terminal");
  const upRes = await fetch(`${BASE}/api/v1/upload`, { method: "POST", headers: auth, body: form });
  const upBody = await upRes.text();
  console.log("UPLOAD:", upRes.status, upBody.slice(0, 300));

  // 5. Post a need with the uploaded image URL (mirrors terminal wizard)
  let imageUrl = null;
  try {
    imageUrl = JSON.parse(upBody).url ?? null;
  } catch {}
  const needBody = {
    title: "Repro need from script",
    description: "Testing the terminal need-post flow end to end.",
    offerType: "service",
    offerDescription: "A coffee and thanks",
    isLocal: true,
    locationName: "gosford_2250",
    requiredSkills: [],
    images: imageUrl ? [imageUrl] : [],
    offerImages: [],
    requiresContract: false,
  };
  const needRes = await fetch(`${BASE}/api/v1/needs`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(needBody),
  });
  const needText = await needRes.text();
  console.log("NEED POST:", needRes.status, needText.slice(0, 400));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("repro failed:", e.message);
  process.exit(1);
});
