# 🚀 QUICKSTART GUIDE - Test Your Own Business

This guide will get you up and running in **10 minutes** so you can test the Local Listings Engine on your own business.

---

## 📋 What You'll Need

Before starting, make sure you have:

- ✅ **Node.js 18+** installed (`node --version`)
- ✅ **PostgreSQL 14+** running (local or cloud)
- ✅ **Redis 7+** running (local or cloud)
- ✅ **Yext account** with API credentials ([get here](https://www.yext.com))
- ✅ **Stripe account** with test API keys ([get here](https://dashboard.stripe.com/test/apikeys))

**Quick Install (if missing):**

```bash
# macOS (using Homebrew)
brew install postgresql@14 redis node

# Ubuntu/Debian
sudo apt install postgresql redis-server nodejs npm

# Windows
# Download installers from official sites
```

---

## ⚡ STEP 1: Database Setup (2 minutes)

### Start PostgreSQL

```bash
# macOS
brew services start postgresql@14

# Ubuntu
sudo systemctl start postgresql

# Windows
# Start from Services app
```

### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Inside psql:
CREATE DATABASE listings_engine;
CREATE USER listings_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE listings_engine TO listings_user;
\q
```

**Your DATABASE_URL:**
```
postgresql://listings_user:secure_password_123@localhost:5432/listings_engine
```

---

## ⚡ STEP 2: Redis Setup (1 minute)

```bash
# macOS
brew services start redis

# Ubuntu
sudo systemctl start redis

# Windows
# Run redis-server.exe

# Test Redis is running:
redis-cli ping
# Should return: PONG
```

---

## ⚡ STEP 3: Get API Keys

### Yext API Keys

1. Go to https://www.yext.com/s/me/apps
2. Click **"Create App"**
3. Select **"Content API"** permissions
4. Copy your:
   - **API Key** (starts with `a1b2c3...`)
   - **Account ID** (your Yext account number)

### Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_...`)
3. Create a **Product** for Listings:
   - Go to https://dashboard.stripe.com/test/products
   - Click **"+ Add product"**
   - Name: "Listings Starter"
   - Price: $39.00 / month
   - Click **Create**
   - Copy the **Price ID** (starts with `price_...`)

---

## ⚡ STEP 4: Backend Setup (3 minutes)

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Environment

Create `backend/.env`:

```bash
# Copy this exactly and fill in your values
cat > backend/.env << 'EOF'
# Environment
NODE_ENV=development
PORT=3000

# Database (use your password from Step 1)
DATABASE_URL=postgresql://listings_user:secure_password_123@localhost:5432/listings_engine
DATABASE_POOL_SIZE=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# JWT (use this for testing, change in production)
JWT_SECRET=test-secret-key-change-in-production-12345678
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Yext (paste your keys from Step 3)
YEXT_API_KEY=YOUR_YEXT_API_KEY_HERE
YEXT_ACCOUNT_ID=YOUR_YEXT_ACCOUNT_ID_HERE
YEXT_API_URL=https://api.yext.com/v2
YEXT_WEBHOOK_SECRET=test-webhook-secret

# Stripe (paste your keys from Step 3)
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET
STRIPE_LISTINGS_PRICE_ID=price_YOUR_PRICE_ID_HERE

# Frontend
FRONTEND_URL=http://localhost:3001

# API
API_URL=http://localhost:3000
EOF
```

**⚠️ IMPORTANT:** Replace these placeholders with your actual keys:
- `YOUR_YEXT_API_KEY_HERE`
- `YOUR_YEXT_ACCOUNT_ID_HERE`
- `sk_test_YOUR_STRIPE_KEY_HERE`
- `price_YOUR_PRICE_ID_HERE`

### Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# Seed database (creates master account + 15 directories)
npx ts-node prisma/seed.ts
```

**You should see:**
```
✅ Created 15 directories
✅ Created agency: ChaosListings Master (chaoslistings-master)
✅ Created user: admin@chaoslistings.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 DATABASE SEEDED SUCCESSFULLY!

📧 Email:    admin@chaoslistings.com
🔑 Password: MasterPass123!
🏢 Agency:   ChaosListings Master
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Save these credentials!**

---

## ⚡ STEP 5: Frontend Setup (1 minute)

```bash
cd ../frontend
npm install

# Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
EOF
```

---

## ⚡ STEP 6: Start Everything (3 terminals)

### Terminal 1: Start Backend API

```bash
cd backend
npm run start:dev
```

**Wait for:**
```
╔═══════════════════════════════════════════════════╗
║   Local Listings Engine API                       ║
║   Environment: development                        ║
║   Port: 3000                                      ║
║   Docs: http://localhost:3000/api/docs            ║
╚═══════════════════════════════════════════════════╝
```

### Terminal 2: Start Background Workers

```bash
cd backend
npm run worker:dev
```

**Wait for:**
```
Worker started: sync-listings
Worker started: refresh-status
```

### Terminal 3: Start Frontend

```bash
cd frontend
npm run dev
```

**Wait for:**
```
✓ Ready in 2.5s
○ Local:   http://localhost:3001
```

---

## 🎯 STEP 7: Test With Your Business

### 1. Login

Open browser: **http://localhost:3001/login**

**Credentials:**
- Email: `admin@chaoslistings.com`
- Password: `MasterPass123!`

### 2. Create Your Business

Click **"Add Business"** and enter your business details:

**Required Fields:**
- Business Name (e.g., "John's Plumbing")
- Address Line 1
- City
- State
- Postal Code
- Phone Number

**Optional (but recommended for higher score):**
- Website
- Description (50+ characters)
- Business hours
- Logo URL
- Photos (3+ for bonus points)
- Industry/Category

Click **"Save Business"**

### 3. View Listings Dashboard

Click on your business → Go to **"Listings"** tab

You should see:
- ✅ **Onboarding Steps** (currently on "Scan Your Business")
- ✅ **Optimization Score** (probably 0% or low if not activated)
- ✅ **15 Directories** showing status "unavailable"

### 4. Activate Listings (This is where the magic happens!)

Click the big blue button: **"Boost My Visibility Now"**

**What happens behind the scenes:**

1. ✅ **Stripe subscription created** ($39/mo with 14-day trial)
   - Check in terminal: You'll see logs about Stripe

2. ✅ **Yext location created** with your business profile
   - Your business is now in Yext's system

3. ✅ **Initial sync job queued**
   - Worker picks it up automatically

4. ✅ **Directories start updating** (takes 2-5 minutes)
   - Google Business Profile → pending
   - Yelp → pending
   - Facebook → pending
   - Bing Places → pending
   - ... (all 15 directories)

5. ✅ **Statuses change to "live"** as each directory confirms
   - This happens via webhooks from Yext
   - Refresh the page every 30 seconds

6. ✅ **Optimization Score increases**
   - Should go from 0% → 40-70% depending on profile completeness

### 5. Check Your Work

**In the browser:**
- Refresh the page after 2-3 minutes
- Watch directories change from "unavailable" → "pending" → "live"
- See optimization score climb
- Click external links to view your actual listings

**In Stripe Dashboard:**
- Go to https://dashboard.stripe.com/test/subscriptions
- You should see a new subscription for "Listings Starter"
- Status: "trialing" (14-day trial)

**In Yext Dashboard:**
- Go to https://www.yext.com
- Login to your account
- Navigate to **"Locations"**
- You should see your business listed!
- Click on it to see sync status across all publishers

**In Database (Prisma Studio):**
```bash
cd backend
npx prisma studio
```
- Open http://localhost:5555
- Click **"businesses"** → see your business with `yextLocationId` populated
- Click **"business_directory_status"** → see status for all 15 directories
- Click **"subscriptions"** → see your Stripe subscription
- Click **"optimization_scores"** → see cached score calculation

---

## 🔥 What This System Actually DOES (Not Just Scanning!)

When you click "Activate Listings", here's what gets **FIXED/MANAGED**:

### 1. **Creates Your Listings** (if they don't exist)
   - Automatically submits your business to Google, Yelp, Facebook, Bing, etc.
   - Claims unclaimed listings
   - Verifies ownership

### 2. **Fixes Inconsistent Information**
   - **NAP Consistency:** Name, Address, Phone must match everywhere
   - Before: "John's Plumbing" on Google, "Johns Plumbing LLC" on Yelp ❌
   - After: "John's Plumbing" everywhere ✅

### 3. **Keeps Everything Synced**
   - Change your phone number once in the dashboard
   - It updates across ALL 15 directories automatically
   - No manual login to each site

### 4. **Adds Missing Information**
   - Hours: If Google has them but Yelp doesn't → Yext adds them
   - Photos: Distributes your logo and photos to all directories
   - Categories: Ensures correct business categories everywhere

### 5. **Monitors & Reports**
   - Daily status checks: Is my Google listing still live?
   - Error detection: Did Yelp reject my update?
   - Optimization tracking: Am I improving over time?

---

## 📊 Understanding Your Optimization Score

**How the 0-100 score is calculated:**

```
Base Score (70 points max):
  = (Live Directories / Total Directories) × 70
  Example: 8 live out of 15 = (8/15) × 70 = 37 points

Profile Completeness Bonus (20 points max):
  ✅ Business hours set: +5 points
  ✅ Industry/category: +3 points
  ✅ Website URL: +3 points
  ✅ Description 50+ chars: +3 points
  ✅ 3+ photos uploaded: +3 points
  ✅ Logo uploaded: +3 points

Priority Publishers Bonus (10 points max):
  ✅ Google Business live: +5 points
  ✅ Yelp live: +3 points
  ✅ Facebook live: +2 points

Penalties:
  ❌ Each directory in "error" state: -2 points
  ❌ No sync in 90 days: -10 points

TOTAL = Base + Completeness + Priority - Penalties
```

**Example Calculation:**

Your business after activation:
- 12 out of 15 directories live = 56 base points
- Full profile (hours, website, description, logo, 5 photos, category) = +20 points
- Google + Yelp + Facebook all live = +10 points
- No errors = 0 penalties

**Score: 86% - "Excellent"** 🎉

---

## 🧪 Test Manual Sync

After activation, try this:

1. Edit your business phone number
2. Click **"Sync Now"** button
3. Watch worker logs in Terminal 2
4. Check Yext dashboard - phone should update
5. Wait 5 minutes
6. Refresh Listings page - see "Last synced: 5 minutes ago"

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check PostgreSQL is running
psql -U listings_user -d listings_engine -c "SELECT 1;"

# If fails, restart PostgreSQL:
brew services restart postgresql@14  # macOS
sudo systemctl restart postgresql     # Linux
```

### "Redis connection refused"
```bash
# Check Redis is running
redis-cli ping

# If fails, restart Redis:
brew services restart redis  # macOS
sudo systemctl restart redis # Linux
```

### "Yext API 401 Unauthorized"
- Double-check `YEXT_API_KEY` in `backend/.env`
- Verify API key has "Content API" permissions in Yext dashboard
- Make sure `YEXT_ACCOUNT_ID` matches your account number

### "Stripe API error"
- Verify `STRIPE_SECRET_KEY` starts with `sk_test_` (for testing)
- Check `STRIPE_LISTINGS_PRICE_ID` matches your product price ID
- Ensure price is set to $39/month recurring

### "Optimization score stuck at 0%"
```bash
# Check if workers are running
ps aux | grep worker

# Check job queue
redis-cli
> KEYS bull:*
> LLEN bull:sync-listings:waiting

# Restart workers if needed (Terminal 2)
# Press Ctrl+C, then:
npm run worker:dev
```

### "Directories not updating"
- Wait at least 5 minutes (Yext API can be slow)
- Check Yext dashboard to see if location was created
- Check worker logs for errors
- Try clicking "Sync Now" manually

### Frontend can't connect to backend
- Verify backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Look for CORS errors in browser console (F12)

---

## 🎉 Success Checklist

You're fully set up when you see:

- ✅ Backend API running at http://localhost:3000
- ✅ Swagger docs accessible at http://localhost:3000/api/docs
- ✅ Workers running and processing jobs
- ✅ Frontend running at http://localhost:3001
- ✅ Can login with master account
- ✅ Created your business profile
- ✅ Activated Listings successfully
- ✅ See directories changing to "live"
- ✅ Optimization score increasing
- ✅ Can view your business on Google/Yelp (external links work)
- ✅ Stripe subscription visible in dashboard
- ✅ Yext location visible in Yext dashboard

---

## 💰 Billing Flow (How You Get Paid)

**For your own business (testing):**
- You pay yourself $39/mo (Stripe test mode - no real charge)
- 14-day free trial first

**For client businesses:**
1. Client activates Listings from their dashboard
2. Stripe charges their card $39/mo
3. Money goes to YOUR Stripe account
4. You pay Yext ~$15/mo per location (your cost)
5. You profit ~$24/mo per location (60% margin)

**At scale:**
- 100 businesses × $24 profit = **$2,400/mo passive income**
- 500 businesses × $24 profit = **$12,000/mo passive income**
- 1000 businesses × $24 profit = **$24,000/mo passive income**

System runs automatically - no manual work after setup!

---

## 🚀 Next Steps

Once you've tested successfully:

1. **Deploy to production**
   - Use production Stripe keys
   - Use production Yext credentials
   - Deploy to AWS/GCP/Vercel
   - Set up custom domain

2. **Customize branding**
   - Change logo and colors
   - Update email templates
   - White-label for your agency

3. **Add more clients**
   - Each client gets their own business profile
   - Each pays $39/mo subscription
   - All managed from one dashboard

4. **Monitor & scale**
   - Check Stripe dashboard for MRR
   - Monitor Yext sync success rate
   - Scale workers as you grow

---

## 📞 Need Help?

- **Check logs:** All errors appear in terminal windows
- **Prisma Studio:** http://localhost:5555 to inspect database
- **API Docs:** http://localhost:3000/api/docs for API testing
- **Yext Support:** https://hitchhikers.yext.com/community/
- **Stripe Support:** https://support.stripe.com/

---

**You're ready to test! Open http://localhost:3001 and login with your master account.**

**Email:** admin@chaoslistings.com
**Password:** MasterPass123!

🎯 **Test on your own business first, then start adding clients!**
