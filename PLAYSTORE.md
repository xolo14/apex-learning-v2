# Syncpedia — Google Play Store release

This repo ships an Android wrapper (Capacitor) that loads the live web app at **https://app.syncpedia.in** inside a native shell.

- **Package name:** `in.syncpedia.app`
- **Play Store icon:** `resources/play-store-icon.png` (512×512)
- **Feature graphic:** `resources/feature-graphic.png` (1024×500)
- **Full listing copy:** see [`PLAY_CONSOLE_LISTING.md`](./PLAY_CONSOLE_LISTING.md)
- **Privacy policy:** https://app.syncpedia.in/privacy

## Prerequisites

1. **Node.js** 20+ (already used for the web app)
2. **Android Studio** (Ladybug or newer) with:
   - Android SDK 36
   - Android SDK Build-Tools
   - JDK 17+
3. A **Google Play Console** developer account ($25 one-time)

## One-time setup

```bash
npm install
npm run android:sync
```

Open the project in Android Studio:

```bash
npm run android:open
```

## Create a signing key (once)

From the project root:

```bash
keytool -genkeypair -v \
  -keystore android/syncpedia-release.keystore \
  -alias syncpedia \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Syncpedia Technologies Pvt Ltd, O=Syncpedia, L=Hyderabad, ST=Telangana, C=IN"
```

Copy the example config and fill in your passwords:

```bash
cp android/keystore.properties.example android/keystore.properties
```

Edit `android/keystore.properties` — **never commit** this file or the `.keystore`.

## Build a Play Store bundle (AAB)

```bash
npm run android:sync
npm run android:build
```

Output:

`android/app/build/outputs/bundle/release/app-release.aab`

Upload this file in Play Console → **Release** → **Production** (or Internal testing first).

## Play Console checklist

| Item | Value |
|------|--------|
| App name | Syncpedia |
| Short description | `Student community for events, internships, gigs, quizzes & certifications.` |
| Full description | See [`PLAY_CONSOLE_LISTING.md`](./PLAY_CONSOLE_LISTING.md) |
| App icon | `resources/play-store-icon.png` |
| Feature graphic | `resources/feature-graphic.png` |
| Phone screenshots | 2+ from the app — see listing guide |
| Privacy policy URL | https://app.syncpedia.in/privacy |
| Category | Education or Social |
| Content rating | Complete the questionnaire in Play Console |
| Target audience | 13+ (students) |
| Data safety | See **Data safety (Play Console)** below — must match `/privacy` |

## Data safety (Play Console)

When filling Google Play **Data safety**, align declarations with the live policy at `/privacy`:

| Data type | Collected? | Purpose | Shared? |
|-----------|------------|---------|---------|
| Name | Yes | Account, applications | No (except admins/service providers) |
| Email | Yes | Account, login, applications | No |
| Phone number | Yes | Account, login, applications | No |
| User IDs | Yes | Profile, coins, enrollments | Visible to other users (public ID) |
| Photos / files | Optional | Resume uploads (PDF/Word) | Admins only |
| Messages | Yes | Direct messages | Conversation participants |
| App interactions | Yes | Posts, votes, enrollments, coins | Per community visibility |
| Device or other IDs | Yes | `device_key` for session | No |
| Crash logs / diagnostics | Yes | Security & troubleshooting | Service providers only |
| Push notification token | Optional | Notifications if user enables | Push infrastructure only |

- **Data encrypted in transit:** Yes (HTTPS)
- **Data deletion requested:** Yes — email privacy@syncpedia.in
- **Committed to Play Families / Designed for Families:** No (13+ student/professional audience)
- **Ads:** No ads SDK; data not used for advertising
- **Sold:** No

## Internal testing (recommended first)

1. Play Console → **Testing** → **Internal testing**
2. Create a release and upload the `.aab`
3. Add tester emails
4. Install via the opt-in link before going to production

## Updating the app

Bump version in `android/app/build.gradle`:

- `versionCode` — integer, must increase every upload
- `versionName` — user-visible string (e.g. `1.0.1`)

Then rebuild and upload a new AAB.

Because the app loads the live website, most feature updates deploy from the VPS (`git pull && npm run build && pm2 restart`) without a new Play Store release. Ship a new AAB when you change native config, plugins, icons, or minimum SDK.

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run mobile:icons` | Regenerate launcher + splash from `resources/icon.svg` |
| `npm run cap:sync` | Copy web shell + config into native projects |
| `npm run android:sync` | Icons + sync Android |
| `npm run android:open` | Open in Android Studio |
| `npm run android:build` | Signed release AAB (needs `keystore.properties`) |

## Troubleshooting

- **SDK not found:** Set `ANDROID_HOME` or open Android Studio once so it installs the SDK.
- **Gradle fails:** Run from Android Studio first (**File → Sync Project with Gradle Files**).
- **White screen:** Confirm `https://app.syncpedia.in` is up and `capacitor.config.ts` `server.url` is correct.
- **Cleartext errors:** Only HTTPS is allowed (`cleartext: false`).
