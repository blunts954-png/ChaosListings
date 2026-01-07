# 🧪 Testing Flow - What to Expect Step-by-Step

This document shows **exactly** what you'll see when testing the system with your own business.

---

## 🎬 SCENARIO: Testing "John's HVAC" Business

Let's walk through a complete test using a real example.

---

## ✅ PHASE 1: Setup & Login (2 minutes)

### What You Do:
1. Start backend, workers, frontend (3 terminals)
2. Open http://localhost:3001
3. Login with `admin@chaoslistings.com` / `MasterPass123!`

### What You See:

**Login Screen:**
```
┌─────────────────────────────────┐
│  🏢 ChaosListings               │
│                                 │
│  Email: [________________]      │
│  Password: [____________]       │
│                                 │
│  [ Login ]                      │
└─────────────────────────────────┘
```

**After Login - Dashboard:**
```
Welcome back, Master Admin!

Agency: ChaosListings Master

[ + Add Business ]

Businesses (0):
(empty state - no businesses yet)
```

---

## ✅ PHASE 2: Create Your Business (3 minutes)

### What You Do:

Click **"Add Business"**, fill in the form:

```
Business Name: John's HVAC Service
Legal Name: John's HVAC Service LLC
Phone: +1-555-987-6543
Email: info@johnshvac.com
Website: https://johnshvac.com

Address Line 1: 456 Oak Avenue
Address Line 2: Suite 200
City: Austin
State: TX
Postal Code: 78701
Country: US

Industry: HVAC
Categories: ["HVAC", "Air Conditioning", "Heating"]

Description: Professional HVAC installation, repair, and maintenance services in Austin, TX. 24/7 emergency service available. Licensed and insured with 15 years of experience.

Business Hours:
  Monday: 8:00 AM - 6:00 PM
  Tuesday: 8:00 AM - 6:00 PM
  Wednesday: 8:00 AM - 6:00 PM
  Thursday: 8:00 AM - 6:00 PM
  Friday: 8:00 AM - 6:00 PM
  Saturday: 9:00 AM - 3:00 PM
  Sunday: Closed

Logo URL: https://example.com/johnslogo.png
Photos:
  - https://example.com/hvac-truck.jpg
  - https://example.com/team-photo.jpg
  - https://example.com/before-after.jpg
  - https://example.com/certified-badge.jpg

[ Save Business ]
```

### What You See:

**Success Message:**
```
✅ Business created successfully!
```

**Business appears in list:**
```
Businesses (1):

┌────────────────────────────────────────┐
│ John's HVAC Service                    │
│ 456 Oak Ave, Austin, TX 78701          │
│ Status: Draft                          │
│ [ View ] [ Edit ] [ Listings ]         │
└────────────────────────────────────────┘
```

---

## ✅ PHASE 3: View Listings Page - Before Activation (1 minute)

### What You Do:

Click **"Listings"** button

### What You See:

**Onboarding Steps:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Scan Your Business ✓ (current)
Step 2: Review Your Listings (inactive)
Step 3: Correct and Elevate (inactive)
Step 4: Complete (inactive)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Optimization Score Box (RED):**
```
┌────────────────────────────────────────┐
│ ❌ Bad Optimization Rate – 0%          │
│                                        │
│ Critical: Your business has minimal   │
│ online visibility.                     │
│                                        │
│ Live Directories: 0 / 15               │
│ Pending: 0                             │
│ Errors: 0                              │
│ Total Score: 0%                        │
│                                        │
│ Profile Completeness:                  │
│ ✅ Business hours (+5)                 │
│ ✅ Category/Industry (+3)              │
│ ✅ Website URL (+3)                    │
│ ✅ Description (+3)                    │
│ ✅ Photos (4 photos) (+3)              │
│ ✅ Logo (+3)                           │
│                                        │
│ Priority Publishers:                   │
│ ❌ Google Business (not live)          │
│ ❌ Yelp (not live)                     │
│ ❌ Facebook (not live)                 │
└────────────────────────────────────────┘
```

**Big Blue Button:**
```
┌────────────────────────────────────────┐
│                                        │
│   🚀 Boost My Visibility Now           │
│                                        │
└────────────────────────────────────────┘
```

