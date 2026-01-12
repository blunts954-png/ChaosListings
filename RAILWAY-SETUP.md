# 🚂 Railway Database Setup - Quick Guide

## What is Railway?

Railway is a cloud platform that gives you a free PostgreSQL database with:
- ✅ 5GB storage
- ✅ 100 hours/month free
- ✅ Automatic backups
- ✅ No credit card required
- ✅ Perfect for development & testing

---

## Step-by-Step Setup

### 1. Create Railway Account

1. Go to: https://railway.app
2. Click **"Start a New Project"**
3. Sign in with GitHub (instant, no forms to fill)

### 2. Create PostgreSQL Database

1. Click **"New Project"**
2. Select **"Provision PostgreSQL"**
3. Wait 10 seconds - done!

### 3. Get Database Connection URL

1. Click the **PostgreSQL** box (purple)
2. Go to **"Connect"** tab
3. Copy the **DATABASE_URL**

It will look like this:
```
postgresql://postgres:randompassword123@containers-us-west-1.railway.app:5432/railway
```

### 4. Update Your Backend

Paste the DATABASE_URL into `backend/.env`:

```bash
DATABASE_URL=postgresql://postgres:randompassword123@containers-us-west-1.railway.app:5432/railway
```

### 5. Run Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Start Backend

```bash
npm run start:dev
```

---

## That's It!

Your backend will now be connected to a real cloud database. You can:
- ✅ Create real accounts
- ✅ Add real businesses
- ✅ Test everything locally
- ✅ Deploy to production later (same database works!)

---

## Troubleshooting

**"Cannot connect to database"**
- Make sure you copied the FULL URL (starts with `postgresql://`)
- Check that Railway shows the database is running (green status)

**"Out of storage"**
- Free tier has 5GB - plenty for thousands of businesses
- Upgrade to paid plan ($5/mo) if needed

**"Connection timeout"**
- Railway free tier sleeps after 30 min of inactivity
- Just refresh the Railway dashboard to wake it up

---

## Alternative: Supabase

If you prefer Supabase instead:

1. Go to: https://supabase.com
2. Create new project
3. Wait 2 minutes for database to provision
4. Copy connection string from Settings → Database
5. Use same steps above to configure

Supabase gives you:
- ✅ 500MB storage (free)
- ✅ 2 databases per project
- ✅ Built-in Auth (optional, we're not using it)
- ✅ REST API to your database (optional)

---

**Railway vs Supabase for ListingsIQ:**

| Feature | Railway | Supabase |
|---------|---------|----------|
| Storage | 5GB | 500MB |
| Setup Speed | 1 minute | 2 minutes |
| Best For | Simple databases | Full backend-as-a-service |

**Recommendation:** Use Railway for ListingsIQ (more storage, simpler)
