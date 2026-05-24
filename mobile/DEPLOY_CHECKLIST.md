# Antidosis Mobile — Deploy Checklist

## Pre-Flight

- [ ] `cd mobile; npm run build` passes (exit code 0)
- [ ] `cd mobile; npx cap sync` copies assets successfully
- [ ] `.env` has `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`
- [ ] Root `.env` has `NEXT_PUBLIC_APP_URL` pointing to production API
- [ ] CORS in `src/lib/security/cors.ts` includes production origins

---

## Android

### 1. Keystore

```bash
cd mobile/android
keytool -genkey -v -keystore antidosis-release.keystore -alias antidosis -keyalg RSA -keysize 2048 -validity 10000
```

- Store `antidosis-release.keystore` and passwords in 1Password

### 2. Build

```bash
cd mobile/android
./gradlew assembleRelease
```

- Output: `app/build/outputs/apk/release/app-release.apk`

### 3. Google Play

- Upload AAB (preferred) or APK to Google Play Console
- Internal Testing → Closed Testing → Production
- Add `google-services.json` to `android/app/` for Push Notifications

### 4. Permissions Review

- `AndroidManifest.xml` has CAMERA, POST_NOTIFICATIONS, READ_MEDIA_IMAGES
- Adaptive icons generated via `@capacitor/assets`
- Splash screens generated for all densities + dark mode

---

## iOS

### 1. Xcode Setup (macOS required)

```bash
cd mobile
npx cap open ios
```

- Sign in with Apple Developer account
- Select provisioning profile
- Ensure bundle ID matches App Store Connect: `com.antidosis.app`

### 2. Build & Archive

- Product → Archive
- Distribute App → App Store Connect

### 3. App Store Connect

- Create new app with bundle ID `com.antidosis.app`
- Fill metadata: name, subtitle, description, keywords, screenshots
- Submit for review

### 4. Push Notifications

- Enable Push Notifications capability in Xcode
- Upload APNS auth key (.p8) to Supabase dashboard
- Upload APNS certificate to Firebase Console (if using FCM)

---

## Post-Deploy

- [ ] Test deep links: `antidosis://needs/123`
- [ ] Test push notifications on physical devices
- [ ] Test camera photo upload flow
- [ ] Test share sheet
- [ ] Verify haptics on iPhone / vibration on Android
- [ ] Monitor Sentry/LogRocket for crashes
- [ ] Check API rate limits under real load

---

## Version Bump

```bash
# 1. Update package.json version
cd mobile && npm version patch   # or minor / major

# 2. Sync to native projects
cd mobile && npx cap sync

# 3. Update Android versionCode + versionName
# mobile/android/app/build.gradle

# 4. Update iOS MARKETING_VERSION + CURRENT_PROJECT_VERSION
# mobile/ios/App/App.xcodeproj/project.pbxproj

# 5. Rebuild and submit
```
