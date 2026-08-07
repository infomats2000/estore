# Store ERP performance and hosting-cost implementation

## Measured bundle results

| Artifact | Before | After |
| --- | ---: | ---: |
| Public application entry (raw) | 1,515.78 kB | 218.81 kB |
| Public application entry (gzip) | not previously emitted | 58.28 kB |
| Tenant dashboard (raw) | 1,049.67 kB after first split | 295.58 kB |
| Tenant dashboard (gzip) | 196.86 kB after first split | 56.53 kB |

POS, Super Admin, settings, inventory, reports, finance, purchasing, WMS and other ERP suites are separate on-demand chunks.

## Persistence

- Normal state changes use `tenant_state_records`, one row per tenant/domain/record.
- Existing JSON/domain-slice state is imported once through the authenticated migration endpoint.
- Deletes are persisted individually and no normal UI path sends the full application snapshot.
- Legacy state remains a temporary read fallback for tenants that have not completed their first authenticated import.
- Products, customers, orders, settings and POS retain their dedicated relational APIs.

## Database migrations

Apply in staging and production with:

```powershell
npm run db:deploy
```

New migrations add tenant state records, migration-safe state slices, query indexes and upload accounting. Do not use `prisma migrate dev` in production.

## Production environment

Configure object storage:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=store-erp-assets
TENANT_STORAGE_QUOTA_MB=1024
SEED_ON_STARTUP=false
LOG_REQUESTS=false
```

The service-role key is server-only and must never be exposed through Vite/client environment variables.

## Runtime controls

- Express compression is enabled for responses over 1 KiB.
- Hashed assets are immutable for one year; HTML is not cached.
- Every uploaded image is converted into 320 px, 800 px and 1600 px WebP variants. Each file is tracked against a per-tenant quota and all variants are deleted together when replaced.
- Authenticated API responses are never stored by the service worker.
- Offline application snapshots use IndexedDB; the mutation queue is bounded and deduplicated.
- Slow requests are logged at one second and aggregate route metrics are available to Super Admin at `/api/superadmin/performance`.
- Production startup does not seed unless `SEED_ON_STARTUP=true` is explicitly configured, and production builds omit server source maps.
- Monthly billing uses a bulk insert and skips tenants already invoiced in the current month.

## Verification gates

Before deployment run:

```powershell
npx prisma validate
npm run lint
npm test
npm run build
npm audit --omit=dev
```
