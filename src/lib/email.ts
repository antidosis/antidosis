import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;
const isPlaceholder = !API_KEY || API_KEY.includes("placeholder") || API_KEY.includes("test");

const resend = isPlaceholder ? null : new Resend(API_KEY);

const FROM_EMAIL = "Antidosis <noreply@antidosis.com>";

// Resend free tier: 100 emails/day, 3,000/month
// To verify domain: add DNS records from Resend dashboard to GoDaddy
// To configure Supabase Auth SMTP: Project Settings > Auth > Email > SMTP

function checkResendReady() {
  if (isPlaceholder) {
    console.warn("[email] RESEND_API_KEY is not configured. Emails will not be sent.");
    return false;
  }
  return true;
}

export async function sendInterestReceivedEmail(
  to: string,
  needTitle: string,
  interestedName: string
) {
  if (!checkResendReady() || !resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Someone is interested in your need: "${needTitle}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">Someone is interested in your need</h2>
        <p><strong>${interestedName}</strong> is interested in your need <strong>${needTitle}</strong>.</p>
        <p>Log in to review their profile and message.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/needs" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Interest</a>
      </div>
    `,
  });
}

export async function sendInterestAcceptedEmail(
  to: string,
  needTitle: string,
  posterName: string,
  needId?: string
) {
  if (!checkResendReady() || !resend) return;

  const url = needId
    ? `${process.env.NEXT_PUBLIC_APP_URL}/needs/${needId}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/needs`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your interest was accepted: ${needTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">Your interest was accepted</h2>
        <p><strong>${posterName}</strong> has accepted your interest in <strong>${needTitle}</strong>.</p>
        <p>The poster will now form a contract draft with you.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Need</a>
      </div>
    `,
  });
}

export async function sendContractFormedEmail(
  to: string,
  needTitle: string,
  otherPartyName: string,
  contractId?: string
) {
  if (!checkResendReady() || !resend) return;

  const url = contractId
    ? `${process.env.NEXT_PUBLIC_APP_URL}/contracts/${contractId}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/needs`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Contract formed: ${needTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">A contract has been formed</h2>
        <p>A contract between you and <strong>${otherPartyName}</strong> has been formed for <strong>${needTitle}</strong>.</p>
        <p>Review the terms, add your own, and agree to proceed.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Contract</a>
      </div>
    `,
  });
}

export async function sendContractSignReminderEmail(
  to: string,
  needTitle: string,
  requesterName: string,
  contractId?: string
) {
  if (!checkResendReady() || !resend) return;

  const url = contractId
    ? `${process.env.NEXT_PUBLIC_APP_URL}/contracts/${contractId}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/needs`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Reminder: please sign the contract for ${needTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">Waiting for your signature</h2>
        <p><strong>${requesterName}</strong> has signed the contract for <strong>${needTitle}</strong> and is waiting for you.</p>
        <p>Please log in to review and sign the contract.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Sign Contract</a>
      </div>
    `,
  });
}

export async function sendContractSignedEmail(
  to: string,
  needTitle: string,
  otherPartyName: string
) {
  if (!checkResendReady() || !resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Contract active: ${needTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">Contract is now active</h2>
        <p>Both you and <strong>${otherPartyName}</strong> have signed the contract for <strong>${needTitle}</strong>.</p>
        <p>You can now begin work and communicate through the contract page.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/needs" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Contracts</a>
      </div>
    `,
  });
}

export async function sendContractCompletedEmail(to: string, needTitle: string) {
  if (!checkResendReady() || !resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Contract completed: ${needTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">Contract completed</h2>
        <p>The contract for <strong>${needTitle}</strong> has been marked complete by both parties.</p>
        <p>Please leave a review to help build trust in the community.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/needs" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Leave Review</a>
      </div>
    `,
  });
}

const MESH_INTEREST_COPY: Record<string, { subject: string; heading: string; body: string }> = {
  node: {
    subject: "You're on the list for the Antidosis node",
    heading: "Node pilot interest received",
    body: "We'll email you the moment pilot batch pricing and availability are confirmed. Expressing interest is free and is not an order.",
  },
  byo_device: {
    subject: "Your device can join the Antidosis mesh",
    heading: "Channel access interest received",
    body: "We'll send setup guidance for your 915 MHz device and explain how channel access works for verified members.",
  },
  updates: {
    subject: "Mesh network updates — you're subscribed",
    heading: "You're subscribed to mesh updates",
    body: "Occasional updates on the Antidosis mesh: pilot progress, range-test results and how to get connected.",
  },
};

export async function sendMeshInterestConfirmationEmail(to: string, kind: string) {
  if (!checkResendReady() || !resend) return;

  const copy = MESH_INTEREST_COPY[kind] ?? MESH_INTEREST_COPY.updates;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: copy.subject,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">${copy.heading}</h2>
        <p>${copy.body}</p>
        <p style="color: #71717a; font-size: 14px;">When the internet stops, the mesh doesn't.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/store" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Visit the mesh store</a>
      </div>
    `,
  });
}

export async function sendMeshBuilderApplicationEmail(to: string, businessName: string) {
  if (!checkResendReady() || !resend || !to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Mesh builder application received",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">Application received: ${businessName}</h2>
        <p>We review builder applications manually &mdash; hardware specifications, range-test evidence and buyer support terms. You can add products to your shelf once the application is approved.</p>
        <p>Track your application status from your dashboard under Mesh store.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=mesh-store" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View application</a>
      </div>
    `,
  });
}
