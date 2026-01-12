# 🚀 Deploy ChaosListings to Netlify

## Quick Deploy (5 Minutes)

### Option 1: Deploy from GitHub (Recommended)

**Step 1: Push to GitHub**
```bash
# Initialize git if not already done
cd c:\Users\Aarons\chaoslist\ChaosListings
git init
git add .
git commit -m "Initial commit - ChaosListings ready for deployment"

# Create repo on GitHub and push
# Go to github.com → New repository → "chaoslistings"
git remote add origin https://github.com/YOUR_USERNAME/chaoslistings.git
git branch -M main
git push -u origin main
```

**Step 2: Connect to Netlify**
1. Go to https://app.netlify.com
2. Sign up / Log in (use GitHub account for easier connection)
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose **"GitHub"**
5. Select your **chaoslistings** repository
6. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`
   - **Node version**: 18

**Step 3: Set Environment Variables**

In Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add these variables:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.com/api/v1
   NODE_VERSION = 18
   ```

   Note: For now, you can use a placeholder for API URL. The frontend works in demo mode without it!

**Step 4: Deploy**
1. Click **"Deploy site"**
2. Wait 2-3 minutes for build
3. Your site will be live at: `https://random-name-123.netlify.app`

**Step 5: Custom Domain (Optional)**
1. In Netlify: **Domain settings** → **Add custom domain**
2. Add your domain (e.g., `chaoslistings.com`)
3. Follow DNS instructions
4. Free SSL certificate is automatically provisioned!

---

### Option 2: Deploy via Netlify CLI

**Step 1: Install Netlify CLI**
```bash
npm install -g netlify-cli
```

**Step 2: Login**
```bash
netlify login
```
This opens your browser to authenticate.

**Step 3: Deploy**
```bash
cd frontend

# Build the project
npm run build

# Deploy
netlify deploy

# Follow prompts:
# - Create new site? Yes
# - Team: Your team
# - Site name: chaoslistings (or whatever you want)
# - Publish directory: .next

# Once you verify it works, deploy to production:
netlify deploy --prod
```

Your site is now live!

---

### Option 3: Drag & Drop Deploy

**Step 1: Build locally**
```bash
cd frontend
npm run build
```

**Step 2: Deploy**
1. Go to https://app.netlify.com/drop
2. Drag the `.next` folder onto the page
3. Done! Site is live immediately

**Note**: This method doesn't support continuous deployment. Use GitHub method for automatic updates.

---

## Environment Variables

### Frontend Environment Variables

Create these in Netlify dashboard (Site settings → Environment variables):

```env
# Backend API URL (optional for demo mode)
NEXT_PUBLIC_API_URL=https://your-backend.herokuapp.com/api/v1

# Or leave it as localhost for demo mode
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**Important**: The `NEXT_PUBLIC_` prefix makes the variable available in the browser.

---

## Backend Deployment (Later)

When you're ready to deploy the backend:

### Option 1: Railway.app (Easiest)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repo
5. Choose `backend` folder
6. Railway auto-detects NestJS and sets up PostgreSQL + Redis
7. Add environment variables in Railway dashboard
8. Copy the URL Railway gives you
9. Update `NEXT_PUBLIC_API_URL` in Netlify to point to Railway URL

### Option 2: Render.com
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Root directory: `backend`
5. Build command: `npm install && npx prisma generate && npm run build`
6. Start command: `npm run start:prod`
7. Add environment variables
8. Create PostgreSQL database (Render provides free tier)
9. Copy URL and update Netlify

### Option 3: Heroku
```bash
# Install Heroku CLI
# Create app
heroku create chaoslistings-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Add Redis
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git subtree push --prefix backend heroku main
```

---

## Continuous Deployment

Once connected to GitHub, every push automatically triggers a new deployment:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Netlify automatically:
# 1. Detects the push
# 2. Runs npm install
# 3. Runs npm run build
# 4. Deploys new version
# 5. Updates your live site (2-3 minutes)
```

---

## Custom Domain Setup

### Step 1: Buy a Domain
- Namecheap.com (~$10/year)
- Google Domains (~$12/year)
- GoDaddy.com (~$15/year)

