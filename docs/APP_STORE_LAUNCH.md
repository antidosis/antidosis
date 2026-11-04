# Apple App Store Launch Guide — Antidosis

Companion to the Google Play submission (Play assets/answers in `playstore-graphics/` and prior session notes). Apple assets in `appstore-graphics/`.

---

## 1. App Store Connect — App Information

| Field              | Value                                       |
| ------------------ | ------------------------------------------- |
| Name (30)          | `Antidosis: Local Barter Trade` (29 chars)  |
| Subtitle (30)      | `Trade skills & favours locally` (30 chars) |
| Bundle ID          | `com.antidosis.app`                         |
| Primary category   | **Lifestyle**                               |
| Secondary category | **Social Networking**                       |
| Content Rights     | Does **not** contain third-party content    |
| Age Rating         | **4+** (questionnaire answers in §5)        |

## 2. Pricing

Free. No IAP to configure (billing stack is parked). If Apple asks about "Premium" anywhere: there is nothing to declare.

## 3. Listing copy (paste-ready)

### Promotional text (170 max — can be updated without a new release)

```
The Central Coast's local exchange. Post a need, offer a trade, and swap skills, items and favours with verified neighbours. Free to join.
```

(138 chars)

### Keywords (100 max — comma-separated, NO spaces, no competitor/Apple terms)

```
barter,trade,swap,local marketplace,skills exchange,neighbourhood,favours,jobs,community,tools
```

(94 chars)

### Description (4000 max)

```
Antidosis is the local exchange network for the Central Coast, NSW. Post what you need, say what you'll give back, and trade skills, items and favours with verified locals — no middlemen, no hidden fees, no strangers.

HELP A NEIGHBOUR. GET WHAT YOU NEED.
Need a hand moving a sofa? Fresh eggs from a backyard coop? A lift to Erina Fair? Post a need in under a minute and reach every verified local nearby. Offer money, an item, or your own skills in return — barter and trade on your own terms.

HOW IT WORKS
1. POST — Say what you need and what you'll offer in exchange: money, an item, or a skill.
2. CONNECT — Verified locals respond. Chat in public threads or privately, compare offers, ask questions.
3. EXCHANGE — Meet up, get it done, leave a review. Big job? Seal it with an in-app contract first.

WHAT YOU CAN TRADE
• SERVICES — gardening, cleaning, tutoring, furniture repair, dog walking, web help
• ITEMS — tools, plants, eggs, jam, furniture, second-hand goods
• MONEY — paid work, odd jobs, hiring a local for a fair rate
• SWAPS — barter goods for goods, skills for skills, favours for favours
• BORROW & LEND — pressure washers, trailers, ladders, camping gear

BROWSE & EXCHANGE
• Browse needs near you and filter by skill, category and exchange type
• Search the local marketplace for services, items, paid work, swaps, and borrowing or lending
• Express interest with a message and work out the details openly
• Optional contracts lock in terms before anyone lifts a finger — fair deals, sealed

TRADE WITH PEOPLE YOU CAN TRUST
• Identity and mobile verification for every participant — no ghosts, no throwaway accounts
• Public profiles with permanent @handles, star ratings and reviews that follow every member
• Every completed exchange builds your local reputation
• Public and private message threads keep every deal on the record
• Report and block tools keep the community clean

THE LOCAL WIRE (RELAY)
Jump into neighbourhood channels and direct messages. Ask for recommendations, organise swaps, or just hear what's moving on the Coast — a community mesh radio built straight into the app.

WHO IT'S FOR
• Homeowners with a to-do list and a garage full of things gathering dust
• Tradies and hobbyists turning spare hours into local goodwill — or income
• Parents swapping babysitting, toys, and hand-me-downs
• Students trading tutoring, tech help and moving muscle
• Retirees with skills, tools and time to share
• Anyone who'd rather borrow from a neighbour than buy new

WHY PEOPLE SWITCH TO ANTIDOSIS
• A true barter marketplace — swap goods for services, skills for favours, money for time
• Local first — every exchange is inside your community, so trades actually happen
• Free for everyday use — the core exchange costs nothing
• Reputation-based trust, not anonymous classifieds
• Contracts and reviews turn neighbours into reliable trading partners
• Works like a neighbourhood exchange, a skills swap, a tool library and a local job board in one

MADE FOR THE CENTRAL COAST
From Gosford to Wyong, Terrigal to Woy Woy — Antidosis is built for Australian neighbourhoods, starting with the Central Coast NSW pilot. Local marketplace, community exchange and neighbourhood network in one — post a need today and watch a neighbour answer.

Whether you want to barter, trade items, swap services, borrow tools, lend a hand, buy nothing new, or earn a little locally — this is your exchange.

antidosis (n.) — the exchange of help. Reciprocity, built in.

GOOD TO KNOW
• Free to join, free to post, free to trade — no commission on your exchanges
• Your contact details stay private until you choose to share them
• Delete your account any time from Profile → Delete Account
• Built in Australia, for Australian communities — and shaped by pilot feedback

Join the pilot. Bring a spare hand.
```

