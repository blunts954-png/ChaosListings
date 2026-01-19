# Production Deployment Guide - ListingsIQ

## 🚀 Pre-Launch Checklist

### Critical Security Items
- [x] ✅ Rotated exposed GEMINI_API_KEY
- [ ] ⚠️ Generate new production secrets (run `node backend/scripts/generate-secrets.js`)
- [ ] Set all environment variables in deployment platform
- [ ] Configure SSL/TLS certificates
- [ ] Enable database backups (daily minimum)
- [ ] Test Stripe webhook integration
- [ ] Verify email delivery works
- [ ] Review CORS whitelist

### Application Readiness
- [x] ✅ Fixed Dockerfile.backend entry point
- [x] ✅ Implemented email notifications for payments
- [x] ✅ Added Yext webhook signature verification
- [x] ✅ Enabled Sentry error tracking
- [x] ✅ Added environment variable validation
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Load testing with 1000+ users

---

## 📋 Deployment Options Comparison

### Option 1: Railway (Recommended - Easiest)

**Pros:**
- ✅ Zero-config PostgreSQL and Redis
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL/TLS
- ✅ Generous free tier
- ✅ Great for MVP/small scale

**Cons:**
- ⚠️ More expensive at scale
- ⚠️ Less control over infrastructure

**Cost:** Free tier → $5/month (hobby) → $20/month (pro)

**Deployment Steps:**
1. Connect GitHub repository
2. Add Railway PostgreSQL plugin
3. Add Railway Redis plugin (optional)
4. Set environment variables (see below)
5. Deploy automatically

### Option 2: Render

**Pros:**
- ✅ Free tier for PostgreSQL
- ✅ Automatic deployments
- ✅ Simple configuration
- ✅ Good documentation

**Cons:**
- ⚠️ Free tier spins down after inactivity
- ⚠️ Slower builds than Railway

**Cost:** Free tier → $7/month (starter) → $25/month (standard)

### Option 3: Docker Compose on VPS (Most Control)

**Pros:**
- ✅ Full control
- ✅ Predictable costs
- ✅ Can scale horizontally
- ✅ Best for production at scale

**Cons:**
- ⚠️ Requires DevOps knowledge
- ⚠️ Manual SSL setup
- ⚠️ You manage backups

**Cost:** $5-20/month for VPS (DigitalOcean, Linode, etc.)

**Recommended VPS Specs:**
- 2 vCPUs
- 4GB RAM
- 80GB SSD
- Ubuntu 22.04 LTS

### Option 4: Netlify (Frontend) + Railway/Render (Backend)

**Pros:**
- ✅ Best frontend performance (CDN)
- ✅ Easy frontend deployments
- ✅ Great developer experience

**Cons:**
- ⚠️ Managing two platforms
- ⚠️ CORS configuration needed

**Cost:** Free (Netlify) + $5-20 (backend platform)

---

## 🔐 Environment Variables Configuration

### Generate Secrets First

```bash
cd backend
node scripts/generate-secrets.js
```

This will generate secure random values for:
- JWT_SECRET
- REDIS_PASSWORD
- YEXT_WEBHOOK_SECRET
- SESSION_SECRET

### Required Production Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com

# Database (Auto-set by Railway/Render, or manual for VPS)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Authentication (CRITICAL - Use generated secret!)
JWT_SECRET=<paste-generated-secret-here>
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Email Service (Choose one)
EMAIL_PROVIDER=sendgrid  # or 'smtp'
SENDGRID_API_KEY=SG.xxx  # If using SendGrid
EMAIL_FROM=noreply@your-domain.com

# OR for SMTP:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Third-Party Integrations
YEXT_API_KEY=your_yext_api_key
YEXT_ACCOUNT_ID=your_yext_account_id
YEXT_WEBHOOK_SECRET=<paste-generated-secret>
YELP_API_KEY=your_yelp_api_key

# Google Business (OAuth)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=https://your-backend/api/v1/auth/google/callback

# Redis (Optional - for background jobs)
REDIS_HOST=localhost          # or Redis cloud host
REDIS_PORT=6379
REDIS_PASSWORD=<paste-generated-password>
REDIS_TLS=true               # true for production

# Error Tracking
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional: AI Features
GEMINI_API_KEY=your_new_gemini_key  # Generate new key!

# Security
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## 🚢 Deployment Instructions by Platform

### Railway Deployment

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your repo
   - Select `blunts954-png/ChaosListings`

3. **Add Database**
   - In project dashboard, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will auto-set DATABASE_URL

