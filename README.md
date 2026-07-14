# Novora

Multi-tenant inventory management SaaS for Kenyan businesses. Track stock, manage batch expiry, dispatch to shops with FEFO — all from a dark, cinematic, mobile-first dashboard.

## Stack

- **Monolith**: Next.js 14 + Fastify 4 (single process, port 3000)
- **Database**: [Neon](https://neon.tech) (serverless Postgres) via postgres.js
- **Frontend**: React, TanStack Query, Zustand, Tailwind, shadcn/ui
- **Auth**: JWT (7-day sessions), bcrypt passwords

## Prerequisites

- Node.js 20+
- A Neon project + connection string
- SMTP credentials (optional for email)

## Local Development

1. Create a Neon project at [console.neon.tech](https://console.neon.tech) and copy the connection string (prefer the **pooled** URL).

2. Configure env:

```bash
cp .env.example .env
# Set DATABASE_URL to your Neon connection string
```

Example:

```
DATABASE_URL=postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

3. Install, migrate, seed, and run:

```bash
npm install
npm run migrate
npm run seed   # optional demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo credentials (after seed)

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | password123 | admin |
| staff@demo.com | password123 | staff |

## Production

```bash
npm run build
npm start
```

Deploy the Node process behind Nginx (or any reverse proxy). Point `DATABASE_URL` at your Neon production branch.

## Migrations

SQL migrations live in `db/migrations/` and are tracked in a `schema_migrations` table.

```bash
npm run migrate   # apply pending migrations
npm run seed      # load demo org / items / transactions
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 3000) |
| `HOST` | Bind address |
| `APP_URL` | Public app URL |
| `DATABASE_URL` | Neon Postgres connection string (`?sslmode=require`) |
| `JWT_SECRET` | JWT signing secret (min 8 chars) |
| `JWT_EXPIRES_IN` | Token expiry (default 7d) |
| `SMTP_*` | Email configuration |
| `EMAIL_FROM` | Sender address |
| `EMAIL_RECIPIENT` | Access request recipient |

## API Reference

All endpoints return `{ success, data }` or `{ success: false, error: { code, message } }`.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/signup` | Create org + admin |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user (auth) |
| POST | `/api/v1/auth/accept-invite` | Accept invite |

### Items

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/items` | List items (paginated) |
| POST | `/api/v1/items` | Create item |
| POST | `/api/v1/items/batch` | Batch create |
| GET/PATCH/DELETE | `/api/v1/items/:id` | Item CRUD |

### Stock

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/stock/in` | Record stock in |
| POST | `/api/v1/stock/out` | Dispatch (FEFO) |
| GET | `/api/v1/stock/out/preview` | FEFO preview |
| GET | `/api/v1/stock/expiring` | Expiring batches |

### Other

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/transactions` | Transaction history |
| DELETE | `/api/v1/transactions/:id` | Undo (admin) |
| GET/POST/PATCH/DELETE | `/api/v1/shops` | Shop management |
| GET | `/api/v1/dashboard/summary` | Dashboard stats |
| GET/PATCH | `/api/v1/orgs/me` | Organization |
| GET/PATCH/DELETE | `/api/v1/users` | Team management |
| POST/GET/DELETE | `/api/v1/invites` | Invites (admin) |
| POST | `/api/v1/notifications/request-access` | Landing form |
| GET | `/health` | Health check |

## Nginx Example

```nginx
server {
    server_name novora.switchax.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then: `certbot --nginx -d novora.switchax.com`

## License

Private — Novora © 2025