### Step 2: Configure DNS in Netlify
1. Netlify dashboard → **Domain settings**
2. Click **"Add custom domain"**
3. Enter your domain: `chaoslistings.com`
4. Netlify shows you DNS records to add

### Step 3: Update DNS at Your Registrar
Go to your domain registrar (Namecheap/Google/etc) and add:

**For Netlify DNS (Recommended):**
```
Name Servers:
- dns1.p0x.netlify.com
- dns2.p0x.netlify.com
- dns3.p0x.netlify.com
- dns4.p0x.netlify.com
```

**OR, for A records:**
```
A Record: @ → 75.2.60.5
CNAME: www → your-site.netlify.app
```

### Step 4: Wait & Verify
- DNS propagation: 5 minutes - 48 hours (usually 15 minutes)
- Netlify automatically provisions FREE SSL certificate
- Your site will be at: `https://chaoslistings.com` ✅

---

## Troubleshooting

### Build Fails
**Error**: "Module not found"
**Fix**: Make sure all dependencies are in `package.json`:
```bash
cd frontend
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### "This page could not be found"
**Cause**: Next.js routing issue
**Fix**: Already handled in `netlify.toml` with redirect rules

### API Calls Fail
**Expected**: If backend isn't deployed yet, API calls will fail
**Solution**: Frontend works in demo mode! Deploy backend when ready.

### Environment Variables Not Working
**Issue**: Variables must start with `NEXT_PUBLIC_` to be available in browser
**Fix**:
```env
# ❌ Wrong
API_URL=https://example.com

# ✅ Correct
NEXT_PUBLIC_API_URL=https://example.com
```

---

## Performance Optimization

Netlify automatically provides:
- ✅ Global CDN (fast worldwide)
- ✅ SSL certificate (HTTPS)
- ✅ Gzip compression
- ✅ Asset optimization
- ✅ Automatic prerendering
- ✅ Edge caching

Your site will load in < 1 second! 🚀

---

## Monitoring

### Netlify Analytics (Paid, but worth it)
- Real visitor data (not sampled like Google Analytics)
- No cookies needed (GDPR friendly)
- $9/month per site

### Free Alternatives
- Google Analytics (add to `frontend/src/app/layout.tsx`)
- Vercel Analytics (free tier available)
- Plausible (privacy-focused, ~$9/month)

---

## Cost Summary

### Free Tier (Perfect for starting)
- Netlify hosting: **$0/month**
- 100GB bandwidth/month
- Unlimited sites
- Automatic HTTPS
- Good for ~10,000 visitors/month

### When to Upgrade ($19/month)
- Need more bandwidth (300GB)
- Want Netlify Analytics
- Need advanced deploy controls
- Have 50,000+ visitors/month

---

## Next Steps After Deployment

1. **Share Your Live Site**: Send `https://your-site.netlify.app` to potential customers

2. **Set Up Custom Domain**: Makes it look professional ($10/year)

3. **Deploy Backend**: When you get first paying customer
   - Railway.app (easiest)
   - Update API URL in Netlify

4. **Add Analytics**: See who's visiting your site

5. **SEO Optimization**:
   - Add meta descriptions
   - Create sitemap
   - Submit to Google Search Console

6. **Create Landing Page Content**:
   - Customer testimonials
   - Screenshots/demos
   - Pricing page
   - Contact form

---

## Your Site is Now Live! 🎉

**Frontend URL**: `https://your-site.netlify.app`

**What works**:
- ✅ Beautiful landing page
- ✅ Authentication UI
- ✅ Dashboard (demo mode)
- ✅ Mobile responsive
- ✅ Fast loading (< 1 sec)
- ✅ HTTPS secure

**Next**: Deploy backend when ready, or start showing this to customers now!

---

## Quick Commands Reference

```bash
# Build locally
cd frontend && npm run build

# Deploy with CLI
netlify deploy --prod

# Check deploy status
netlify status

# Open live site
netlify open:site

# View logs
netlify logs

# Set environment variable
netlify env:set NEXT_PUBLIC_API_URL "https://api.example.com"
```

**Questions?** Check https://docs.netlify.com or the main README.md

Your frontend is production-ready and will look amazing to customers! 🚀