**Directories Table:**
```
╔════════════════╦══════════════╦═══════════════╦════════════╦══════════════════════════╗
║ Listing        ║ Business     ║ Phone         ║ Status     ║ Address                  ║
╠════════════════╬══════════════╬═══════════════╬════════════╬══════════════════════════╣
║ 🔵 Google      ║ John's HVAC  ║ +1-555-987... ║ Unavailable║ 456 Oak Ave, Austin...   ║
║ 🔴 Yelp        ║ John's HVAC  ║ +1-555-987... ║ Unavailable║ 456 Oak Ave, Austin...   ║
║ 🔵 Facebook    ║ John's HVAC  ║ +1-555-987... ║ Unavailable║ 456 Oak Ave, Austin...   ║
║ 🔵 Bing        ║ John's HVAC  ║ +1-555-987... ║ Unavailable║ 456 Oak Ave, Austin...   ║
║ 🍎 Apple Maps  ║ John's HVAC  ║ +1-555-987... ║ Unavailable║ 456 Oak Ave, Austin...   ║
║ ... (10 more)                                                                          ║
╚════════════════╩══════════════╩═══════════════╩════════════╩══════════════════════════╝
```

---

## ✅ PHASE 4: Click "Boost My Visibility Now" (5 seconds)

### What You Do:

Click the big blue **"Boost My Visibility Now"** button

### What Happens (Behind the Scenes):

**Backend logs (Terminal 1):**
```
[ListingsService] POST /businesses/abc123/listings/activate
[ListingsService] Enqueuing activation job for business abc123
[StripeService] Creating subscription for agency...
✅ Stripe subscription created: sub_1234567890
[YextClient] Creating Yext location...
✅ Yext location created: loc_johnsHVAC_abc
[ListingsService] Activation job enqueued: job_xyz789
```

**Worker logs (Terminal 2):**
```
[ListingsSyncWorker] Processing job: activate-listings (job_xyz789)
[ListingsSyncWorker] Step 1: Creating Stripe subscription...
✅ Stripe subscription created: sub_1234567890
[ListingsSyncWorker] Step 2: Creating Yext location...
✅ Yext location created: loc_johnsHVAC_abc
[ListingsSyncWorker] Step 3: Initializing directory statuses...
✅ Updated 15 directory statuses to "pending"
[ListingsSyncWorker] ✅ Job completed successfully
```

### What You See (Frontend):

**Success Message Appears:**
```
┌────────────────────────────────────────┐
│ ✅ Listings activation started!        │
│ This may take a few minutes.           │
└────────────────────────────────────────┘
```

**Button Changes:**
```
Before: 🚀 Boost My Visibility Now

After:  🔄 Sync Now | Last synced: just now
        Active plan: Listings Starter
```

**Directories Table Updates Immediately:**
```
╔════════════════╦══════════════╦═══════════════╦════════════╦══════════════════════════╗
║ Listing        ║ Business     ║ Phone         ║ Status     ║ Address                  ║
╠════════════════╬══════════════╬═══════════════╬════════════╬══════════════════════════╣
║ 🔵 Google      ║ John's HVAC  ║ +1-555-987... ║ ⏳ Pending ║ 456 Oak Ave, Austin...   ║
║ 🔴 Yelp        ║ John's HVAC  ║ +1-555-987... ║ ⏳ Pending ║ 456 Oak Ave, Austin...   ║
║ 🔵 Facebook    ║ John's HVAC  ║ +1-555-987... ║ ⏳ Pending ║ 456 Oak Ave, Austin...   ║
║ 🔵 Bing        ║ John's HVAC  ║ +1-555-987... ║ ⏳ Pending ║ 456 Oak Ave, Austin...   ║
║ ... (all 15 now say "Pending")                                                         ║
╚════════════════╩══════════════╩═══════════════╩════════════╩══════════════════════════╝
```

**Optimization Score Updates:**
```
┌────────────────────────────────────────┐
│ ⚠️ Poor Optimization Rate – 20%        │
│                                        │
│ Your visibility is limited. Activate   │
│ more directories to improve.           │
│                                        │
│ Live Directories: 0 / 15               │
│ Pending: 15  ← Changed!                │
│ Errors: 0                              │
│ Total Score: 20%  ← Went up!           │
└────────────────────────────────────────┘
```

