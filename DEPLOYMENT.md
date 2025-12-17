# Deploying to Vercel - Quick Guide

## Prerequisites

- GitHub account
- Vercel account (sign up at vercel.com)

## Step-by-Step Deployment

### 1. Push to GitHub

\`\`\`bash

# Initialize git (if not already done)

git init
git add .
git commit -m "Initial commit - EveryDay Planner Next.js app"

# Create a new repository on GitHub, then:

git remote add origin https://github.com/YOUR_USERNAME/everyday-planner.git
git branch -M main
git push -u origin main
\`\`\`

### 2. Set up PostgreSQL Database

**Option A: Vercel Postgres (Recommended for simplicity)**

1. Go to [vercel.com](https://vercel.com) and login
2. Navigate to Storage tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a region close to your users
6. Click "Create"
7. Copy the connection string from the `.env.local` tab

**Option B: Supabase (Free tier available)**

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (use "connection pooling" URL for better performance)

**Option C: Railway (Easy setup)**

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL database
4. Copy the DATABASE_URL from the Connect tab

### 3. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Configure Project:
   - Framework Preset: **Next.js**
   - Build Command: Leave default (or use: \`prisma generate && next build\`)
   - Install Command: Leave default
5. Add Environment Variables:

   Click "Environment Variables" and add:

   \`\`\`
   DATABASE_URL = postgresql://user:password@host:5432/dbname
   SESSION_SECRET = [generate with: openssl rand -base64 32]
   NEXT_PUBLIC_APP_URL = https://your-app-name.vercel.app
   \`\`\`

   **Important**: Replace DATABASE_URL with your actual connection string

6. Click "Deploy"

### 4. Run Database Migrations

After first deployment, you need to set up the database schema:

**Method 1: Using Vercel CLI**

\`\`\`bash

# Install Vercel CLI

npm i -g vercel

# Login

vercel login

# Pull environment variables

vercel env pull .env.local

# Run migration

npx prisma migrate deploy
\`\`\`

**Method 2: From your local machine**

\`\`\`bash

# Set DATABASE_URL to your production database

export DATABASE_URL="your-production-database-url"

# Run migration

npx prisma migrate deploy
\`\`\`

### 5. Verify Deployment

1. Visit your deployed app: \`https://your-app-name.vercel.app\`
2. Try registering a new user
3. Create a daily plan
4. Verify data persists after logout/login

## Environment Variables

Required for production:

| Variable                | Description                  | Example                                 |
| ----------------------- | ---------------------------- | --------------------------------------- |
| \`DATABASE_URL\`        | PostgreSQL connection string | \`postgresql://user:pass@host:5432/db\` |
| \`SESSION_SECRET\`      | Random secret for sessions   | Generate: \`openssl rand -base64 32\`   |
| \`NEXT_PUBLIC_APP_URL\` | Your app's public URL        | \`https://your-app.vercel.app\`         |

## Post-Deployment

### Custom Domain (Optional)

1. Go to your project in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update \`NEXT_PUBLIC_APP_URL\` environment variable

### Monitor Your App

- **Vercel Dashboard**: View deployments, logs, and analytics
- **Prisma Studio**: Run \`npx prisma studio\` locally to view database

### Update Your App

Just push to GitHub - Vercel will automatically redeploy:

\`\`\`bash
git add .
git commit -m "Your update message"
git push
\`\`\`

## Troubleshooting

### Build Fails with Prisma Error

Add this to your Vercel project settings:

- Go to Settings > General > Build & Development Settings
- Build Command: \`prisma generate && next build\`

### Database Connection Timeout

- Check if your database allows connections from Vercel's IP ranges
- For Supabase: Use connection pooling URL
- For Railway: Enable public networking

### Session Issues

- Verify \`SESSION_SECRET\` is set
- Check cookie settings in production (secure flag)

### Migrations Not Running

Ensure you've run \`prisma migrate deploy\` after first deployment:

\`\`\`bash

# Pull env vars from Vercel

vercel env pull .env.local

# Deploy migrations

npx prisma migrate deploy
\`\`\`

## Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

Need help? Open an issue on GitHub!
