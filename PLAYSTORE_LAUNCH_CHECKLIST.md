# Syncpedia — Play Store launch checklist

**Last checked:** June 2026  
**Package:** `in.syncpedia.app`  
**Listing copy:** [`PLAY_CONSOLE_LISTING.md`](./PLAY_CONSOLE_LISTING.md)  
**Build guide:** [`PLAYSTORE.md`](./PLAYSTORE.md)

---

## Status overview

| Area | Status | Notes |
|------|--------|-------|
| 2. Play Console listing | **Mostly ready** | Screenshots + release AAB still needed |
| 3. Google policy forms | **Ready to fill** | Answers documented below |
| 4. Technical / server | **OK** | Site + privacy live on HTTPS |
| 5. Update strategy | **Documented** | Web = VPS; native = new AAB |
| 6. Launch order | **Documented** | Start with Internal testing |
| 7. Keystore backup | **Not done yet** | Create before release build |

---

## 2. Play Console listing (required)

| Item | Value | Status |
|------|--------|--------|
| **App name** | Syncpedia | ✅ Ready |
| **Short description** | `Student community for events, internships, gigs, quizzes & certifications.` (79 chars) | ✅ Ready |
| **Full description** | See `PLAY_CONSOLE_LISTING.md` → copy full block | ✅ Ready |
| **App icon** | `resources/play-store-icon.png` (512×512) | ✅ Ready |
| **Feature graphic** | `resources/feature-graphic.png` (1024×500) | ✅ Ready |
| **Screenshots** | Min 2 phone screenshots | ❌ **You must capture on your Samsung** → save to `resources/screenshots/` |
| **Privacy policy URL** | https://app.syncpedia.in/privacy | ✅ Live (HTTP 200) |
| **Category** | Education (primary) | ✅ Ready |
| **Contact email** | support@syncpedia.in | ✅ Ready |
| **Website** | https://app.syncpedia.in | ✅ Live |

### Screenshots to capture (on your phone)

1. Communities / home feed  
2. Internships or Courses  
3. Profile *(optional 3rd)*  

Power + Volume Down on Samsung → screenshots save to Gallery → AirDrop/email to Mac → `resources/screenshots/`.

---

## 3. Google policy forms (required)

### Content rating (IARC)

| Question | Answer |
|----------|--------|
| Violence | No |
| Sexual content | No |
| Bad language | Infrequent / mild (user posts) |
| Drugs | No |
| User interaction | **Yes** (DMs, posts, communities) |
| Location sharing | **No** |
| Unrestricted internet | **Yes** (loads web app) |
| Digital purchases | **Yes** (paid courses/events if offered) |

### Target audience

| Field | Answer |
|-------|--------|
| Target age | **13+** |
| Designed for children | **No** |
| Ads | **No** — Syncpedia does not show ads |
| In-app purchases | Optional — paid certifications/events |

### Data safety

Must match https://app.syncpedia.in/privacy — full table in `PLAY_CONSOLE_LISTING.md`.

| Declaration | Answer |
|-------------|--------|
| Collects data | **Yes** |
| Encrypted in transit | **Yes** (HTTPS) |
| Users can request deletion | **Yes** → privacy@syncpedia.in |
| Data sold | **No** |
| Used for ads | **No** |

**Collected:** name, email, phone, user ID, messages, app activity, device ID, optional push token, optional resume file.

### App access (reviewers)

Login is required. Create a **dedicated test account** before submit:

```
Instructions for reviewers:
1. Open Syncpedia
2. On the welcome screen, choose "Sign in" (or create account)
3. Enter the test email and mobile below

Test email:  [YOUR_TEST_GMAIL@gmail.com]
Test mobile: [YOUR_10_DIGIT_MOBILE]
```

Create this account in the app first, then paste into Play Console → **App access** → **All functionality available without restrictions** OR provide credentials.

---

## 4. Technical — keep working

| Maintain | Status | Action |
|----------|--------|--------|
| https://app.syncpedia.in up | ✅ | Monitor VPS / PM2 |
| Valid SSL | ✅ | Let's Encrypt via nginx |
| /privacy live | ✅ | Deploy after code changes |
| Login / signup works | ⚠️ Verify | Test on phone before submit |
| VPS deploy command | — | `git pull && npm run build && pm2 restart syncpedia-community` |

The Android app is a **WebView** to the live site — if the server is down, the app shows blank.

---

## 5. When to upload a new AAB

| Change | New AAB? |
|--------|----------|
| Website features, UI, content | **No** — deploy VPS only |
| App icon / splash | **Yes** |
| Capacitor plugins | **Yes** |
| `versionCode` bump | **Yes** |
| Android permissions | **Yes** |

Current version: `versionCode 1`, `versionName "1.0"` in `android/app/build.gradle`.

---

## 6. Recommended launch order

1. ✅ App tested on Samsung (debug install)  
2. ❌ Create signing keystore  
3. ❌ Build signed `.aab`  
4. ❌ Play Console → **Internal testing** → upload AAB  
5. ❌ Add your Gmail as tester → install from link  
6. ❌ Fix any issues  
7. ❌ **Production** release (after internal test passes)  

**Do not skip Internal testing.**

---

## 7. Never lose these

| Item | Status | Action |
|------|--------|--------|
| `android/syncpedia-release.keystore` | ❌ Not created | Run keytool (see PLAYSTORE.md) |
| `android/keystore.properties` | ❌ Not created | Copy from `keystore.properties.example` |
| Keystore passwords | — | Save in password manager + backup |
| Play Console Google account | — | Use company account if possible |

---

## Release build — do this next

On your **Mac**:

```bash
# 1. Signing key (one time)
keytool -genkeypair -v \
  -keystore android/syncpedia-release.keystore \
  -alias syncpedia \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Syncpedia Technologies Pvt Ltd, O=Syncpedia, L=Hyderabad, ST=Telangana, C=IN"

cp android/keystore.properties.example android/keystore.properties
# Edit keystore.properties with your passwords

# 2. Build release bundle
cd ~/Desktop/apex-learning-v2
npm run android:sync
npm run android:build
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Play Console upload order

1. Create app → package `in.syncpedia.app`  
2. **Store listing** — paste text, upload icon + feature graphic + screenshots  
3. **App content** — privacy URL, ads (No), content rating, target audience, data safety  
4. **App access** — reviewer test account  
5. **Release** → Internal testing → upload `.aab`  
6. Test on your phone → promote to Production when ready  

---

## Quick copy — Store listing

**App name:** Syncpedia  

**Short description:**
```
Student community for events, internships, gigs, quizzes & certifications.
```

**Privacy policy:** https://app.syncpedia.in/privacy  
**Email:** support@syncpedia.in  
**Website:** https://app.syncpedia.in  
**Category:** Education  

Full description → open `PLAY_CONSOLE_LISTING.md`.
