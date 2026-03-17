# Emergency Queue System - Production Deployment Guide

## 🚀 Pre-Deployment Checklist

Complete all items before deploying to production.

### Code & Build

- [ ] Run `npm run build` - no errors
- [ ] Run `npm run lint` - clean code
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors
- [ ] Security audit pass: `npm audit`
- [ ] Git commits clean, no uncommitted changes
- [ ] Feature branch merged to main
- [ ] Code reviewed and approved

### Database

- [ ] PostgreSQL database created
- [ ] Drizzle migrations run: `npm run db:push`
- [ ] Database backed up (if upgrading)
- [ ] Schema validated
- [ ] Indexes created for performance
- [ ] Connection string tested

### Environment Setup

- [ ] `.env.production` configured
- [ ] All required keys present:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `DATABASE_URL`
  - `OPEN_ROUTER_API_KEY`
  - `NEXT_PUBLIC_API_URL`
- [ ] No hardcoded secrets in code
- [ ] Admin emails configured correctly
- [ ] Image upload bucket configured (if using cloud storage)

### Documentation

- [ ] README.md updated
- [ ] EMERGENCY_QUEUE_SYSTEM_GUIDE.md complete
- [ ] EMERGENCY_QUEUE_QUICK_START.md reviewed
- [ ] API documentation generated (if OpenAPI)
- [ ] Deployment runbook created
- [ ] Rollback procedure documented
- [ ] Incident response plan prepared

---

## 🔧 Environment Configuration

Create `.env.production`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# OpenRouter API (for AI Analysis)
OPEN_ROUTER_API_KEY=sk-or-...

# Next.js
NEXT_PUBLIC_API_URL=https://yourdomain.com
NODE_ENV=production

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin1@hospital.com,admin2@hospital.com

# Optional: Cloud Storage
# NEXT_PUBLIC_STORAGE_BUCKET=your-bucket
# STORAGE_KEY=your-storage-key
```

### Secure Secrets Management

**Option 1: Environment Variables (Simple)**

```bash
export OPEN_ROUTER_API_KEY="your-actual-key"
export DATABASE_URL="postgresql://..."
```

**Option 2: Secret Management Service** (Recommended)

- Vercel: Use "Environment Variables" in project settings
- AWS: Use AWS Secrets Manager
- Azure: Use Azure Key Vault
- Generic: HashiCorp Vault

**Option 3: Docker Secrets** (If containerized)

```yaml
services:
  app:
    environment:
      OPEN_ROUTER_API_KEY: /run/secrets/openrouter_key
    secrets:
      - openrouter_key

secrets:
  openrouter_key:
    file: ./secrets/openrouter_key.txt
```

---

## 📦 Build & Optimization

### Production Build

```bash
# Build the application
npm run build

