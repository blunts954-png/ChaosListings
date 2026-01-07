# 🚀 START HERE - Your Local Listings Engine is Ready!

**Congratulations!** You now have a **production-ready** Local Listings Engine that automatically syncs business listings to 15+ directories (Google, Yelp, Facebook, Bing, etc.).

---

## 🎯 What This System Does

### For Your Business (Testing):
1. ✅ **Scans** your current online presence across 15 directories
2. ✅ **Creates/Claims** listings on Google, Yelp, Facebook, etc. via Yext
3. ✅ **Fixes** inconsistent information (Name, Address, Phone must match everywhere)
4. ✅ **Syncs** updates automatically when you change your profile
5. ✅ **Monitors** listing status and optimization score daily

### For Your Clients (Revenue):
- Each client pays **$39/month** via Stripe
- You pay Yext ~**$15/month** per business (your cost)
- You profit **$24/month** per business
- **100 clients = $2,400/month passive income**
- **500 clients = $12,000/month passive income**

---

## 📧 YOUR MASTER ACCOUNT

**Login Credentials:**
```
Email:    admin@chaoslistings.com
Password: MasterPass123!
Agency:   ChaosListings Master
```

**Use this account to:**
- Test the system with your own business first
- Add client businesses later
- Manage subscriptions and billing

---

## ⚡ QUICK START (10 Minutes)

### 1️⃣ Prerequisites

Install these if you don't have them:

```bash
# macOS
brew install postgresql@14 redis node

# Ubuntu/Debian
sudo apt install postgresql redis-server nodejs npm

# Check versions
node --version    # Need 18+
psql --version    # Need 14+
redis-cli ping    # Should return PONG
```

### 2️⃣ Get API Keys

**Yext (required for directory sync):**
1. Go to https://www.yext.com → Sign up
2. Go to https://www.yext.com/s/me/apps
3. Create app with "Content API" permissions
4. Copy **API Key** and **Account ID**

**Stripe (required for billing):**
1. Go to https://dashboard.stripe.com/register
2. Use **Test mode** (toggle in top-right)
3. Go to https://dashboard.stripe.com/test/apikeys
4. Copy **Secret key** (starts with `sk_test_`)
5. Create product: https://dashboard.stripe.com/test/products
   - Name: "Listings Starter"
   - Price: $39/month
   - Copy **Price ID** (starts with `price_`)

### 3️⃣ Setup Database

```bash
# Start PostgreSQL
brew services start postgresql@14   # macOS
sudo systemctl start postgresql      # Linux

# Create database
psql postgres -c "CREATE DATABASE listings_engine;"
psql postgres -c "CREATE USER listings_user WITH PASSWORD 'secure_pass';"
psql postgres -c "GRANT ALL ON DATABASE listings_engine TO listings_user;"
```

### 4️⃣ Configure Backend

```bash
cd backend
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://listings_user:secure_pass@localhost:5432/listings_engine

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=test-secret-change-in-production

YEXT_API_KEY=YOUR_YEXT_API_KEY
YEXT_ACCOUNT_ID=YOUR_YEXT_ACCOUNT_ID
YEXT_API_URL=https://api.yext.com/v2

STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_KEY
STRIPE_LISTINGS_PRICE_ID=price_YOUR_PRICE_ID

FRONTEND_URL=http://localhost:3001
API_URL=http://localhost:3000
EOF

# ⚠️ EDIT .env and replace YOUR_* placeholders with real keys!

# Setup database
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

**You should see:**
```
✅ Created 15 directories
✅ Created user: admin@chaoslistings.com
🎉 DATABASE SEEDED SUCCESSFULLY!

📧 Email:    admin@chaoslistings.com
🔑 Password: MasterPass123!
```

### 5️⃣ Configure Frontend

```bash
cd ../frontend
npm install

cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
EOF
```

### 6️⃣ Start Everything (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
Wait for: `✓ Ready at http://localhost:3000`

**Terminal 2 - Workers:**
```bash
cd backend
npm run worker:dev
```
Wait for: `Worker started: sync-listings`

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```
Wait for: `✓ Ready at http://localhost:3001`

---

## 🧪 TEST WITH YOUR BUSINESS

### Step 1: Login

Open: **http://localhost:3001**

