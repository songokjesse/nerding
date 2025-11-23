# Nerding - NDIS Support Worker Management System

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Components](#components)
- [Deployment](#deployment)
- [TypeScript Patterns](#typescript-patterns)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Nerding** is a multi-tenant web application designed for managing NDIS (National Disability Insurance Scheme) support workers, clients, shifts, progress notes, and monthly reports. The platform supports multiple organizations with role-based access control at both the system and organization levels.

### Key Capabilities
- **Multi-tenancy**: Multiple organizations can operate independently within the same system
- **Organization-Centric Dashboard**: Comprehensive dashboard showing organization stats, recent clients, upcoming shifts, and activity at a glance
- **Client Management**: Track NDIS clients with personal details and notes
- **Shift Scheduling**: Plan and manage support worker shifts
- **Progress Notes**: Document client progress with incident, behavior, and medication flags
- **Monthly Reports**: Generate AI-assisted monthly reports for clients
- **Role-Based Access**: System-level (ADMIN, MANAGER, EMPLOYEE, VIEWER) and organization-level (ORG_ADMIN, COORDINATOR, WORKER, VIEWER) roles

---

## Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **React**: v19.2.0
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/) with [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/) v7
- **Authentication**: [Better Auth](https://www.better-auth.com/) v1.4.0
- **Database Adapter**: Prisma Adapter for PostgreSQL

### Development Tools
- **TypeScript**: v5
- **ESLint**: v9
- **Babel React Compiler**: For optimized React builds

---

## Project Structure

```
nerding/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── auth/                 # Authentication endpoints
│   ├── dashboard/                # Dashboard pages
│   │   ├── admin/                # System admin pages
│   │   ├── clients/              # Client management
│   │   ├── members/              # Organization member management
│   │   └── profile/              # User profile
│   ├── sign-in/                  # Sign-in page
│   ├── sign-up/                  # Sign-up page
│   ├── onboarding/               # New user onboarding
│   ├── banned/                   # Banned user page
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # Shadcn/ui components
│   ├── dashboard/                # Dashboard-specific components
│   └── admin/                    # Admin-specific components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Better Auth configuration
│   ├── auth-client.ts            # Client-side auth utilities
│   ├── prisma.ts                 # Prisma client instance
│   └── utils.ts                  # General utilities
├── prisma/                       # Database schema and migrations
│   └── schema.prisma             # Prisma schema definition
├── generated/                    # Generated Prisma client
├── public/                       # Static assets
└── .env                          # Environment variables
```

---

## Database Schema

### Core Models

#### User
The central user model with system-level roles and authentication data.

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  role          Role      @default(VIEWER)
  banned        Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

**System Roles**:
- `ADMIN`: Full system access, can manage users and organizations
- `MANAGER`: Can manage organization settings
- `EMPLOYEE`: Standard user access
- `VIEWER`: Read-only access

#### Organisation
Multi-tenant organization model.

```prisma
model Organisation {
  id           String   @id @default(uuid())
  name         String
  billingEmail String?
  plan         String   @default("free")
  createdAt    DateTime @default(now())
}
```

#### OrganisationMember
Junction table linking users to organizations with organization-specific roles.

```prisma
model OrganisationMember {
  id             String       @id @default(uuid())
  organisationId String
  userId         String
  role           OrgRole      @default(WORKER)
  createdAt      DateTime     @default(now())
  
  @@unique([organisationId, userId])
}
```

**Organization Roles**:
- `ORG_ADMIN`: Full organization access
- `COORDINATOR`: Can manage clients and shifts
- `WORKER`: Can view assigned shifts and add notes
- `VIEWER`: Read-only organization access

#### Client
NDIS clients managed by organizations.

```prisma
model Client {
  id             String       @id @default(uuid())
  organisationId String
  name           String
  ndisNumber     String?
  dateOfBirth    DateTime?
  notes          String?
  createdAt      DateTime     @default(now())
  createdById    String?
}
```

#### Shift
Support worker shifts assigned to clients.

```prisma
model Shift {
  id             String       @id @default(uuid())
  organisationId String
  clientId       String
  workerId       String
  startTime      DateTime
  endTime        DateTime
  status         ShiftStatus  @default(PLANNED)
  serviceType    String?
  location       String?
  createdAt      DateTime     @default(now())
  createdById    String?
}
```

**Shift Statuses**:
- `PLANNED`: Scheduled but not yet completed
- `COMPLETED`: Successfully completed
- `CANCELLED`: Cancelled shift
- `NO_SHOW`: Worker or client did not show up

#### ProgressNote
Notes documenting client progress during shifts.

```prisma
model ProgressNote {
  id             String       @id @default(uuid())
  organisationId String
  clientId       String
  shiftId        String
  authorId       String
  noteText       String
  incidentFlag   Boolean      @default(false)
  behavioursFlag Boolean      @default(false)
  medicationFlag Boolean      @default(false)
  mood           String?
  goalId         String?
  createdAt      DateTime     @default(now())
}
```

#### MonthlyReport
AI-generated monthly reports for clients.

```prisma
model MonthlyReport {
  id             String       @id @default(uuid())
  organisationId String
  clientId       String
  reportMonth    DateTime
  summaryText    String
  metricsJson    Json?
  generatedByAI  Boolean      @default(true)
  createdAt      DateTime     @default(now())
  createdById    String?
  reviewedById   String?
  
  @@unique([organisationId, clientId, reportMonth])
}
```

---

## Authentication & Authorization

### Authentication Flow

The application uses **Better Auth** for authentication with email/password support.

#### Sign Up
1. User submits email, name, and password via [`/sign-up`](file:///Users/codelab/Desktop/Projects/nerding/app/sign-up/page.tsx)
2. Better Auth creates user with default `VIEWER` role
3. User is redirected to onboarding

#### Sign In
1. User submits email and password via [`/sign-in`](file:///Users/codelab/Desktop/Projects/nerding/app/sign-in/page.tsx)
2. Better Auth validates credentials
3. Session is created and stored in database
4. User is redirected to dashboard

#### Session Management
- Sessions are stored in PostgreSQL via Prisma adapter
- Session tokens are HTTP-only cookies
- Sessions include IP address and user agent tracking

### Authorization Levels

#### System-Level Authorization
Controlled by the `User.role` field:
- **ADMIN**: Can access [`/dashboard/admin`](file:///Users/codelab/Desktop/Projects/nerding/app/dashboard/admin) to manage all users and ban accounts
- **MANAGER/EMPLOYEE/VIEWER**: Standard dashboard access

#### Organization-Level Authorization
Controlled by the `OrganisationMember.role` field:
- **ORG_ADMIN**: Full organization management
- **COORDINATOR**: Client and shift management
- **WORKER**: View assigned shifts, add progress notes
- **VIEWER**: Read-only access to organization data

### Protected Routes
All routes under `/dashboard/*` require authentication. Banned users are redirected to [`/banned`](file:///Users/codelab/Desktop/Projects/nerding/app/banned).

---

## Features

### 1. Organization-Centric Dashboard
- **Overview at a glance**: See your organization name, plan, and key metrics immediately
- **Real-time statistics**: Total clients, team members, and shifts this week
- **Recent clients**: View the 5 most recently added clients with quick links
- **Upcoming shifts**: See the next 5 planned shifts with worker assignments
- **Recent activity**: Monitor the latest 5 progress notes with incident/behavior/medication flags
- **Quick actions**: Fast access to common tasks like adding clients or viewing members
- **Server-side rendered**: Fast page loads with no client-side loading spinners
- Located at: [`/dashboard`](file:///Users/codelab/Desktop/Projects/nerding/app/dashboard)

### 2. User Management (System Admins)
- View all users in the system
- Promote users to different system roles
- Ban/unban user accounts
- Located at: [`/dashboard/admin`](file:///Users/codelab/Desktop/Projects/nerding/app/dashboard/admin)

### 3. Client Management
- Create, view, update clients
- Track NDIS numbers and dates of birth
- Add client notes
- Organization-scoped: Only see clients in your organization
- Located at: [`/dashboard/clients`](file:///Users/codelab/Desktop/Projects/nerding/app/dashboard/clients)

### 4. Organization Member Management
- View organization members
- Manage organization-level roles
- Invite new members
- Located at: [`/dashboard/members`](file:///Users/codelab/Desktop/Projects/nerding/app/dashboard/members)

### 5. Shift Management
- Schedule shifts for clients
- Assign support workers
- Track shift status (Planned, Completed, Cancelled, No Show)
- Record service type and location

### 6. Progress Notes
- Document client progress during shifts
- Flag incidents, behaviors, and medication events
- Track client mood and goals
- Link notes to specific shifts

### 7. Monthly Reports
- Generate AI-assisted monthly summaries
- Store metrics in JSON format
- Track report creation and review

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nerding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory (see [Environment Variables](#environment-variables))

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. Sign up for an account at `/sign-up`
2. Promote your account to ADMIN using the utility script:
   ```bash
   npx tsx promote-user.ts <your-email>
   ```
3. Access the admin panel at `/dashboard/admin`

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nerding"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Email configuration (for email verification)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
```

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Secret key for session encryption (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: Base URL of your application

---

## API Routes

### Authentication
- `POST /api/auth/sign-up` - Create new user account
- `POST /api/auth/sign-in` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out current user
- `GET /api/auth/session` - Get current session

### Better Auth
All Better Auth endpoints are available at `/api/auth/*` via the Better Auth handler.

---

## Components

### UI Components (Shadcn/ui)
Located in [`components/ui/`](file:///Users/codelab/Desktop/Projects/nerding/components/ui):
- `button.tsx` - Button component
- `input.tsx` - Input field
- `textarea.tsx` - Textarea field
- `label.tsx` - Form label
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialog
- `dropdown-menu.tsx` - Dropdown menu
- `select.tsx` - Select dropdown
- `table.tsx` - Data table
- `avatar.tsx` - User avatar
- `form.tsx` - Form wrapper with validation

### Dashboard Components
Located in [`components/dashboard/`](file:///Users/codelab/Desktop/Projects/nerding/components/dashboard):
- `navbar.tsx` - Dashboard navigation bar
- `client-form.tsx` - Client creation/editing form
- `stat-card.tsx` - Reusable statistics card with icon
- `recent-clients.tsx` - Widget showing recently added clients
- `upcoming-shifts.tsx` - Widget showing upcoming planned shifts
- `recent-activity.tsx` - Widget showing recent progress notes with flags
- `quick-actions.tsx` - Quick action buttons for common tasks

### Admin Components
Located in [`components/admin/`](file:///Users/codelab/Desktop/Projects/nerding/components/admin):
- `user-table.tsx` - Admin user management table
- `ban-user-button.tsx` - User ban/unban control

---

## Deployment

### Database Setup
1. Provision a PostgreSQL database (e.g., on Railway, Supabase, or Neon)
2. Update `DATABASE_URL` in production environment
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Vercel Deployment
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
Ensure all environment variables are set in your hosting platform:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (set to your production domain)

---

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio

# Promote user to admin
npx tsx promote-user.ts <email>
```

---

## TypeScript Patterns

### Role-Based Permission Checking

When checking if a user has one of multiple allowed roles, you need to use a type assertion to avoid TypeScript errors.

#### The Problem
```typescript
// ❌ This will cause a TypeScript error
const canEdit = membership && [OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)
```

**Error**: `Argument of type 'OrgRole' is not assignable to parameter of type '"ORG_ADMIN" | "COORDINATOR"'`

**Why**: TypeScript infers the array type as `("ORG_ADMIN" | "COORDINATOR")[]`, which is narrower than the `OrgRole` type (which includes all four values: `ORG_ADMIN`, `COORDINATOR`, `WORKER`, `VIEWER`). The `.includes()` method can't accept the broader type.

#### The Solution
```typescript
// ✅ Use a type assertion
const canEdit = membership && ([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)
```

The `as OrgRole[]` type assertion tells TypeScript to treat the array as accepting any `OrgRole` value, allowing the `.includes()` method to properly check membership.

#### Usage Examples

**Client editing permissions**:
```typescript
const canEdit = membership && ([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)
```

**Shift management permissions**:
```typescript
const canManageShifts = membership && ([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)
```

**Admin-only actions**:
```typescript
const isAdmin = membership && membership.role === OrgRole.ORG_ADMIN
```

---

## Troubleshooting

### Common Issues

#### "Cannot find module" errors
- Run `npm install` to ensure all dependencies are installed
- For Shadcn/ui components, use `npx shadcn@latest add <component-name>`

#### Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network connectivity to database

#### Authentication issues
- Verify `BETTER_AUTH_SECRET` is set
- Check `BETTER_AUTH_URL` matches your domain
- Clear browser cookies and try again

#### Prisma client errors
- Run `npx prisma generate` to regenerate the client
- Check that migrations are up to date with `npx prisma migrate status`

#### TypeScript errors with OrgRole checking
- **Error**: `Argument of type 'OrgRole' is not assignable to parameter of type '"ORG_ADMIN" | "COORDINATOR"'`
- **Fix**: Use type assertion: `([OrgRole.ORG_ADMIN, OrgRole.COORDINATOR] as OrgRole[]).includes(membership.role)`
- See [TypeScript Patterns](#typescript-patterns) for detailed explanation

---

## Contributing

### Code Style
- Use TypeScript for all new files
- Follow ESLint configuration
- Use Prettier for formatting (if configured)
- Write meaningful commit messages

### Pull Request Process
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit PR with description of changes

---

## License

This project is private and proprietary.

---

## Support

For issues or questions, please contact the development team.

---

**Last Updated**: November 23, 2025