# Expected output
# ✓ Compiled successfully
# Optimized package size in 3-5 minutes
```

### Optimize for Production

**1. Next.js Optimization**

```next.config.ts
export default {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    // Configure image optimization
    domains: ['yourdomain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable compression
  compress: true,
}
```

**2. Database Connection Pooling**

Configure Drizzle with connection pooling:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  max: 10, // Connection pool size
});

export const db = drizzle(client);
```

**3. API Route Caching**

```typescript
// api/emergency/queue/route.ts
export const revalidate = 5; // ISR: revalidate every 5 seconds

export async function GET() {
  // endpoints are cached for 5 seconds
}
```

### Build Verification

```bash
# Check bundle size
npm list
npm run analyze  # if analyze script exists

# Test the build
npm start

# Verify pages render
# - http://localhost:3000
# - http://localhost:3000/emergency
# - http://localhost:3000/emergency/register
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

**Setup:**

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Enable automatic deployments on push

**Environment Variables in Vercel Dashboard:**

```
DATABASE_URL: [production database URL]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: [key]
CLERK_SECRET_KEY: [key]
OPEN_ROUTER_API_KEY: [key]
NEXT_PUBLIC_ADMIN_EMAILS: admin1@hospital.com,admin2@hospital.com
```

**Deploy:**

```bash
vercel --prod
```

**Verification:**

- [ ] Deployment URL accessible
- [ ] All pages load
- [ ] API endpoints respond
- [ ] Database connection works
- [ ] Auth flows work

### Option 2: Docker + Cloud Run (GCP)

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

**Build & Deploy:**

```bash
# Build image
docker build -t emergency-queue:latest .

# Test locally
docker run -p 3000:3000 emergency-queue:latest

# Push to GCP
gcloud builds submit --tag gcr.io/$PROJECT/emergency-queue

# Deploy to Cloud Run
gcloud run deploy emergency-queue \
  --image gcr.io/$PROJECT/emergency-queue \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=$DB_URL,OPEN_ROUTER_API_KEY=$API_KEY
```

### Option 3: AWS App Runner

**Steps:**

1. Create ECR repository
2. Push Docker image
3. Create App Runner service
4. Configure environment variables
5. Set auto-scaling (min: 1, max: 4 instances)

**CLI:**

```bash
aws ecr create-repository --repository-name emergency-queue

# Build and push
docker build -t emergency-queue .
docker tag emergency-queue:latest $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/emergency-queue
aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/emergency-queue

# Create stack with CloudFormation or AWS CLI
aws apprunner create-service \
  --service-name emergency-queue \
  --source-configuration repositoryType=ECR,ImageRepository={ImageRepositoryType=ECR,ImageIdentifier=$IMAGE_URI}
```

### Option 4: Traditional VPS (Ubuntu/DigitalOcean)

**Setup Server:**

```bash
# SSH into server
ssh root@your-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
npm install -g pm2

# Clone repository
cd /var/www
git clone https://github.com/your-repo/ai-medicalagent.git
cd ai-medicalagent
```

**Configure & Deploy:**

```bash
# Install dependencies
npm ci --only=production

# Build
npm run build

# Create .env.production
nano .env.production
# [Paste configuration]

# Start with PM2
pm2 start npm --name "emergency-queue" -- start
pm2 save
pm2 startup

# Verify
pm2 status
```

**Nginx Reverse Proxy:**

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**SSL Certificate (Let's Encrypt):**

```bash
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d yourdomain.com
```

---

## 🗄️ Database Migration

### Drizzle Migration Steps

**1. Generate Migration**

```bash
npm run db:generate
# Creates migration file in migrations/
```

**2. Review Migration**

```sql
-- migrations/0001_add_emergency_queue.sql
CREATE TABLE "emergency_queue_table" (
  id serial PRIMARY KEY,
  patient_id text UNIQUE NOT NULL,
  -- ... other fields
);
```

**3. Run Migration**

```bash
npm run db:push
# Applies migration to production database
```

### Backup Before Migration

**PostgreSQL Backup:**

```bash
# Full backup
pg_dump -U username -h host -d database > backup.sql

# Compressed backup
pg_dump -U username -h host -d database | gzip > backup.sql.gz

# Verify backup
gunzip -c backup.sql.gz | head -20
```

**AWS RDS Backup:**

```bash
aws rds create-db-snapshot \
  --db-instance-identifier your-db-id \
  --db-snapshot-identifier pre-migrate-snapshot
```

### Rollback Plan

If migration fails:

```bash
# Restore from backup
psql -U username -h host -d database < backup.sql

# Or restore latest snapshot (AWS)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier your-db-restored \
  --db-snapshot-identifier pre-migrate-snapshot
```

---

## 🔒 Security Hardening

### SSL/TLS Certificate

- [ ] HTTPS enabled on production domain
- [ ] Certificate valid and not self-signed
- [ ] Certificate auto-renewal configured
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header enabled

**Enable HSTS:**

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  return response;
}
```

### Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  },
];

