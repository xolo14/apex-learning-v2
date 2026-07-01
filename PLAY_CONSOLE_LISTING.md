# Syncpedia — Google Play Console listing

Copy-paste ready content for [Google Play Console](https://play.google.com/console).  
Upload graphics from the `resources/` folder after running `npm run mobile:icons`.

---

## Store listing — Main store listing

### App name (max 30 characters)
```
Syncpedia
```

### Short description (max 80 characters)
```
Student community for events, internships, gigs, quizzes & certifications.
```
*(79 characters)*

### Full description (max 4000 characters)
```
Syncpedia is the community app for students and professionals who want to learn, earn, and connect — all in one place.

Whether you are in college or starting your career, Syncpedia helps you discover opportunities, join communities, and grow with peers across India and beyond.

WHAT YOU CAN DO

• Join communities — Connect with people in your college, branch, or field of interest
• Discover events — Workshops, meetups, hackathons, and campus activities
• Find internships — Apply with your profile and resume in a few taps
• Explore gigs — Short projects and freelance-style opportunities
• Take quizzes — Test your knowledge and compete with others
• Earn Syncpedia coins — Get rewarded for participating and learning
• Certifications — Enroll in courses and watch classes in the in-app classroom
• Ask & share — Post questions, vote, follow peers, and send direct messages

BUILT FOR STUDENTS & PROFESSIONALS

Create your profile as a student (college, year, branch) or professional (company, role). Your unique Syncpedia ID helps others find and follow you across communities.

LEARN AND GROW

From tech and business to design and more — explore communities that match your interests. Save posts, follow creators, and stay updated with optional push notifications.

SAFE & TRANSPARENT

• Privacy policy: https://app.syncpedia.in/privacy
• Support: support@syncpedia.in
• Operated by Syncpedia Technologies Pvt Ltd, India

Download Syncpedia today — learn, earn coins, and connect with your community.
```

### App icon
| File | Size | Where to upload |
|------|------|-----------------|
| `resources/play-store-icon.png` | 512 × 512 | Store listing → App icon |

### Feature graphic
| File | Size | Where to upload |
|------|------|-----------------|
| `resources/feature-graphic.png` | 1024 × 500 | Store listing → Feature graphic |

### Phone screenshots (required: minimum 2)

Take these on your Samsung phone from the installed Syncpedia app:

| # | Screen to capture | Suggested caption (optional) |
|---|-------------------|------------------------------|
| 1 | Home / Communities feed | Discover your communities |
| 2 | Internships or Courses list | Internships & certifications |
| 3 | Profile page | Your Syncpedia profile |
| 4 | Events or Quizzes | Events & quizzes |
| 5 | Certification classroom (video player) | Learn in the classroom |

**Specs:** PNG or JPEG, 16:9 or 9:16, min 320px short side, max 3840px long side.

Save screenshots to `resources/screenshots/` (create folder when you capture them).

---

## Store settings

| Field | Value |
|-------|--------|
| **App category** | Education (primary) |
| **Tags** | Social, Students, Learning (if available in your region) |
| **Email** | support@syncpedia.in |
| **Website** | https://app.syncpedia.in |
| **Privacy policy** | https://app.syncpedia.in/privacy |
| **Phone** | *(optional — your business number)* |

---

## Content rating (IARC questionnaire)

Answer honestly. Suggested answers for Syncpedia:

| Question area | Typical answer |
|---------------|----------------|
| Violence | No |
| Sexual content | No |
| Language | Infrequent / mild (user-generated posts) |
| Controlled substances | No |
| User interaction | **Yes** — users can communicate (DMs, posts) |
| Shares location | **No** |
| Unrestricted internet | **Yes** — app loads web content |
| Digital purchases | **Yes** if paid courses/events are offered |

Expected rating: **Everyone / Teen** depending on user-generated content answers.

---

## Target audience and content

| Field | Value |
|-------|--------|
| Target age group | 13 years and older |
| Appeal to children | No |
| Contains ads | No |
| In-app purchases | Optional — paid courses/events if enabled |

---

## Data safety

Must match https://app.syncpedia.in/privacy

### Does your app collect or share user data?
**Yes**

### Is all of the user data collected by your app encrypted in transit?
**Yes**

### Do you provide a way for users to request that their data is deleted?
**Yes** — email privacy@syncpedia.in

### Data types collected

| Type | Collected | Shared | Purpose |
|------|-----------|--------|---------|
| **Name** | Yes | No | Account, applications |
| **Email address** | Yes | No | Account, login |
| **Phone number** | Yes | No | Account, login |
| **User IDs** | Yes | Yes (public profile ID) | Account |
| **Photos / videos** | Optional | No | Resume upload only |
| **Messages** | Yes | Yes (other user in chat) | App functionality |
| **App interactions** | Yes | Per community rules | Posts, enrollments, coins |
| **Device or other IDs** | Yes | No | Session / device key |
| **Crash logs** | Yes | No | Diagnostics |
| **Push notification token** | Optional | No | Notifications if enabled |

### Data usage
- App functionality
- Account management
- Developer communications (optional push)

### Data NOT collected
- Precise location
- Financial info / card numbers (unless you add a payment gateway later)
- Health info
- Political or religious beliefs

### Data sale
**No**, we do not sell user data.

---

## App access (for Google reviewers)

If login is required to use the app, provide a **test account** in Play Console → App access:

```
Email:    [create a test Gmail for reviewers]
Mobile:   [test phone number]
Notes:    Sign in with email + mobile on the onboarding screen. No special steps required.
```

Create a dedicated reviewer account before submitting.

---

## Release checklist

- [ ] `resources/play-store-icon.png` uploaded
- [ ] `resources/feature-graphic.png` uploaded
- [ ] 2+ phone screenshots uploaded
- [ ] Short + full description pasted
- [ ] Privacy policy URL live: https://app.syncpedia.in/privacy
- [ ] Content rating completed
- [ ] Data safety completed
- [ ] Test account provided (if login required)
- [ ] Signed `.aab` uploaded to Internal testing first
- [ ] App tested on physical device

---

## Regenerate graphics

After updating `resources/play-store-icon.png`:

```bash
npm run mobile:icons
npm run android:sync
```

This updates the feature graphic, Android launcher icons, and splash screen.
