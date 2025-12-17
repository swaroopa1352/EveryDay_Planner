# EveryDay Planner

A beautiful, secure daily planning application built with Next.js, Prisma, and PostgreSQL. Manage your tasks, must-dos, and reminders with a clean, intuitive interface.

## Features

- 🔐 **Secure Authentication** - PIN-based login with bcrypt hashing
- 📅 **Daily Planning** - Organize tasks into To-Do, Must-Do, and Reminders
- 🎨 **Beautiful UI** - Modern design with Tailwind CSS
- 💾 **Persistent Storage** - PostgreSQL database with Prisma ORM
- 🔄 **Drag & Drop** - Move tasks between To-Do and Must-Do lists
- ☁️ **Cloud Ready** - Optimized for Vercel deployment
- 👥 **Multi-User Support** - Each user has their own account and data

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Custom PIN-based with bcrypt
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud like Vercel Postgres, Supabase, etc.)
- npm or yarn package manager

## Getting Started

### 1. Clone the repository

\`\`\`bash
git clone <your-repo-url>
cd EveryDay-Planner
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install

# or

yarn install
\`\`\`

### 3. Set up environment variables

Create a \`.env\` file in the root directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` and add your database URL:

\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/everyday_planner?schema=public"
SESSION_SECRET="your-secret-key-change-this-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

**Important**: Replace the DATABASE_URL with your actual PostgreSQL connection string.

### 4. Set up the database

Run Prisma migrations to create your database schema:

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

This will:

- Create the database tables
- Generate the Prisma Client

### 5. Run the development server

\`\`\`bash
npm run dev

# or

yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### View database in Prisma Studio

\`\`\`bash
npx prisma studio
\`\`\`

This opens a GUI to view and edit your database at [http://localhost:5555](http://localhost:5555)

### Reset database (development only)

\`\`\`bash
npx prisma migrate reset
\`\`\`

## Deployment to Vercel

### 1. Create a Vercel account

Sign up at [vercel.com](https://vercel.com)

### 2. Set up a PostgreSQL database

Choose one of these options:

**Option A: Vercel Postgres (Recommended)**

- In your Vercel dashboard, go to Storage
- Create a new Postgres database
- Copy the connection string

**Option B: External Provider (Supabase, Railway, etc.)**

- Create a database with your preferred provider
- Copy the connection string

### 3. Deploy to Vercel

**Via Vercel CLI:**

\`\`\`bash

# Install Vercel CLI

npm i -g vercel

# Login

vercel login

# Deploy

vercel
\`\`\`

**Via GitHub (Recommended):**

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Add environment variables:
   - \`DATABASE_URL\` - Your PostgreSQL connection string
   - \`SESSION_SECRET\` - A random secret string (generate one with: \`openssl rand -base64 32\`)
5. Click "Deploy"

### 4. Run database migrations on Vercel

After deployment, run migrations:

\`\`\`bash
vercel env pull .env.local
npx prisma migrate deploy
\`\`\`

Or set up a build command in Vercel settings to include: \`prisma generate && prisma migrate deploy && next build\`

## Environment Variables for Production

Required environment variables in Vercel:

\`\`\`env
DATABASE_URL="your-production-database-url"
SESSION_SECRET="your-secure-random-secret"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
\`\`\`

## Project Structure

\`\`\`
EveryDay-Planner/
├── app/
│ ├── api/
│ │ ├── auth/ # Authentication endpoints
│ │ │ ├── register/ # User registration
│ │ │ ├── login/ # User login
│ │ │ ├── logout/ # User logout
│ │ │ └── session/ # Session check
│ │ └── plans/ # Daily plans CRUD
│ ├── layout.tsx # Root layout
│ ├── page.tsx # Home page
│ └── globals.css # Global styles
├── components/
│ ├── PlannerApp.tsx # Main app component
│ └── DailyPlannerView.tsx # Daily planner interface
├── lib/
│ ├── prisma.ts # Prisma client
│ ├── auth.ts # Auth helpers
│ └── types.ts # TypeScript types
├── prisma/
│ └── schema.prisma # Database schema
├── .env.example # Example environment variables
├── package.json
└── README.md
\`\`\`

## Features Breakdown

### User Registration

- Name, gender, and PIN (4-6 digits)
- PIN securely hashed with bcrypt
- Day start time and time format preferences

### Daily Planning

- **To-Do**: Regular tasks with checkboxes
- **Must-Do**: Priority tasks (drag items from To-Do)
- **Reminders**: Quick notes without checkboxes
- Drag & drop between To-Do and Must-Do
- Auto-save with dirty state tracking
- Unsaved changes warning

### Security

- PIN hashed with bcrypt (10 salt rounds)
- HTTP-only session cookies
- Database-level user isolation
- SQL injection prevention via Prisma

## API Endpoints

### Authentication

- \`POST /api/auth/register\` - Create new user
- \`POST /api/auth/login\` - Login user
- \`POST /api/auth/logout\` - Logout user
- \`GET /api/auth/session\` - Get current session

### Plans

- \`GET /api/plans?date=YYYY-MM-DD\` - Get plan for date
- \`POST /api/plans\` - Save/update plan
- \`DELETE /api/plans?date=YYYY-MM-DD\` - Delete plan

## Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check if PostgreSQL is running
- Ensure database exists

### Prisma Client Issues

\`\`\`bash
npx prisma generate
\`\`\`

### Build Errors

\`\`\`bash

# Clear cache

rm -rf .next
npm run build
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and Prisma
