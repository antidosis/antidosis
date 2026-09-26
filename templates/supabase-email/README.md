# Supabase Email Templates

Copy the HTML from each file into your Supabase dashboard:
**Authentication → Email Templates**

## Subject Lines

| Template             | Subject                            |
| -------------------- | ---------------------------------- |
| Confirm signup       | `Confirm your Antidosis account`   |
| Invite user          | `You've been invited to Antidosis` |
| Magic Link           | `Log in to Antidosis`              |
| Change Email Address | `Confirm your new email address`   |
| Reset Password       | `Reset your Antidosis password`    |

## How to apply

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your Antidosis project
3. Go to **Authentication → Email Templates**
4. For each template, paste the HTML into the body field
5. Set the subject line from the table above
6. Click **Save** for each template

## Notes

- The logo is loaded from `{{ .SiteURL }}/images/logo.png` — make sure your Site URL is set to `https://antidosis.com`
- The templates use the Alchemist's Terminal color palette (dark bronze background, gold accents)
- All CTAs use lowercase text to match the site's terminal aesthetic
- Footer reads "Antidosis — A marketplace for reciprocal exchange"
- The templates link directly to the app's `/auth/confirm` route using `{{ .TokenHash }}` (not `{{ .ConfirmationURL }}`). This is deliberate: the PKCE `ConfirmationURL` flow breaks whenever the email is opened in a different browser or mail app than the one used to sign up ("PKCE code verifier not found"). The token_hash flow works anywhere — the route calls `verifyOtp` server-side and logs the user in.
