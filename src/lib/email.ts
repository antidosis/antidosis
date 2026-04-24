import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Antidosis <noreply@antidosis.com>";

export async function sendOfferReceivedEmail(
  to: string,
  needTitle: string,
  offererName: string
) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `New offer on "${needTitle}"`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b;">You have a new offer</h2>
        <p><strong>${offererName}</strong> has offered to help with <strong>${needTitle}</strong>.</p>
        <p>Log in to review and accept their offer.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/needs" style="display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Offers</a>
      </div>
    `,
  });
}

export async function sendContractSignedEmail(
  to: string,
  needTitle: string,
  otherPartyName: string
) {
  if (!process.env.RESEND_API_KEY) return;

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
  if (!process.env.RESEND_API_KEY) return;

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