### URLs

- Privacy Policy URL: `https://antidosis.com/privacy` (live, mentions Martin Khoury trading as antidosis ABN 96 557 008 393)
- Support URL: `https://antidosis.com` (or `/privacy` until a dedicated support page exists)
- Marketing URL: `https://antidosis.com`

## 4. Screenshots & icon (files in `appstore-graphics/`)

| Slot                                       | Required size                                             | Files                                    |
| ------------------------------------------ | --------------------------------------------------------- | ---------------------------------------- |
| iPhone 6.9" (REQUIRED)                     | 1290×2796                                                 | `appstore-graphics/iphone-6_9/01–08.png` |
| iPhone 6.5"                                | 1242×2688                                                 | `appstore-graphics/iphone-6_5/01–08.png` |
| iPad 12.9"/13" (REQUIRED for iPad support) | 2048×2732                                                 | `appstore-graphics/ipad-12_9/01–08.png`  |
| iPad 11"                                   | 1668×2388                                                 | `appstore-graphics/ipad-11/01–08.png`    |
| App icon                                   | 1024×1024 PNG, **no alpha**, square (Apple masks corners) | `appstore-graphics/icon-1024.png`        |

Notes:

- The 6.9" set serves all modern iPhones; upload 6.5" too so iPhone XS Max/11 Pro Max get native shots instead of scaled ones.
- iPad screenshots are required because the app targets iPad (`TARGETED_DEVICE_FAMILY = 1,2`). If you ever want to skip iPad, set the device family to iPhone-only first.
- At least 3 screenshots per size recommended; we have 8.

## 5. Questionnaire answers

### Age rating (App Store Connect questionnaire)

Answer **No** to all unless noted. Result: **4+**.

- Violence / sexual content / drugs / gambling / horror / profanity: **No** everywhere.
- Medical/health treatment info: **No**.
- Simulated gambling: No.
- "Does your app allow users to freely access or share user-generated content (UGC)?" → **Yes** (needs/reviews/messages). This alone does not raise the rating, but must be Yes for honesty — there is no "restricted web access" follow-up that raises 4+.
- "Does your app allow users to share their location with other users?" → **Yes** — profiles show an approximate suburb only (never GPS coordinates). This does not raise a 4+ rating.
- Web content access: No unrestricted web access (no in-app browser to the open web).

### Export compliance

- "Does your app use encryption?" → **Yes** (HTTPS/TLS only).
- Immediately qualifies for the **exemption under US EAR §740.17(b)(1)** (standard app encryption, HTTPS to your own server). In App Store Connect: check **"Exempt"** and answer that it only uses encryption exempt per 5.2.1/740.17(b). No CCATS filing needed.

### App privacy (nutrition labels)

