# Arvion (AL-RIZVI) — Deployment

```
 Vercel                                   saangri VM (98.70.37.83, Azure)
 ┌──────────────────────────┐            ┌────────────────────────────────────────┐
 │ storefront  frontend-h1rj │──┐         │ nginx :443  ──►  Node :4007 (PM2)       │
 │ admin       admin         │──┴──HTTPS─►│ arvion-api.98.70.37.83.nip.io           │
 └──────────────────────────┘            │ Postgres db `arvion` · Redis db 6        │
                                          └────────────────────────────────────────┘
```

| Piece | Where | URL |
|---|---|---|
| Storefront (`frontend/`) | Vercel project `frontend-h1rj` | https://frontend-h1rj.vercel.app |
| Admin (`admin/`) | Vercel project `admin` | https://admin-ecru-eight-56.vercel.app |
| API (`backend/`) | `saangri` VM, `/opt/apps/arvion/backend`, pm2 `arvion-api` | https://arvion-api.98.70.37.83.nip.io |

The VM is shared with jms, vivaha, saangri and others — see `~/Developer/saangri/DEPLOYMENT.md`
for SSH access (`ssh saangri`; SSH is locked to one IP in the Azure NSG).

## Server layout

```
/opt/apps/arvion/
├── backend/               ← NestJS source + dist/ (built on the server)
│   └── .env               ← secrets, chmod 600 (never committed)
├── ecosystem.config.js    ← pm2 app `arvion-api` (node --env-file=.env dist/main.js)
└── logs/                  ← api-out.log / api-error.log
/etc/nginx/sites-available/arvion-api.98.70.37.83.nip.io   ← proxy to 127.0.0.1:4007, certbot SSL
/opt/apps/_backups/backup-arvion.sh                       ← nightly pg_dump at 02:55, keeps 14
```

## Deploy the backend

```bash
cd backend
rsync -az --delete --exclude node_modules --exclude dist --exclude .env \
  --exclude prisma/dev.db --exclude .git ./ saangri:/opt/apps/arvion/backend/
ssh saangri 'cd /opt/apps/arvion/backend && npm ci && npm run build && \
  set -a && . ./.env && set +a && npx prisma db push --skip-generate && \
  pm2 restart arvion-api'
```

`prisma db push` applies schema changes (there are no migrations). Back up first if the change
drops columns: `ssh saangri /opt/apps/_backups/backup-arvion.sh`.

## Deploy the frontends

Both read `NEXT_PUBLIC_API_URL`, set in each Vercel project (Production) and in the local
`.env` / `.env.local` files.

```bash
cd frontend && npx vercel --prod --yes
cd admin    && npx vercel --prod --yes
```

If a build fails inside `next/font` ("Cannot read properties of null"), it is a transient
Google Fonts fetch — redeploy.

## Server `.env`

| Var | Value |
|---|---|
| `DATABASE_URL` | `postgresql://arvion:<pass>@localhost:5432/arvion?schema=public` |
| `REDIS_URL` | `redis://localhost:6379/6` (db 6 keeps keys apart from other apps) |
| `PORT` | `4007` |
| `ALLOWED_ORIGINS` | both Vercel URLs, comma-separated — add any custom domain here |
| `JWT_SECRET` | random, server-only |
| `RAZORPAY_*` | currently **test** keys |
| `CLOUDINARY_*` | image uploads from admin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin login, created by the seed |

After editing: `ssh saangri 'pm2 restart arvion-api'`.

## Data

```bash
ssh saangri 'cd /opt/apps/arvion/backend && set -a && . ./.env && set +a && \
  npx ts-node prisma/seed-showcase.ts'
```

`prisma/seed-showcase.ts` holds the showcase catalogue (6 categories, 30 products with Unsplash
photography, banners, coupons WELCOME10 / BARAKAH100 / EID15, store settings). Re-running
refreshes seeded products by SKU; banners and settings are only written when missing.

### Stock ledger (one-time, after the inventory release)

Every stock change is recorded in `StockMovement`. Stock that existed before the ledger has no
history, so after the first deploy that includes it, run once (safe to repeat):

```bash
ssh saangri 'cd /opt/apps/arvion/backend && set -a && . ./.env && set +a && \
  npx ts-node prisma/backfill-opening-stock.ts'
```

## Handy commands

| Task | Command |
|---|---|
| Status | `ssh saangri 'pm2 list'` |
| Logs | `ssh saangri 'pm2 logs arvion-api --lines 100 --nostream'` |
| Restart | `ssh saangri 'pm2 restart arvion-api'` |
| Health | `curl https://arvion-api.98.70.37.83.nip.io/settings/public` |
| Backup now | `ssh saangri /opt/apps/_backups/backup-arvion.sh` |

## Not production-ready yet

- **Customer phone login**: Firebase Admin credentials are not configured on the server, so
  only the built-in test numbers can sign in. Add a service account and set
  `GOOGLE_APPLICATION_CREDENTIALS` to enable real OTP login.
- **Test login bypass is live**: `auth.service.ts` accepts `TEST_TOKEN_123` / `TEST_TOKEN_888`
  (phones 9999999999 / 8888888888, OTP 123456) from anyone. Gate it behind an env flag before
  real customers use the site.
- **Payments** use Razorpay test keys; swap in live keys and set `RAZORPAY_WEBHOOK_SECRET`
  to match the dashboard webhook.
- The old `lk` host (40.81.242.220) still has an unused `arvion` database.
