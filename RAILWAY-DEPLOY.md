# Deploy Backend to Railway

## Step 1: Push Code to GitHub

```bash
# Make sure all changes are committed
cd backend
git add -A
git commit -m "Add Railway deployment configuration"
cd ..
git push origin claude/local-listings-engine-3jfLj
```

## Step 2: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `ChaosListings` repository
5. Select branch: `claude/local-listings-engine-3jfLj`
6. Railway will auto-detect it's a Node.js project

## Step 3: Configure Root Directory

1. In Railway project settings, click on your service
2. Go to **Settings** tab
3. Find **"Root Directory"** setting
4. Set it to: `backend`
5. Click **Save**

## Step 4: Add Environment Variables

In Railway dashboard, go to **Variables** tab and add these:

### Required Variables:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:pbaoccjhrCDnvzqzFejNppmjlJJlpJPd@crossover.proxy.rlwy.net:13181/railway
FRONTEND_URL=https://listingsiq.netlify.app
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS
```

### Email (SendGrid):
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@listingsiq.com
```

### Stripe (Get from https://dashboard.stripe.com/test/apikeys):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Google OAuth (Get from https://console.cloud.google.com/):
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend-url.railway.app/api/v1/auth/google/callback
```

### Yelp API (Get from https://www.yelp.com/developers):
```
YELP_API_KEY=your_yelp_api_key
```

### Optional:
```
GEMINI_API_KEY=your_gemini_api_key
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379
DATABASE_POOL_SIZE=20
```

## Step 5: Deploy

1. Railway will automatically deploy after you set the root directory
2. Wait for build to complete (3-5 minutes)
3. Railway will give you a public URL like: `https://your-app.railway.app`

## Step 6: Update Netlify

1. Go to Netlify dashboard: https://app.netlify.com/sites/listingsiq/settings
2. Click **"Environment variables"**
3. Add variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-url.railway.app`
4. Click **Save**
5. Go to **Deploys** tab and click **"Trigger deploy"** → **"Clear cache and deploy site"**

## Step 7: Test Connection

After both deployments are complete:

```bash
# Test backend health
curl https://your-backend-url.railway.app/api/v1/health

# Test frontend
open https://listingsiq.netlify.app
```

## Troubleshooting

### Build Fails?
- Check Railway logs for errors
- Make sure `backend` is set as root directory
- Verify all environment variables are set

### Database Connection Issues?
- Verify DATABASE_URL is correct
- Check Railway logs for Prisma errors
- Run `npx prisma generate` might be needed

### CORS Errors?
- Make sure FRONTEND_URL in Railway matches your Netlify URL exactly
- Check Railway logs for CORS errors

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created from GitHub repo
- [ ] Root directory set to `backend`
- [ ] Environment variables configured
- [ ] Deployment successful (check logs)
- [ ] Backend URL obtained
- [ ] Netlify env variable `NEXT_PUBLIC_API_URL` updated
- [ ] Netlify redeployed with new env variable
- [ ] Health check works: `/api/v1/health`
- [ ] Frontend can reach backend

## What You'll Get

After deployment:
- **Backend:** https://your-app.railway.app
- **Frontend:** https://listingsiq.netlify.app
- **Database:** Already connected (Railway PostgreSQL)
- **API Docs:** https://your-app.railway.app/api/docs (Swagger)

## Next Steps After Deployment

1. Set up Stripe webhook endpoint
2. Configure Google OAuth redirect URLs
3. Test user registration and login
4. Start building features!