**Tracking: NO** (no data leaves to third parties for advertising/tracking — Firebase Crashlytics/Analytics data goes to Google only for app functionality/diagnostics; that is not "tracking" under Apple's definition, and we declare it below anyway).

Data collected and **linked to the user's identity**:

| Data category | Detail                                                                |
| ------------- | --------------------------------------------------------------------- |
| Contact Info  | Name, Email Address, Phone Number                                     |
| User Content  | Photos or Videos, Other User Content (bios, needs, messages, reviews) |
| Identifiers   | User ID, Device ID                                                    |
| Diagnostics   | Crash Data                                                            |
| Location      | Coarse Location                                                       |

Each of the above: collected, linked to identity, used for app functionality (diagnostics item: also crash analysis). Nothing listed under "Data not linked to you".

This maps 1:1 with the Google Play Data safety declaration already submitted — keep them consistent.

### Review information (paste into Review Notes)

```
DEMO ACCOUNT (pre-verified — use this to review):
Email: demo.centralcoast@antidosis.test
Password: DemoPass123!

Verification gates: posting needs, messaging, and expressing interest require email + Australian mobile verification. The demo account is pre-verified so no OTP is needed. The app's geographic scope is the Central Coast NSW, Australia — suburb names from Gosford to Wyong are in the data set.

Account deletion is available in-app at Profile → Delete Account (permanent, deletes the auth account and scrubs PII). Privacy policy: https://antidosis.com/privacy
```

**Sign-In required for review: YES** — provide the demo credentials above.

## 6. Account & data deletion requirements — compliance status

- ✅ **In-app account deletion** (Apple hard requirement since 2022): Profile → Delete Account → confirm → calls `DELETE /api/v1/profiles/me`, which cancels any subscriptions, scrubs PII, anonymizes the profile tombstone, deletes the Supabase auth user, and signs the device out.
- ✅ Privacy policy URL live with deletion instructions (`/privacy`, "How to delete your account" section).
- ✅ Data deletion on request without account deletion: documented at `/privacy` (contact email).

## 7. Building & uploading the iOS app

iOS builds **require macOS + Xcode** (not possible on this Windows machine). Version already bumped: **MARKETING_VERSION 1.0.15 / build 18** in `mobile/ios/App/App.xcodeproj/project.pbxproj` (aligned with Android code 18).

On a Mac (or a GitHub Actions `macos-14` runner):

```bash
cd mobile
npm ci
npm run build            # Vite production build → mobile/dist
npx cap sync ios         # copy web assets + plugins into ios/
cd ios/App
# Open App.xcworkspace in Xcode:
# 1. Signing & Capabilities → select your Apple Developer team
# 2. Product → Archive → Distribute App → App Store Connect → Upload
```

First-time setup you still need on the Apple side:

1. Apple Developer Program membership ($99/yr) — enrol as **Martin Khoury** (sole trader is fine; the account name need not match the Play developer name "hekaverse").
2. App Store Connect → My Apps → "+" → iOS app, bundle ID `com.antidosis.app` (register the App ID in Certificates, Identifiers & Profiles first if not auto-created).
3. Signing certificates + App Store distribution provisioning profile (Xcode "Automatically manage signing" handles this once your team is selected).

CI alternative (no local Mac): GitHub Actions `macos-14` runner with the `ios` build — fastlane `match`/`gym`/`pilot` can archive and upload with App Store Connect API keys. Say the word and we'll set that workflow up.

## 8. Pre-submit checklist

- [x] In-app account deletion
- [x] Privacy policy URL live
- [x] Version bumped (1.0.15 / 18)
- [x] Icon 1024×1024 (no alpha) — `appstore-graphics/icon-1024.png`
- [x] Screenshot sets: iPhone 6.9", 6.5", iPad 12.9", iPad 11"
- [x] Age rating answers (4+)
- [x] Export compliance answers (exempt)
- [x] App privacy labels
- [x] Review notes + demo account
- [ ] Build uploaded from a Mac/CI (only remaining step that needs hardware/Apple account)
- [ ] Submit for review
