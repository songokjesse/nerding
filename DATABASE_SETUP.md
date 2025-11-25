# Database Setup Guide

This guide explains how to set up the database for the NDIS Care Management application.

## Prerequisites

- PostgreSQL database server running
- Node.js and npm installed
- `.env` file configured with database connection string

## Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Auth (Better Auth)
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
```

## Database Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Migrations

Apply all migrations to create the database schema:

```bash
npx prisma migrate deploy
```

This will run all migrations in order:
1. `20251123120159_init_multitenancy` - Initial schema with users, organizations, clients, shifts, progress notes, and reports
2. `20251125003134_add_observations_and_modules` - Adds clinical observations and client modules

### 3. Generate Prisma Client

Generate the Prisma client for type-safe database access:

```bash
npx prisma generate
```

### 4. (Optional) Seed Database

If you have a seed script, run it to populate initial data:

```bash
npx prisma db seed
```

## Development Workflow

### Creating New Migrations

When you modify the Prisma schema:

```bash
# Create a new migration
npx prisma migrate dev --name description_of_changes

# This will:
# 1. Create a new migration file
# 2. Apply it to your database
# 3. Regenerate the Prisma client
```

### Resetting the Database

To reset your database and reapply all migrations:

```bash
npx prisma migrate reset
```

⚠️ **Warning:** This will delete all data in your database!

### Viewing Database

Use Prisma Studio to view and edit data:

```bash
npx prisma studio
```

## Schema Overview

### Core Models

- **User** - Application users with authentication
- **Organisation** - Multi-tenant organizations
- **OrganisationMember** - User membership in organizations with roles
- **Client** - NDIS clients receiving care
- **Shift** - Scheduled care shifts
- **ProgressNote** - Notes written during shifts
- **MonthlyReport** - Monthly summary reports

### Clinical Observation Models

- **ClientModule** - Enabled clinical modules per client
- **Observation** - Clinical observations (bowel, fluid, seizure, behaviour)

### Enums

- **Role** - System-level roles (ADMIN, MANAGER, EMPLOYEE, VIEWER)
- **OrgRole** - Organization-level roles (ORG_ADMIN, COORDINATOR, WORKER, VIEWER)
- **ShiftStatus** - Shift statuses (PLANNED, COMPLETED, CANCELLED, NO_SHOW)
- **ModuleType** - Clinical module types (BOWEL_MONITORING, FLUID_INTAKE, BEHAVIOUR_OBSERVATION, SEIZURE_MONITORING)

## Troubleshooting

### Migration Conflicts

If you encounter migration conflicts:

```bash
# Mark migrations as applied without running them
npx prisma migrate resolve --applied migration_name

# Or reset and start fresh (development only)
npx prisma migrate reset
```

### Connection Issues

If you can't connect to the database:

1. Check your `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running
3. Verify database credentials
4. Check firewall settings

### Schema Drift

If your database schema doesn't match your Prisma schema:

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

## Production Deployment

For production deployments:

```bash
# Apply migrations (doesn't create new ones)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

Never use `prisma migrate dev` in production!

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Better Auth Documentation](https://www.better-auth.com/docs)
