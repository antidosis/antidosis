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

export async function sendContractCompletedEmail(
  to: string,
  needTitle: string
) {
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