export default {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

### Environment Variables Security

- [ ] No secrets in code
- [ ] `.env` file not committed to git
- [ ] `.env.production` loaded from secure storage
- [ ] Secrets rotated regularly (every 90 days recommended)
- [ ] Access logs monitored

### Database Security

```sql
-- Create restricted user for app
CREATE USER app_user WITH PASSWORD 'strong-password';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE emergency TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON emergency_queue_table TO app_user;

-- Enable SSL for connections
ssl = on
```

### Rate Limiting

```typescript
// middleware.ts for API routes
import { rateLimit } from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests
  message: "Too many requests from this IP",
});

// Use in routes
import { limiter } from "@/middleware";

export async function POST(req: Request) {
  // limiter already applied via middleware
}
```

---

## 📊 Monitoring & Observability

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Logging

```typescript
// lib/logger.ts
export const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data),
  error: (msg: string, error: any) => console.error(`[ERROR] ${msg}`, error),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data),
};

// Usage
import { logger } from "@/lib/logger";

logger.error("Approve failed", { caseId, error });
```

### Health Check Endpoint

```typescript
// api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    const result = await db.select().from(EmergencyQueueTable).limit(1);

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    return Response.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 },
    );
  }
}
```

**Monitor health endpoint:**

```bash
# Uptime monitoring with Pingdom/UptimeRobot
curl -f https://yourdomain.com/api/health || exit 1
```

### Performance Monitoring

Use built-in Next.js analytics:

```typescript
// next.config.ts
export default {
  analytics: {
    vercelWebVitals: true,
  },
};
```

---

## 🚨 Incident Response

### If Emergency API Key Exposed

**Immediate:**

1. Revoke current key in OpenRouter dashboard
2. Generate new key
3. Update production `.env` immediately
4. Redeploy application
5. Monitor API for unauthorized usage
6. Check logs for suspicious requests

### If Database Compromised

**Immediate:**

1. Enable backup retention
2. Reset database user passwords
3. Audit recent logins
4. Check for data exfiltration
5. Notify users if PHI exposed
6. Consider database migration

### If Authentication Bypassed

**Immediate:**

1. Check Clerk logs
2. Revoke suspicious sessions
3. Reset affected user passwords
4. Audit role assignments
5. Review API access logs
6. Update authentication rules

### Performance Degradation

**Debug Steps:**

```bash
# 1. Check server resources
top -b -n 1

# 2. Check database slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# 3. Check error logs
docker logs emergency-queue

# 4. Monitor connection pool
SELECT count(*) as connections FROM pg_stat_activity;

# 5. Check queue size
SELECT status, COUNT(*) FROM emergency_queue_table GROUP BY status;
```

---

## 📋 Deployment Checklist

### Pre-Deployment (24 hours before)

- [ ] Code reviewed and merged
- [ ] All tests passing
- [ ] Database backup created
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Rollback plan reviewed
- [ ] Maintenance window scheduled (if needed)

### Deployment Day

- [ ] Final backup taken
- [ ] Database migrations tested (staging first)
- [ ] Environment variables verified
- [ ] Deployment initiated
- [ ] Health checks passing
- [ ] Smoke tests passed
- [ ] Team monitoring alerts
- [ ] Users notified of deployment

### Post-Deployment

- [ ] All endpoints responding correctly
- [ ] User cannot see errors
- [ ] Monitoring data looks normal
- [ ] Performance metrics acceptable
- [ ] No error spikes in logs
- [ ] Continue monitoring for 24 hours
- [ ] Document any issues encountered
- [ ] Close deployment ticket

---

## 📞 Support & Maintenance

### Recovery Time Objectives (RTO)

| Issue                  | RTO    | Recovery                    |
| ---------------------- | ------ | --------------------------- |
| API Down               | 5 min  | Restart service             |
| DB Connection Lost     | 10 min | Failover to backup          |
| Authentication Failing | 15 min | Verify Clerk config         |
| AI Service Down        | 30 min | Use fallback classification |
| Data Corruption        | 1 hour | Restore from backup         |

### Regular Maintenance

**Daily:**

- [ ] Check error logs
- [ ] Monitor queue metrics
- [ ] Verify backups completed

**Weekly:**

- [ ] Review performance metrics
- [ ] Check security alerts
- [ ] Update dependencies (if patches)

**Monthly:**

- [ ] Full database integrity check
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Rotate credentials

**Quarterly:**

- [ ] Disaster recovery drill
- [ ] Capacity planning review
- [ ] Architecture review

---

## 📚 Reference Links

- **Vercel Deployment**: https://vercel.com/docs/deployments/overview
- **Docker Docs**: https://docs.docker.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **Clerk Auth**: https://clerk.com/docs
- **OpenRouter API**: https://openrouter.ai/docs

---

**Deployment Version**: 1.0
**Last Updated**: March 17, 2024
**Next Review**: Quarterly