4. **Add Redis (Optional)**
   - Click "New" → "Database" → "Redis"
   - Railway will auto-set REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

5. **Configure Environment Variables**
   - Click on your service → "Variables"
   - Add all required variables from the list above
   - ⚠️ CRITICAL: Set strong JWT_SECRET!

6. **Set Build Configuration** (if not auto-detected)
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm run start:prod`
   - Watch Paths: `backend/**`

7. **Configure Domain**
   - Settings → "Networking" → Generate domain
   - Or add custom domain

8. **Run Database Migrations**
   ```bash
   # SSH into Railway or use CLI
   railway run npm run prisma:migrate:deploy
   ```

9. **Deploy Frontend to Netlify**
   - Connect GitHub repo
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/.next`
   - Add NEXT_PUBLIC_API_URL environment variable

### Render Deployment

1. **Create Account at [render.com](https://render.com)**

2. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Name: `listingsiq-db`
   - Plan: Free or Starter ($7/month)
   - Copy Internal Database URL

3. **Create Redis Instance (Optional)**
   - New → Redis
   - Free tier available

4. **Create Web Service**
   - New → Web Service
   - Connect GitHub repository
   - Name: `listingsiq-api`
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm run start:prod`

5. **Add Environment Variables**
   - In web service settings
   - Add all variables from the list
   - Set DATABASE_URL to the internal database URL

6. **Deploy**
   - Render will auto-deploy on git push

### Docker Compose on VPS

1. **Provision VPS**
   ```bash
   # DigitalOcean, Linode, Vultr, etc.
   # Ubuntu 22.04 LTS, 2 vCPUs, 4GB RAM
   ```

2. **Install Dependencies**
   ```bash
   # SSH into VPS
   ssh root@your-vps-ip

   # Update system
   apt update && apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt install docker-compose -y

   # Install Git
   apt install git -y
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/blunts954-png/ChaosListings.git
   cd ChaosListings
   git checkout main
   ```

4. **Create Production Environment File**
   ```bash
   cp backend/.env.production backend/.env
   nano backend/.env
   # Paste all production variables
   # Save and exit
   ```

5. **Generate Secrets**
   ```bash
   node backend/scripts/generate-secrets.js
   # Copy output and update .env file
   ```

6. **Start Services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

7. **Run Migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:deploy
   ```

8. **Set Up SSL with Let's Encrypt**
   ```bash
   # Install Certbot
   apt install certbot python3-certbot-nginx -y

   # Get SSL certificate
   certbot --nginx -d your-domain.com -d api.your-domain.com
   ```

9. **Configure Nginx** (See docker-compose.prod.yml)

10. **Set Up Backups**
    ```bash
    # Add to crontab
    crontab -e

    # Add daily backup at 2 AM
    0 2 * * * docker-compose -f /path/to/docker-compose.prod.yml exec -T postgres pg_dump -U postgres listingsiq > /backups/db_$(date +\%Y\%m\%d).sql
    ```

---

## 🗃️ Database Setup

### Run Migrations

**Railway/Render:**
```bash
# Use platform CLI or SSH
railway run npm run prisma:migrate:deploy
# or
render ssh <service-id> 'npm run prisma:migrate:deploy'
```

**Docker:**
```bash
docker-compose exec backend npm run prisma:migrate:deploy
```

**Local/VPS:**
```bash
cd backend
npm run prisma:migrate:deploy
```

### Seed Initial Data (Optional)

```bash
npm run prisma:db:seed
```

This will create:
- Default directories (Google, Yelp, Facebook, etc.)
- Sample data for testing

---

## 🧪 Testing Checklist

### Before Going Live

1. **Authentication Flow**
   ```bash
   # Test registration
   curl -X POST https://your-api/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","agencyName":"Test Agency"}'

   # Test login
   # Test JWT refresh
   ```

2. **Stripe Integration**
   - Use Stripe test mode first
   - Trigger test webhook events
   - Verify email notifications sent

3. **Email Delivery**
   ```bash
   # Send test welcome email
   # Check spam folder
   # Verify links work
   ```

4. **Database Connection**
   ```bash
   # Check logs for connection errors
   # Verify migrations ran
   # Test read/write operations
   ```

5. **Load Testing**
   ```bash
   # Install k6 or artillery
   npm install -g artillery

   # Run load test
   artillery quick --count 100 --num 10 https://your-api/api/health
   ```

---

## 📊 Monitoring & Alerts

### Set Up Sentry

1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Node.js)
3. Copy DSN
4. Add to environment variables: `SENTRY_DSN=https://...`
5. Deploy and trigger test error

### Set Up Uptime Monitoring

**Free Options:**
- [UptimeRobot](https://uptimerobot.com) - 50 monitors free
- [Freshping](https://www.freshworks.com/website-monitoring/) - 50 checks free
- [StatusCake](https://www.statuscake.com) - Limited free tier

**What to Monitor:**
- API health endpoint: `https://your-api/api/health`
- Frontend: `https://your-frontend.com`
- Database connection: `https://your-api/api/health/ready`

### Logging

**Railway:** Built-in logs (7 days retention)

**Render:** Built-in logs (7 days retention)

**VPS:**
```bash
# View Docker logs
docker-compose logs -f backend

# View specific service
docker-compose logs -f postgres

# Save logs to file
docker-compose logs backend > backend.log
```

---

## 🔒 Security Hardening

### SSL/TLS

- ✅ Railway/Render: Automatic HTTPS
- ⚠️ VPS: Use Let's Encrypt (see Docker setup above)

### Firewall (VPS Only)

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Database Security

```bash
# Restrict PostgreSQL to localhost (VPS)
# Edit postgresql.conf
listen_addresses = 'localhost'

# Use strong passwords
# Enable SSL connections in production
```

### Regular Updates

```bash
# Set up automatic security updates (Ubuntu)
apt install unattended-upgrades -y
dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# Check if migrations ran
npm run prisma:studio
```

**2. Email Not Sending**
```bash
# Check SENDGRID_API_KEY is valid
# Verify EMAIL_FROM domain is verified
# Check spam folder
# Review application logs
```

**3. Stripe Webhooks Failing**
```bash
# Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
# Check webhook endpoint URL is correct
# Test with Stripe CLI:
stripe listen --forward-to https://your-api/api/webhooks/stripe
```

**4. CORS Errors**
```bash
# Ensure FRONTEND_URL matches exactly (no trailing slash)
# Check browser console for specific error
# Verify credentials: true in backend
```

**5. High Memory Usage**
```bash
# Check for memory leaks
# Review connection pool size
# Monitor Redis memory
# Consider upgrading VPS/plan
```

---

## 📈 Scaling Considerations

### When to Scale

- Response times > 500ms consistently
- CPU usage > 70%
- Memory usage > 80%
- Database connections maxed out

### Horizontal Scaling

**Railway/Render:**
- Increase replicas in dashboard
- Both support auto-scaling on paid plans

**VPS:**
```bash
# Add load balancer
# Deploy multiple backend instances
# Use Redis for session storage
# Implement database read replicas
```

### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_business_agency ON business(agency_id);
CREATE INDEX idx_listing_business ON listing(business_id);

-- Monitor slow queries
-- Use connection pooling (already configured)
-- Consider database caching layer
```

---

## 💰 Cost Estimates

### Small Business (< 100 users)
- **Railway:** $5-10/month
- **Render:** Free - $7/month
- **VPS:** $5-10/month
- **Total:** $5-20/month

### Medium Business (100-1000 users)
- **Railway:** $20-50/month
- **Render:** $25-50/month
- **VPS:** $20-40/month
- **Total:** $20-50/month

### Large Business (1000+ users)
- **Dedicated infrastructure recommended**
- **Consider AWS/GCP/Azure**
- **Budget: $100-500+/month**

---

## ✅ Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations completed
- [ ] SSL certificate active
- [ ] Sentry receiving errors (test with intentional error)
- [ ] Email delivery working (send test emails)
- [ ] Stripe webhooks configured and tested
- [ ] Backup strategy implemented
- [ ] Monitoring/alerts configured
- [ ] Domain DNS configured
- [ ] CORS configured for frontend domain
- [ ] Documentation updated with production URLs
- [ ] Team access configured
- [ ] Incident response plan documented

---

## 📞 Support Resources

- **Application Issues:** Create issue on GitHub
- **Railway Support:** https://railway.app/help
- **Render Support:** https://render.com/docs
- **Stripe Support:** https://support.stripe.com
- **Database Issues:** Check platform documentation

---

## 🔄 CI/CD Setup (Optional)

GitHub Actions workflow is already configured (`.github/workflows/ci.yml`).

To enable:
1. Add DOCKERHUB_USERNAME and DOCKERHUB_TOKEN to GitHub Secrets
2. Push to main branch triggers automatic deploy
3. Tests run before deployment

---

**Last Updated:** 2026-01-19
**Version:** 1.0.0
