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

Built with using Next.js and Prisma