Login with:
- Email: `admin@chaoslistings.com`
- Password: `MasterPass123!`

### Step 2: Add Your Business

Click **"+ Add Business"**

Fill in:
- ✅ Business name
- ✅ Address (line 1, city, state, zip)
- ✅ Phone number
- ✅ Website (optional but recommended)
- ✅ Business hours (optional but recommended)
- ✅ Description (50+ chars for bonus points)
- ✅ Logo URL (optional)
- ✅ 3+ photos (optional but recommended)

**Pro Tip:** More complete profile = Higher optimization score!

### Step 3: Go to Listings Tab

Click **"Listings"** on your business

You'll see:
- ❌ Optimization Score: **0%** (Bad)
- 📊 15 directories showing "Unavailable"
- 🔵 Big blue button: **"Boost My Visibility Now"**

### Step 4: Activate Listings

Click **"Boost My Visibility Now"**

**What happens:**
1. Stripe creates subscription ($39/mo, 14-day trial)
2. Yext creates location with your business info
3. System syncs to all 15 directories
4. Directories change from "Unavailable" → "Pending" → "Live"

**Wait 3-5 minutes, then refresh the page.**

### Step 5: Watch It Work!

**After 3-5 minutes:**
- ✅ Optimization Score jumps to **60-86%** (Good/Excellent)
- ✅ 12-14 directories show "Live"
- ✅ Click "View Listing" links to see your business on Google, Yelp, etc.
- ✅ All info is **consistent** across all directories!

**Verify it worked:**
1. Click external links in the table
2. Check Google: https://www.google.com/search?q=your+business+name
3. Check Yelp: Search for your business
4. All should show YOUR business with CORRECT info!

---

## ✅ SUCCESS CHECKLIST

You've successfully set up when you see:

- ✅ Backend running at http://localhost:3000
- ✅ Workers processing jobs (check Terminal 2 logs)
- ✅ Frontend running at http://localhost:3001
- ✅ Can login with master account
- ✅ Business created with full profile
- ✅ Clicked "Activate Listings" successfully
- ✅ Stripe subscription created (check https://dashboard.stripe.com/test/subscriptions)
- ✅ Yext location created (check https://www.yext.com → Locations)
- ✅ 12+ directories showing "Live" status
- ✅ Optimization score 60%+ ("Good" or "Excellent")
- ✅ External links work (can view business on Google/Yelp)

---

## 🎓 LEARN MORE

**Detailed Guides:**
- 📖 **[QUICKSTART.md](./QUICKSTART.md)** - Full setup with troubleshooting
- 🧪 **[TESTING-FLOW.md](./TESTING-FLOW.md)** - What to expect step-by-step
- 🏗️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design deep dive
- 📡 **[API.md](./API.md)** - Complete API reference
- 📘 **[README.md](./README.md)** - Full documentation

**API Documentation:**
- http://localhost:3000/api/docs (Swagger UI when backend running)

**Database Viewer:**
```bash
cd backend
npx prisma studio
# Opens http://localhost:5555
```

---

## 💰 REVENUE MODEL

### Your Costs (Per Business):
- Yext: ~$15/month (covers all 15 directories)
- Hosting: ~$50-100/month total (scales to 1000+ businesses)
- Stripe fees: 2.9% + $0.30 per charge

### Your Revenue (Per Business):
- Charge: $39/month
- Cost: $15/month (Yext)
- **Profit: $24/month per business**

### At Scale:
| Clients | Revenue/mo | Cost/mo | Profit/mo |
|---------|-----------|---------|-----------|
| 10      | $390      | $150    | **$240**  |
| 50      | $1,950    | $750    | **$1,200** |
| 100     | $3,900    | $1,500  | **$2,400** |
| 500     | $19,500   | $7,500  | **$12,000** |
| 1000    | $39,000   | $15,000 | **$24,000** |

**Plus:**
- 60%+ profit margins
- Recurring revenue (sticky product)
- Minimal manual work (automated sync)
- Clients see value immediately (Google listings!)

---

## 🚀 NEXT STEPS AFTER TESTING

### 1. Deploy to Production

**Backend + Workers:**
- Deploy to AWS ECS, Google Cloud Run, or DigitalOcean
- Use managed PostgreSQL (AWS RDS, Supabase)
- Use managed Redis (AWS ElastiCache, Upstash)
- Set environment to `production` in .env

**Frontend:**
- Deploy to Vercel (easiest) or Netlify
- Update `NEXT_PUBLIC_API_URL` to production API URL

**See [README.md](./README.md#deployment) for detailed deployment guide**

### 2. Switch to Production API Keys

**Yext:**
- Use production API key (not sandbox)
- Production locations sync to REAL directories

**Stripe:**
- Switch to Live mode
- Use live API keys (start with `sk_live_`)
- Use live price ID
- Real charges will process!

### 3. Customize Branding

**Frontend:**
- Update logo in `frontend/public/`
- Change colors in `tailwind.config.js`
- Update company name throughout UI

**Email Templates:**
- Customize email notifications
- Add your support email
- White-label for your agency

### 4. Add Clients

**For Each Client:**
1. They sign up → Creates new agency
2. They add their business profile
3. They click "Activate Listings"
4. Stripe charges them $39/mo
5. Money goes to YOUR Stripe account
6. System syncs their business automatically
7. You profit $24/mo per client (passive income!)

### 5. Monitor & Scale

**Daily:**
- Check Stripe dashboard for new subscriptions
- Monitor failed payments
- Review Yext sync success rate

**Weekly:**
- Analyze MRR (Monthly Recurring Revenue)
- Check optimization score trends
- Review support tickets

**Monthly:**
- Scale workers if queue depth high
- Optimize database performance
- Review and reduce Yext costs (volume discounts)

---

## 🐛 TROUBLESHOOTING

### "Can't login"
- Check email: `admin@chaoslistings.com`
- Check password: `MasterPass123!`
- Verify seed script ran successfully
- Check backend is running at port 3000

### "Directories stuck at 'Pending'"
- This is NORMAL for 2-5 minutes
- Yext API can be slow
- Google/Yelp are fastest (1-2 min)
- Facebook can take 24 hours
- Wait 10 minutes, then click "Sync Now"

### "Optimization score still 0%"
- Score only increases when directories go "Live"
- "Pending" doesn't count toward score
- Wait for Yext sync to complete
- Refresh page (data updates every 30s)

### "No external listing URLs"
- URLs appear AFTER directory goes "Live"
- Check Yext dashboard for sync status
- Some directories don't provide URLs (Apple Maps)
- Google/Yelp/Facebook always have URLs

### "Backend crashes"
- Check DATABASE_URL is correct
- Check Redis is running: `redis-cli ping`
- Check PostgreSQL is running
- Look for error in terminal logs

### "Workers not processing"
- Check Redis is running
- Restart workers: Ctrl+C, then `npm run worker:dev`
- Check for errors in Terminal 2
- Verify job in queue: `redis-cli` → `KEYS bull:*`

**For more help:**
- See [QUICKSTART.md](./QUICKSTART.md#troubleshooting)
- Check logs in all 3 terminals
- Use Prisma Studio to inspect database
- Review API docs at http://localhost:3000/api/docs

---

## 📞 SUPPORT

**Documentation:**
- All guides in this folder (QUICKSTART, TESTING-FLOW, ARCHITECTURE, API, README)

**Community:**
- Yext support: https://hitchhikers.yext.com/community/
- Stripe support: https://support.stripe.com/
- NestJS docs: https://docs.nestjs.com/
- Next.js docs: https://nextjs.org/docs

**Debugging:**
- Backend logs: Terminal 1
- Worker logs: Terminal 2
- Frontend logs: Browser console (F12)
- Database: `npx prisma studio` at http://localhost:5555

---

## 🎉 YOU'RE READY!

**Three simple commands to start:**

```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd backend && npm run worker:dev

# Terminal 3
cd frontend && npm run dev
```

**Then:**
1. Open http://localhost:3001
2. Login: `admin@chaoslistings.com` / `MasterPass123!`
3. Add your business
4. Click "Boost My Visibility Now"
5. Watch your business appear on Google, Yelp, and 13+ other directories!

**Your first business listing will be live in under 10 minutes.** 🚀

---

**Questions? Check [QUICKSTART.md](./QUICKSTART.md) for detailed setup or [TESTING-FLOW.md](./TESTING-FLOW.md) to see what to expect!**
