@echo off
REM EveryDay Planner - Quick Start Script for Windows
REM This script helps you get started quickly

echo =======================================
echo  EveryDay Planner - Quick Setup
echo =======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo .env file created
    echo.
    echo WARNING: Please edit .env and add your DATABASE_URL
    echo.
) else (
    echo .env file already exists
    echo.
)

REM Install dependencies
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed
echo.

REM Check if DATABASE_URL needs updating
findstr /C:"postgresql://username:password@localhost" .env >nul
if %errorlevel% equ 0 (
    echo WARNING: Please update your DATABASE_URL in .env file
    echo Current value looks like a placeholder
    echo.
    echo Options:
    echo 1. Local PostgreSQL: postgresql://user:pass@localhost:5432/everyday_planner
    echo 2. Supabase: Get from supabase.com
    echo 3. Vercel Postgres: Get from vercel.com
    echo 4. Railway: Get from railway.app
    echo.
    pause
)

REM Run Prisma migrations
echo Setting up database...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo ERROR: Database setup failed
    echo Please check your DATABASE_URL in .env
    pause
    exit /b 1
)
echo Database setup complete
echo.

REM Generate Prisma Client
echo Generating Prisma Client...
call npx prisma generate
echo Prisma Client generated
echo.

echo =======================================
echo  Setup Complete!
echo =======================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Open: http://localhost:3000
echo 3. Create your first account!
echo.
echo Documentation:
echo   - SETUP.md - Detailed setup guide
echo   - README.md - Full documentation
echo   - DEPLOYMENT.md - Deploy to Vercel
echo.
echo Happy planning!
echo.
pause
