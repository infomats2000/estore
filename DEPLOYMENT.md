# StoreERP Vercel & Production Deployment Guide

This guide outlines all environment variables, Vercel configurations, database setup procedures, and deployment steps required for production hosting.

---

## 1. Required Environment Variables

| Variable Name | Required? | Purpose & Description | Example Value |
|---|---|---|---|
| `DATABASE_URL` | **YES** | PostgreSQL pooled connection URL for runtime API queries (e.g. Neon, Supabase, Vercel Postgres). | `postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/estore?sslmode=require` |
| `DIRECT_URL` | **Recommended** | Direct non-pooled PostgreSQL URL for running `npx prisma migrate deploy` and schema migrations. | `postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/estore?sslmode=require&direct=true` |
| `JWT_SECRET` | **YES** | Secret key used to sign and verify JSON Web Tokens for authentication. | `a_super_secret_jwt_key_32_chars_min` |
| `APP_URL` | Optional | Primary public domain of your application. | `https://infomats.net` |
| `NODE_ENV` | Optional | Set to `production` in Vercel settings. | `production` |
| `STRIPE_SECRET_KEY` | Optional | Stripe API secret key for tenant subscription payments. | `sk_live_51...` |

> 💡 **Note on Vercel Integration**: If using Vercel Postgres or Neon integration, Vercel automatically defines `POSTGRES_URL` and `PRISMA_DATABASE_URL`. StoreERP automatically maps these variables to `DATABASE_URL` at runtime.

---

## 2. Vercel Project Settings

- **Framework Preset**: `Vite`
- **Root Directory**: `./` (Project root)
- **Build Command**: `npm run vercel-build` (Runs `prisma generate && vite build`)
- **Output Directory**: `dist`
- **Node.js Version**: `18.x` or `20.x`

---

## 3. Database Migrations (`prisma migrate deploy`)

For production PostgreSQL databases:

```bash
# Run database migrations against production database
npx prisma migrate deploy

# Seed SaaS plans and initial Super Admin user
npx tsx src/server/seedSaaS.ts
```

> **Why `prisma migrate deploy`?**
> `prisma migrate deploy` executes pending SQL migrations against production without resetting or prompting for interactive input, ensuring safe zero-downtime schema updates.

---

## 4. Deployment Checklist

- [x] Set `DATABASE_URL` in Vercel Environment Variables (Production & Preview).
- [x] Set `JWT_SECRET` in Vercel Environment Variables (Production & Preview).
- [x] Enable `binaryTargets = ["native", "rhel-openssl-1.0.x", "rhel-openssl-3.0.x"]` in `prisma/schema.prisma`.
- [x] Run `npx prisma migrate deploy` against the target PostgreSQL instance.
- [x] Run `npx tsx src/server/seedSaaS.ts` to initialize `admin@infomats.net` Super Admin.
- [x] Deploy to Vercel via Git (`git push origin master:main`).

---

## 5. Common Deployment Pitfalls & Prevention

1. **Missing `DATABASE_URL`**:
   - *Symptom*: Login fails with 500 error.
   - *Fix*: Ensure `DATABASE_URL` or `POSTGRES_URL` is configured in Vercel Settings.
2. **Missing Linux Binaries**:
   - *Symptom*: `PrismaClientInitializationError: Could not locate query engine binary`.
   - *Fix*: `binaryTargets` in `schema.prisma` must include `rhel-openssl-3.0.x`.
3. **Module Resolution Ambiguity**:
   - *Symptom*: `Cannot find module './routes'` on Linux serverless functions.
   - *Fix*: Differentiate route files from directories (e.g. `legacyRoutes.ts` vs `routes/`).
