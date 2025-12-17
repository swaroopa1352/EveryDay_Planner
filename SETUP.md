# EveryDay Planner - Setup Instructions

## Quick Start

Follow these steps to get your app running locally:

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Set Up Environment Variables

\`\`\`bash

# Copy the example environment file

cp .env.example .env
\`\`\`

Edit the \`.env\` file with your database credentials:

\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/everyday_planner?schema=public"
SESSION_SECRET="your-secret-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

**For local development with PostgreSQL:**

- Replace \`username\` with your PostgreSQL username (usually \`postgres\`)
- Replace \`password\` with your PostgreSQL password
- The database \`everyday_planner\` will be created automatically

**Don't have PostgreSQL installed?**

- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac**: \`brew install postgresql\`
- **Linux**: \`sudo apt-get install postgresql\`

Or use a cloud database (see below).

### 3. Set Up the Database

Run Prisma migrations to create your database schema:

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

This command will:

- Create the database if it doesn't exist
- Create all necessary tables
- Generate the Prisma Client

### 4. Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) - your app should be running!

---

## Alternative: Use Cloud Database (No Local PostgreSQL Needed)

If you don't want to install PostgreSQL locally, use a free cloud database:

### Option 1: Supabase (Recommended for beginners)

1. Go to [supabase.com](https://supabase.com)
2. Create a free account
3. Create a new project
4. Go to Settings > Database
5. Copy the "Connection string" (use the "Connection pooling" URL)
6. Paste it in your \`.env\` file as \`DATABASE_URL\`

### Option 2: Vercel Postgres

1. Sign up at [vercel.com](https://vercel.com)
2. Create a new project
3. Go to Storage tab
4. Create a Postgres database
5. Copy the connection string
6. Paste it in your \`.env\` file

### Option 3: Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL
4. Copy the DATABASE_URL
5. Paste it in your \`.env\` file

---

## Verify Everything Works

### 1. Test Registration

- Go to http://localhost:3000
- Create a new account
- You should see a welcome screen

### 2. Create a Plan

- Select a date
- Add some tasks
- Click "Save Plan"

### 3. Test Persistence

- Refresh the page
- Login again
- Your tasks should still be there!

---

## Next Steps

- ✅ App is running locally
- 📖 Read [README.md](README.md) for full documentation
- 🚀 Ready to deploy? See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Common Issues

### "Connection refused" or "Connection timeout"

**Problem**: Can't connect to PostgreSQL

**Solutions**:

- Check if PostgreSQL is running: \`pg_isready\` (Mac/Linux) or check Windows Services
- Verify DATABASE_URL is correct
- Try using a cloud database instead (see above)

### "Prisma Client not found"

**Problem**: Prisma Client wasn't generated

**Solution**:
\`\`\`bash
npx prisma generate
\`\`\`

### Port 3000 already in use

**Problem**: Another app is using port 3000

**Solution**:
\`\`\`bash

# Kill the process on port 3000

# Windows

netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux

lsof -ti:3000 | xargs kill

# Or use a different port

PORT=3001 npm run dev
\`\`\`

### Build errors with TypeScript

**Problem**: TypeScript compilation errors

**Solution**:
\`\`\`bash

# Clear Next.js cache

rm -rf .next

# Reinstall dependencies

rm -rf node_modules package-lock.json
npm install

# Try again

npm run dev
\`\`\`

---

## Development Tools

### Prisma Studio (Database GUI)

View and edit your database:

\`\`\`bash
npx prisma studio
\`\`\`

Opens at [http://localhost:5555](http://localhost:5555)

### Reset Database (Development Only)

⚠️ **Warning**: This deletes all data!

\`\`\`bash
npx prisma migrate reset
\`\`\`

---

## Need Help?

- 📚 Check [README.md](README.md) for detailed documentation
- 🚀 See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- 🐛 Found a bug? Open an issue on GitHub

Happy planning! 📅✨