---

## ✅ PHASE 5: Watch Directories Go Live (2-5 minutes)

### What You Do:

**Refresh the page every 30 seconds**

(The page auto-refreshes data every 30s via React Query)

### What You See (Progression):

**After 1 minute:**
```
╔════════════════╦═══════════════╗
║ Listing        ║ Status        ║
╠════════════════╬═══════════════╣
║ 🔵 Google      ║ ✅ Live       ║  ← First to go live!
║ 🍎 Apple Maps  ║ ✅ Live       ║
║ 🔵 Bing        ║ ⏳ Pending    ║
║ 🔴 Yelp        ║ ⏳ Pending    ║
║ 🔵 Facebook    ║ Under Review  ║  ← Needs verification
║ ... (others still pending)              ║
╚════════════════╩═══════════════╝

Optimization Score: 35%  (2/15 live)
```

**After 3 minutes:**
```
╔════════════════╦═══════════════╗
║ Listing        ║ Status        ║
╠════════════════╬═══════════════╣
║ 🔵 Google      ║ ✅ Live       ║  🔗 View Listing
║ 🍎 Apple Maps  ║ ✅ Live       ║  🔗 View Listing
║ 🔵 Bing        ║ ✅ Live       ║  🔗 View Listing
║ 🔴 Yelp        ║ ✅ Live       ║  🔗 View Listing
║ 🟡 Yahoo       ║ ✅ Live       ║
║ 📍 Foursquare  ║ ✅ Live       ║
║ 🗺️ MapQuest   ║ ✅ Live       ║
║ 🟢 Angi        ║ ✅ Live       ║
║ 🔵 Facebook    ║ Under Review  ║
║ ... (6 more pending)                    ║
╚════════════════╩═══════════════╝

Optimization Score: 60%  (8/15 live) - "Good"
```

**After 5 minutes (Final State):**
```
╔════════════════╦═══════════════╗
║ Listing        ║ Status        ║
╠════════════════╬═══════════════╣
║ 🔵 Google      ║ ✅ Live       ║  🔗 g.page/johns-hvac-austin
║ 🔴 Yelp        ║ ✅ Live       ║  🔗 yelp.com/biz/johns-hvac...
║ 🔵 Facebook    ║ ✅ Live       ║  🔗 facebook.com/johnsHVAC
║ 🔵 Bing        ║ ✅ Live       ║  🔗 bing.com/maps/johns-hvac
║ 🍎 Apple Maps  ║ ✅ Live       ║
║ 🟡 Yahoo       ║ ✅ Live       ║
║ 📍 YP.com      ║ ✅ Live       ║
║ 📍 Foursquare  ║ ✅ Live       ║
║ 🗺️ MapQuest   ║ ✅ Live       ║
║ 🟢 Angi        ║ ✅ Live       ║
║ 🏠 HomeAdvisor ║ ✅ Live       ║
║ 🏘️ Nextdoor   ║ ⏳ Pending    ║  (takes longer)
║ ⭐ BBB         ║ ✅ Live       ║
║ 📱 Superpages  ║ ✅ Live       ║
║ 🔍 Citysearch  ║ ✅ Live       ║
╚════════════════╩═══════════════╝

Live: 14 / 15
Pending: 1
```

**Optimization Score (Final):**
```
┌────────────────────────────────────────┐
│ ✅ Excellent Optimization Rate – 86%   │
│                                        │
│ Outstanding! Your business has         │
│ excellent visibility.                  │
│                                        │
│ Live Directories: 14 / 15              │
│ Pending: 1                             │
│ Errors: 0                              │
│ Total Score: 86%                       │
│                                        │
│ Score Breakdown:                       │
│ Base: 65.3 (14/15 directories live)    │
│ Completeness: +20 (full profile)       │
│ Priority: +10 (Google+Yelp+FB live)    │
│ Penalties: 0                           │
│                                        │
│ Profile Completeness:                  │
│ ✅ Business hours (+5)                 │
│ ✅ Category/Industry (+3)              │
│ ✅ Website URL (+3)                    │
│ ✅ Description (+3)                    │
│ ✅ Photos (4+) (+3)                    │
│ ✅ Logo (+3)                           │
│                                        │
│ Priority Publishers:                   │
│ ✅ Google Business (+5)                │
│ ✅ Yelp (+3)                           │
│ ✅ Facebook (+2)                       │
└────────────────────────────────────────┘
```

