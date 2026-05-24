# Antidosis Production Launch Checklist

## 1. GoDaddy DNS → Vercel (Custom Domain)

Log into [GoDaddy DNS Management](https://dcc.godaddy.com/manage/antidosis.com/dns) for `antidosis.com` and add:

| Type  | Name | Value                | TTL |
| ----- | ---- | -------------------- | --- |
| A     | @    | 76.76.21.21          | 600 |
| CNAME | www  | cname.vercel-dns.com | 600 |

Then in [Vercel Dashboard](https://vercel.com/dashboard):

1. Select project `antidosis`
2. Go to **Settings → Domains**
3. Add `antidosis.com` and `www.antidosis.com`
4. Vercel will detect the DNS records and issue an SSL certificate automatically

**Status:** Vercel already aliased the deployment. DNS propagation takes 5–60 minutes.

---

## 2. Resend (Free Email Provider) — 100 emails/day

Resend sends transactional emails from your domain (e.g. `noreply@antidosis.com`).

### 2a. Sign up & add domain

1. Go to [resend.com](https://resend.com) → sign up (free)
2. Go to **Domains → Add Domain**
3. Enter `antidosis.com`
4. Resend will show DNS records (DKIM, SPF, DMARC) to add

### 2b. Add Resend DNS records to GoDaddy

Copy the DNS records from Resend and add them in GoDaddy DNS:

| Type | Name               | Value                                    | TTL  |
| ---- | ------------------ | ---------------------------------------- | ---- |
| TXT  | \_dmarc            | `v=DMARC1; p=quarantine; rua=mailto:...` | 3600 |
| TXT  | [resend-dkim-name] | `[resend-dkim-value]`                    | 3600 |
| TXT  | @                  | `v=spf1 include:...`                     | 3600 |

_Exact values are shown in your Resend dashboard._

### 2c. Verify domain in Resend

Click "Verify" in Resend. It may take a few minutes.

### 2d. Get API key

1. In Resend, go to **API Keys → Create API Key**
2. Name it `antidosis-prod`
3. Copy the key (starts with `re_`)

### 2e. Set API key on Vercel

```bash
vercel env add RESEND_API_KEY production
# paste the real key when prompted
```

Or via Vercel Dashboard → Project → Settings → Environment Variables.

---

## 3. Supabase Auth — Custom SMTP + Email Verification

Supabase sends verification emails. By default they come from `@supabase.co`. To use your domain:

### 3a. Enable Confirm Email

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication → Providers → Email**
3. Toggle **Confirm email** ON
4. Set **Site URL** to `https://antidosis.com`
5. In **Redirect URLs**, add:
   - `https://antidosis.com/**`
   - `https://antidosis.com/login`

### 3b. Configure Custom SMTP (uses Resend)

1. **Project Settings → Auth → Email → SMTP**
2. Toggle **Enable Custom SMTP**
3. Fill in:
   - **Host:** `smtp.resend.com`
   - **Port:** `587`
   - **Username:** `resend`
   - **Password:** your Resend API key (same as `RESEND_API_KEY`)
   - **Sender Name:** `Antidosis`
   - **Sender Email:** `noreply@antidosis.com`
4. Save

### 3c. Customize email templates (optional)

In **Authentication → Email Templates**, update:

- **Confirm signup** subject: `Verify your Antidosis account`
- **Magic Link** subject: `Your Antidosis login link`
- Replace `{{ .SiteURL }}` with `https://antidosis.com` in template URLs

---

## 4. Environment Variables Summary

| Variable                        | Current Value           | Action Needed         |
| ------------------------------- | ----------------------- | --------------------- |
| `NEXT_PUBLIC_APP_URL`           | `https://antidosis.com` | ✅ Done               |
| `APP_URL`                       | `https://antidosis.com` | ✅ Done               |
| `RESEND_API_KEY`                | placeholder             | Replace with real key |
| `STRIPE_SECRET_KEY`             | placeholder             | Replace for payments  |
| `STRIPE_WEBHOOK_SECRET`         | placeholder             | Replace for payments  |
| `STRIPE_PRICE_ID`               | placeholder             | Replace for payments  |
| `DATABASE_URL`                  | set                     | ✅ Done               |
| `SUPABASE_SERVICE_ROLE_KEY`     | set                     | ✅ Done               |
| `NEXT_PUBLIC_SUPABASE_URL`      | set                     | ✅ Done               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | set                     | ✅ Done               |

---

## 5. Post-Deploy Verification

After completing steps 1–3 and redeploying, verify:

```bash
# 1. Custom domain resolves
curl -I https://antidosis.com

# 2. Email verification works
# Register a new account → check inbox for verification email
# Email should come from noreply@antidosis.com

# 3. HTTPS + security headers
curl -I https://antidosis.com
# Check for: Strict-Transport-Security, X-Frame-Options, etc.

# 4. Protected routes block unverified users
# Try accessing /needs while logged in with unverified email
# Should redirect to /verify-email
```

---

## 6. Security Hardening (Already Done)

- ✅ Email verification enforced on all protected routes
- ✅ Rate limiting on API endpoints
- ✅ CORS origin validation
- ✅ Input sanitization (DOMPurify)
- ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Auth-derived posterId (no client trust)
- ✅ Profile creation ownership verification
- ✅ Structured JSON logging
- ✅ `.gitignore` for sensitive files

---

## Quick Commands

```bash
# Deploy latest
vercel --prod

# View env vars
vercel env ls

# View production logs
vercel logs --production
```
