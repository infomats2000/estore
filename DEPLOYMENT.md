# VentraIP Australia Deployment Guide

## 1. Server prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL or MySQL access
- Domain pointed to the server

## 2. Environment variables
Create a production `.env` file with:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
JWT_SECRET=replace-with-a-long-random-secret
APP_URL=https://your-domain.com
STRIPE_SECRET_KEY=
```

If you use MySQL, only change `DATABASE_URL` to a MySQL connection string.

## 3. Install dependencies
```bash
npm install
```

## 4. Generate Prisma client
```bash
npx prisma generate
```

## 5. Run database migrations
```bash
npx prisma migrate deploy
```

## 6. Build the app
```bash
npm run build
```

## 7. Start the app
```bash
npm start
```

## 8. Production checklist
- Ensure uploads directory exists and is writable:
  - public/uploads/products
  - public/uploads/categories
  - public/uploads/banners
  - public/uploads/store
- Ensure `logs/` exists and is writable.
- Set HTTPS and a reverse proxy (for example Nginx/PM2).
- Enable automatic restarts with PM2.
- Configure backups for the database.
- Set strong `JWT_SECRET` and secure database credentials.