---

## ✅ PHASE 6: Click External Links & Verify (2 minutes)

### What You Do:

Click **"View Listing"** links in the table

### What You See:

**Google Business Profile:**
```
Opens: https://g.page/johns-hvac-austin

Shows:
┌─────────────────────────────────┐
│ John's HVAC Service             │
│ ⭐⭐⭐⭐⭐ (New business)         │
│                                 │
│ 📍 456 Oak Ave, Austin, TX      │
│ 📞 +1-555-987-6543              │
│ 🌐 johnshvac.com                │
│                                 │
│ Hours:                          │
│ Mon-Fri: 8:00 AM - 6:00 PM      │
│ Sat: 9:00 AM - 3:00 PM          │
│ Sun: Closed                     │
│                                 │
│ About:                          │
│ Professional HVAC installation, │
│ repair, and maintenance...      │
│                                 │
│ [Photos] [Reviews] [Questions]  │
└─────────────────────────────────┘
```

**Yelp:**
```
Opens: https://yelp.com/biz/johns-hvac-service-austin

Shows:
- Business name: John's HVAC Service ✅
- Address: 456 Oak Ave, Suite 200, Austin, TX 78701 ✅
- Phone: (555) 987-6543 ✅
- Website: johnshvac.com ✅
- Categories: HVAC, Air Conditioning, Heating ✅
- Hours: Same as you entered ✅
- Photos: Your 4 uploaded photos ✅
```

**Facebook:**
```
Opens: https://facebook.com/johnsHVAC

Shows:
- Page name: John's HVAC Service
- Location: Austin, Texas
- Contact info matches
- About section matches your description
- Cover photo from your uploads
```

**Verification: ALL INFO IS CONSISTENT** ✅

This is the **magic** - one profile updates everywhere!

---

## ✅ PHASE 7: Test Manual Sync (2 minutes)

### What You Do:

1. Click **"Edit Business"** button
2. Change phone number: `+1-555-987-6543` → `+1-555-123-4567`
3. Click **"Save"**
4. Go back to **"Listings"** tab
5. Click **"Sync Now"** button

### What Happens:

**Worker logs:**
```
[ListingsSyncWorker] Processing sync job for business abc123
[YextClient] Updating Yext location loc_johnsHVAC_abc
✅ Yext location updated
[ListingsSyncWorker] Updated fields: ["phone"]
```

**After 2-3 minutes:**

**Check Google again:**
```
Phone number updated to: +1-555-123-4567 ✅
```

**Check Yelp:**
```
Phone number updated to: (555) 123-4567 ✅
```

**All 15 directories now show new phone number** without you manually logging into each one!

---

## ✅ PHASE 8: Check Billing (1 minute)

### What You Do:

Go to **Stripe Dashboard**: https://dashboard.stripe.com/test/subscriptions

### What You See:

```
Subscriptions (1)

┌─────────────────────────────────────────┐
│ sub_1234567890                          │
│                                         │
│ Customer: ChaosListings Master          │
│ Product: Listings Starter               │
│ Amount: $39.00 / month                  │
│ Status: ⏱️ Trialing                     │
│                                         │
│ Trial ends: [14 days from now]          │
│ Next billing: [14 days from now]        │
│                                         │
│ Metadata:                               │
│   businessId: abc123                    │
│   agencyId: master-agency-id            │
└─────────────────────────────────────────┘
```

**After 14 days (in production):**
- Status changes to: ✅ Active
- Stripe charges $39.00
- Money goes to YOUR account
- You pay Yext ~$15 for the location
- You keep $24 profit 💰

---

## ✅ PHASE 9: Check Yext Dashboard (1 minute)

### What You Do:

1. Go to https://www.yext.com
2. Login with your Yext credentials
3. Navigate to **"Locations"** in sidebar

### What You See:

