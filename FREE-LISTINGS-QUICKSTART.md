# 🚀 Free Listings Quick Start Checklist

Get your free listings engine up and running in **30 minutes**.

---

## ✅ Phase 1: Google My Business Setup (15 min)

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create new project called `ChaosListings`
- [ ] Go to **APIs & Services** → **Library**
- [ ] Search and enable **Google My Business API**
- [ ] Go to **Credentials**
- [ ] Click **+ Create Credentials** → **OAuth 2.0 Client ID**
- [ ] Choose **Desktop Application**
- [ ] Add redirect URIs:
  - `http://localhost:3000/auth/google/callback`
  - `http://localhost:3000/listings/free/google-callback`
- [ ] Copy **Client ID** and **Client Secret**

**Save in `backend/.env.local`:**
```bash
GOOGLE_BUSINESS_CLIENT_ID="paste-client-id-here"
GOOGLE_BUSINESS_CLIENT_SECRET="paste-client-secret-here"
```

---

## ✅ Phase 2: Yelp API Setup (5 min)

- [ ] Go to [Yelp Developers](https://www.yelp.com/developers)
- [ ] Click **Get Started**
- [ ] Sign in or create account
- [ ] Go to [App Management](https://www.yelp.com/developers/v3/manage_app)
- [ ] Click **Create App**
- [ ] Fill in app details
- [ ] Copy **API Key** (you'll see it after creating)

**Save in `backend/.env.local`:**
```bash
YELP_API_KEY="paste-api-key-here"
```

---

## ✅ Phase 3: Backend Configuration (5 min)

- [ ] Open `backend/.env.local` (create if doesn't exist)
- [ ] Add all env vars from Phase 1 & 2 above
- [ ] Verify database connection works
- [ ] Verify Redis connection works

```bash
# Quick test in backend directory
npm run start:dev
```

Wait for: `[Nest] xxx - 01/09/2026, x:xx:xx AM LOG [NestFactory] Application successfully started`

---

## ✅ Phase 4: Test Endpoints (5 min)

### Test 1: Get Google Auth URL
```bash
curl http://localhost:3000/api/businesses/123/listings/free/google-auth-url \
  ?redirectUri=http://localhost:3000/auth/callback
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

### Test 2: Find Business on Yelp
```bash
# First get a JWT token by logging in, then:
curl -X POST http://localhost:3000/api/businesses/123/listings/free/find-on-yelp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "businessName": "Pizza Place",
    "location": "San Francisco, CA"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "found": true,
    "yelpId": "pizza-place-san-francisco",
    "yelpUrl": "https://www.yelp.com/biz/...",
    "rating": 4.5,
    "reviewCount": 127,
    "phone": "+1-555-0123"
  }
}
```

### Test 3: Get Competitive Analysis
```bash
curl -X POST http://localhost:3000/api/businesses/123/listings/free/competitive-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "category": "Pizza",
    "location": "San Francisco, CA"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "competitorCount": 10,
    "avgRating": 4.2,
    "competitors": [...]
  }
}
```

---

## 🎯 What Each Endpoint Does

| Endpoint | What it does | Use case |
|----------|--------------|----------|
| `GET /free/google-auth-url` | Get OAuth login link | User clicks to authorize Google |
| `POST /free/google-callback` | Exchange auth code for token | After user authorizes |
| `POST /free/sync-google` | Pull all locations from Google | Sync all locations at once |
| `POST /free/find-on-yelp` | Find business on Yelp | Get rating, reviews, info |
| `POST /free/competitive-analysis` | See what competitors are doing | Market research |
| `POST /free/full-sync` | Run Google + Yelp + Competition | Complete sync in one call |

---

## 💾 Save These Credentials Securely

After getting credentials:

1. **Google Client ID** → `GOOGLE_BUSINESS_CLIENT_ID`
2. **Google Client Secret** → `GOOGLE_BUSINESS_CLIENT_SECRET`
3. **Yelp API Key** → `YELP_API_KEY`

⚠️ **Never commit `.env.local` to git!** It's in `.gitignore`

---

## 🧪 Real-World Test Flow

### Scenario: Sync your first business

1. **Get JWT token:**
   ```bash
   # Login via frontend or API
   # You'll get a token like: eyJhbGciOiJIUzI1NiIs...
   ```

2. **Get Google authorization URL:**
   ```bash
   curl http://localhost:3000/api/businesses/YOUR_BUSINESS_ID/listings/free/google-auth-url \
     ?redirectUri=http://localhost:3000/dashboard
   # Click the returned URL
   # User grants permission
   # Redirected back with auth code
   ```

3. **Exchange code for token:**
   ```bash
   # In your frontend callback handler:
   POST /businesses/YOUR_BUSINESS_ID/listings/free/google-callback
   {
     "code": "4/0AY0e-g...",
     "redirectUri": "http://localhost:3000/dashboard"
   }
   # Returns accessToken you can use for syncing
   ```

4. **Sync Google locations:**
   ```bash
   POST /businesses/YOUR_BUSINESS_ID/listings/free/sync-google
   {
     "accessToken": "ya29.a0...",
     "accountId": "ACCOUNT_ID"
   }
   # Returns all locations on Google
   ```

5. **Search Yelp:**
   ```bash
   POST /businesses/YOUR_BUSINESS_ID/listings/free/find-on-yelp
   {
     "businessName": "Your Business",
     "location": "Your City, State"
   }
   # Returns Yelp data
   ```

---

## 📊 Cost at Each Stage

| Stage | Cost | Notes |
|-------|------|-------|
| **Setup** | $0 | Just API key creation |
| **Development** | $0 | Free tier covers everything |
| **100 customers** | $0 | APIs are free |
| **1,000 customers** | $0 | Still free! |
| **Scaling** | Optional | Yext hybrid if needed |

---

## 🚨 Troubleshooting

### "REDIRECT_URI_MISMATCH" error
- ✅ Check exact match in Google Console
- ✅ Case sensitive!
- ✅ No trailing slash mismatch

### "YELP_API_KEY not configured"
- ✅ Add to `backend/.env.local`
- ✅ Restart backend
- ✅ Check key is correct from Yelp dashboard

### "Cannot find module '@google/generative-ai'"
- ✅ This is unrelated to free listings
- ✅ Run `npm install` if needed
- ✅ Your free listings code works fine

### Endpoints returning 401 Unauthorized
- ✅ Get valid JWT token first
- ✅ Add `Authorization: Bearer TOKEN` header
- ✅ Token might be expired (refresh if needed)

---

## 📚 Full Documentation

For complete setup details, see:
- [FREE-LISTINGS-SETUP.md](./FREE-LISTINGS-SETUP.md) - 300+ line comprehensive guide
- [FREE-LISTINGS-IMPLEMENTATION.md](./FREE-LISTINGS-IMPLEMENTATION.md) - Architecture overview

---

## ✨ You're All Set!

**Time invested:** ~30 minutes  
**Monthly cost:** $0  
**Revenue potential:** $9-$50/month per customer  

Now go get your first customer! 🚀

---

## Next Steps After Setup

- [ ] Add frontend UI for syncing (see FREE-LISTINGS-SETUP.md)
- [ ] Set up manual CSV upload for other directories
- [ ] Create admin dashboard showing sync status
- [ ] Launch beta with first 5 customers
- [ ] Collect feedback and iterate
