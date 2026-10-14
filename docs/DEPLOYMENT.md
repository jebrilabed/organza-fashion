# Production deployment and final validation

## Current status

The project has deployment configuration for a Vercel Next.js build and a Render
Docker image for the FastAPI service. No deployment was created from this workspace.
The workspace has no Git repository, production domain, or valid production
`DATABASE_URL`; provider access is not linked here. Production login, checkout,
catalog, admin, Gemini, WhatsApp, and SEO behavior therefore remain unverified.

The local `.env` files are ignored and are not part of deployment configuration.
Never copy their values into this document or source control.

## Platform setup

### Web on Vercel

Connect the repository when it is available in the intended Git provider. Configure
the Vercel project with the repository root (`.`) as its Root Directory because the
workspace package, lockfile, Prisma config, and schema are at the repository root.
The checked-in [vercel.json](../vercel.json) selects Next.js, runs `npm ci`, generates
Prisma Client, and then runs the web production build. Keep Vercel's detected Next.js
output settings. Select Node.js 22.x in project settings; the workspace currently
declares support for Node.js 20.9 or newer.

Set the web environment variables in the Vercel project, separately for Preview and
Production as appropriate. Never use `NEXT_PUBLIC_` for a secret.

### AI service on Render

Create a Docker web service using `apps/ai` as the Docker build context and
`apps/ai/Dockerfile` as the Dockerfile. The container uses Python 3.12, runs as a
non-root user, binds to Render's `PORT` (falling back to `AI_PORT` locally), and
excludes `.env` files from the image. Set the Render health-check path to
`/health/live`; inspect `/health/ready` separately before enabling chat traffic.

Set Render variables in the service's private configuration. Connect its HTTPS
service URL to web `AI_SERVICE_URL`, and point `AI_WEB_TOOLS_URL` back to the deployed
web `/api/internal/ai/tools` endpoint. Keep `AI_CORS_ORIGINS` empty because browsers
call the web application, not FastAPI. The AI service has no PostgreSQL connection.

## Production environment matrix

| Service | Variable | Required when | Notes |
|---|---|---|---|
| Web | `DATABASE_URL` | Always | Managed PostgreSQL URL. Use the provider's TLS instructions; URL-encode reserved characters in credentials. Vercel automatically switches Supabase session-pooler URLs from port 5432 to transaction pooler 6543. For migrations, configure `DIRECT_URL` when the provider offers a direct endpoint. |
| Web | `DATABASE_SSL_MODE`, `DATABASE_SSL_ROOT_CERT` | Optional | Remote URLs require TLS by default. Set a readable root CA certificate path to enable `verify-full`; local loopback URLs remain unchanged. Remote TLS cannot be disabled. |
| Web | `DATABASE_POOL_MAX` | Optional | Per-process pool limit; defaults to 1 on Vercel/serverless and 5 elsewhere. Tune against the database provider's total connection limit. |
| Web | `DATABASE_CONNECTION_TIMEOUT_MS`, `DATABASE_IDLE_TIMEOUT_MS`, `DATABASE_QUERY_TIMEOUT_MS` | Optional | Defaults are 40s for waiting on a pool connection, 30s idle, and 15s per query. The pool wait allows interactive transactions (up to 35s) to release their connection before queued queries fail. Values are bounded when unset or invalid. |
| Web | `AUTH_SECRET` | Always | Random secret of at least 32 characters. Auth.js infers the host from the trusted platform; this code does not require a separate `AUTH_URL`. |
| Web | `SITE_URL` | Always | Public canonical HTTPS origin; no path, query, credentials, localhost, or loopback address. |
| Web | `AI_SERVICE_URL` | To enable assistant | Deployed AI service origin, without the chat route suffix. |
| Web + AI | `AI_INTERNAL_SERVICE_TOKEN` | To enable assistant | Same random 32+ character value in both server environments. Never expose it to the browser. |
| AI | `AI_WEB_TOOLS_URL` | To enable assistant tools | Web's internal tools endpoint over HTTPS. |
| AI | `GEMINI_API_KEY`, `GEMINI_MODEL` | To enable model replies | Server-only provider credential and configured model name. |
| AI | `AI_ENVIRONMENT` | Production service | Set to `production` to disable development API docs. |
| AI | `AI_HOST` | Render | Use `0.0.0.0`; the container command uses Render's `PORT`. |
| AI | `AI_CORS_ORIGINS` | Optional | Keep blank for the server-to-server architecture. |
| Web | `CRON_SECRET` and `WHATSAPP_*` | To enable notification dispatch | Requires provider credentials, phone number ID, API version, template language, and all configured event template names. `WHATSAPP_DEFAULT_COUNTRY_CODE` is optional. |