```
Locations (1)

┌─────────────────────────────────────────┐
│ John's HVAC Service                     │
│ Austin, TX 78701                        │
│                                         │
│ Status: ✅ Live                         │
│ Last Updated: [timestamp]               │
│                                         │
│ Publishers (15):                        │
│ ✅ Google (Live)                        │
│ ✅ Yelp (Live)                          │
│ ✅ Facebook (Live)                      │
│ ✅ Bing (Live)                          │
│ ✅ Apple Maps (Live)                    │
│ ... (10 more)                           │
│                                         │
│ [ View Details ] [ Edit ]               │
└─────────────────────────────────────────┘
```

Click **"View Details"** to see full sync status and any issues.

---

## ✅ PHASE 10: Database Inspection (Optional - 2 minutes)

### What You Do:

```bash
cd backend
npx prisma studio
```

Open http://localhost:5555

### What You See:

**Table: `businesses`**
```
id: abc123
name: John's HVAC Service
yextLocationId: loc_johnsHVAC_abc  ✅
yextSyncStatus: synced  ✅
yextLastSyncedAt: 2024-01-15 14:30:00
onboardingStep: complete  ✅
```

**Table: `business_directory_status`**
```
15 rows for this business:

businessId | directoryId | status | externalUrl
-----------|-------------|--------|-------------
abc123     | google      | live   | https://g.page/johns...
abc123     | yelp        | live   | https://yelp.com/biz...
abc123     | facebook    | live   | https://facebook.com...
... (12 more)
```

**Table: `subscriptions`**
```
id: sub_123
businessId: abc123
stripeSubscriptionId: sub_1234567890
status: trialing
priceToClient: 39.00
costToUs: 15.00  (your cost to Yext)
currentPeriodEnd: [14 days from now]
```

**Table: `optimization_scores`**
```
businessId: abc123
score: 86
baseScore: 65.3
completenessBonus: 20
priorityPublisherBonus: 10
penalties: 0
liveDirectories: 14
totalDirectories: 15
googleLive: true  ✅
yelpLive: true  ✅
facebookLive: true  ✅
calculatedAt: [timestamp]
```

---

## 🎉 SUCCESS CRITERIA - You're Done When:

✅ **Backend & workers running** without errors
✅ **Frontend loads** and shows dashboard
✅ **Master account login works**
✅ **Business created** with full profile
✅ **"Boost My Visibility Now" clicked** successfully
✅ **Stripe subscription created** (visible in dashboard)
✅ **Yext location created** (visible in Yext dashboard)
✅ **14 out of 15 directories went "live"** within 5 minutes
✅ **Optimization score reached 80%+**
✅ **External links work** (Google, Yelp, Facebook pages exist)
✅ **NAP consistency** (Name/Address/Phone same everywhere)
✅ **Manual sync works** (phone number change propagated)
✅ **Database shows** correct data in Prisma Studio

---

## 🚨 What If Something Goes Wrong?

### Scenario: Only 2 directories go live

**Cause:** Yext API might be slow or some publishers require manual verification

**Solution:**
1. Wait 10-15 minutes (some directories are slow)
2. Check Yext dashboard for publisher-specific errors
3. Click "Sync Now" to retry failed publishers
4. Google/Yelp/Bing are fastest - Facebook can take 24 hours

### Scenario: Score stuck at 20%

**Cause:** Directories still "pending", not "live"

**Solution:**
- This is normal! Score only increases when directories go "live"
- Check worker logs for sync job completion
- Refresh page - data updates every 30 seconds
- If stuck after 10 minutes, click "Sync Now" manually

### Scenario: Stripe webhook error

**Cause:** Stripe can't reach your local webhook endpoint

**Solution:**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe`
- Or ignore for now - subscription still works without webhooks in dev mode

---

## 💡 Tips for Best Test Results

1. **Use REAL business data** (your actual business or a client's)
2. **Fill in ALL optional fields** (photos, hours, description) → Higher score
3. **Be patient** - Yext can take 2-10 minutes to sync
4. **Check external links** - This proves it REALLY works
5. **Test phone change** - Shows the "fix" capability
6. **Watch worker logs** - See jobs processing in real-time
7. **Use Prisma Studio** - Inspect database to understand data flow

---

**Ready to test? Follow the QUICKSTART.md guide and refer back to this doc to see what's normal!**

🎯 **Your business will be visible on Google, Yelp, and 13 other directories in under 10 minutes!**
