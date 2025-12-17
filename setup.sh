#!/bin/bash

# EveryDay Planner - Quick Start Script
# This script helps you get started quickly

echo "🚀 EveryDay Planner - Quick Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and add your DATABASE_URL"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check if DATABASE_URL is set
if grep -q "postgresql://username:password@localhost" .env; then
    echo "⚠️  WARNING: Please update your DATABASE_URL in .env file"
    echo "   Current value looks like a placeholder"
    echo ""
    echo "   Options:"
    echo "   1. Local PostgreSQL: postgresql://user:pass@localhost:5432/everyday_planner"
    echo "   2. Supabase: Get from supabase.com"
    echo "   3. Vercel Postgres: Get from vercel.com"
    echo "   4. Railway: Get from railway.app"
    echo ""
    read -p "Press Enter when you've updated .env..."
fi

# Run Prisma migrations
echo "🗄️  Setting up database..."
npx prisma migrate dev --name init
echo "✅ Database setup complete"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Create your first account!"
echo ""
echo "📚 Documentation:"
echo "   - SETUP.md - Detailed setup guide"
echo "   - README.md - Full documentation"
echo "   - DEPLOYMENT.md - Deploy to Vercel"
echo ""
echo "Happy planning! 📅✨"