`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are in
the environment example, but the current app does not upload assets or read these
variables. The implemented image workflow stores HTTPS URLs and applies delivery
transforms to existing Cloudinary URLs. Do not treat image upload as configured.

## Database and migrations

The schema targets PostgreSQL. Prisma uses `timestamptz(3)` for stored instants and
`Decimal(12,2)` for money; application timestamps are UTC instants. Confirm the
managed provider's PostgreSQL version and TLS requirements before connecting. The
application does not change the database server timezone; keep it set to UTC and
verify it with `SHOW TimeZone;` after access is available.

The checked-in migration folders are ordered by their timestamped names. Static review
found no table/data reset; the only `DROP` statement removes a prior guest-token unique
index as part of the chat migration. `prisma validate` succeeds, but without a database
URL this workspace cannot verify database drift, server version, TLS, migration status,
constraints, queries, or transaction behavior.

After provisioning the intended PostgreSQL database and setting `DATABASE_URL`, run
these commands from the repository root:

```powershell
npm run db:migrate:status
npm run db:migrate:deploy
npm run db:migrate:status
```

Use only checked-in migrations in production. Do not run `migrate dev`, `db push`, or
reset commands against production. There is no seed configured; enter real catalog and
store configuration through the admin workflow after the admin account is established.

## Admin account

The existing one-time bootstrap command is `npm run auth:bootstrap-admin`. It requires
`DATABASE_URL`, `ADMIN_BOOTSTRAP_PHONE`, and `ADMIN_BOOTSTRAP_PASSWORD` in the process
environment. Set those only for the one-time command in a trusted terminal or secret
manager, then remove them from that process. No admin credentials are included here.
Do not create a fabricated customer or catalog seed.

For an existing administrator, use `npm run auth:update-admin-phone` from `apps/web`
with a one-time `ADMIN_ACCOUNT_PHONE`; provide `ADMIN_ACCOUNT_EMAIL` if multiple admin
accounts exist. This preserves the current password and records the phone change in
the audit log. Do not store these temporary values in project environment files.

## Health and SEO behavior

- Web: `GET /api/health` validates environment configuration and performs `SELECT 1`
  against PostgreSQL. It returns 503 when configuration is incomplete or the database
  cannot be reached; it never returns credentials or raw driver errors.
- AI liveness: `GET /health/live` reports whether the process responds.
- AI readiness: `GET /health/ready` checks that the internal token, Gemini key, and
  model name are present. It does not call Gemini or the web tool endpoint and does
  not prove those credentials work.
- Production `SITE_URL` feeds canonical metadata, sitemap, robots, and structured
  data. Robots disallows admin and API routes. Customer, cart, checkout, and search
  pages retain their existing noindex policy.
- HSTS is emitted in production builds. It only protects visitors when the service is
  reached over HTTPS; verify the deployed response after TLS is configured.

## Final smoke-test checklist

After deployment, use a staging environment and controlled test customer/SKU before
any production order. Verify these routes and flows manually or with an authorized
smoke-test account:

- [ ] HTTPS `/ar`, products, category, product detail, search, FAQ, policies, contact.
- [ ] Arabic RTL, responsive layout, product images, metadata, breadcrumbs, JSON-LD.
- [ ] Cart updates, checkout quote, safe test order, confirmation, account order history.
- [ ] Customer register/login/logout/session; admin login and direct unauthorized denial.
- [ ] Admin catalog, inventory, orders, content, FAQ, notifications, and audit entries.
- [ ] `/api/health`, `/health/live`, and `/health/ready` report their expected state.
- [ ] Gemini product/policy/FAQ answers and prompt-injection containment, if a safe test is authorized.
- [ ] WhatsApp outbox and deduplication; one external delivery only to an explicitly approved test number.
- [ ] Sitemap, robots, canonicals, noindex pages, HTTPS headers, secure cookies.

Do not create a live order that can affect operations, change production inventory for
testing, or send a WhatsApp message to an unapproved recipient. Core Web Vitals and
production logs must be measured from the deployed site; no production measurements
are available from this workspace.

## Local final validation

From the repository root:

```powershell
npm run db:generate
npm run lint:web
npm run typecheck:web
npm run build:web
npm run db:validate
Get-ChildItem apps/web/tests -Filter '*.test.mjs' | ForEach-Object { node $_.FullName }
python -m compileall -q apps/ai/app
python -m pytest -c apps/ai/pyproject.toml apps/ai/tests
npm audit
```

The Python dependency audit command is `python -m pip_audit -r apps/ai/requirements.txt`
when `pip-audit` is installed. This workspace did not have that tool installed.

## Platform references

- [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build)
- [Vercel monorepos](https://vercel.com/docs/monorepos)
- [Render Docker and Blueprint configuration](https://render.com/docs/blueprint-spec)
- [Render health checks](https://render.com/docs/health-checks)
