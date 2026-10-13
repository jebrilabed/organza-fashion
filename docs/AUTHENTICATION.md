# Authentication foundation

Authentication uses Auth.js v5 Credentials with the Prisma adapter and a short-lived,
encrypted JWT cookie session. Customers and administrators sign in with their phone
number and password. Passwords are stored only as salted scrypt hashes.
The session carries the user ID and role for framework session typing, but all
authorization helpers load the current role from PostgreSQL before granting access.

## Configuration and routes

Set `AUTH_SECRET` in `apps/web/.env.local` (generate a local secret with `npx auth
secret`) and configure `DATABASE_URL` as described in [the database guide](DATABASE.md).
The self-hosted app trusts the incoming host; configure the deployment ingress or
reverse proxy to validate `Host` headers before forwarding requests. No OAuth
credentials or `AUTH_URL` are required for the current credentials setup.

- `/ar/login` is the Arabic RTL phone and password form. Invalid credentials receive
  one generic message.
- `/ar/register` creates customer accounts using a unique phone number and password.
- `/api/auth/*` is the Auth.js route handler.
- `/admin` is a server-rendered protected placeholder. Signed-out requests go to the
  login page; a CUSTOMER receives not-found. Future server actions and API handlers
  should call `requireUser`, `requireRole`, or `requireAdmin` from
  `apps/web/src/lib/auth/authorization.ts`.

The Credentials provider requires JWT sessions. The Prisma adapter remains configured
for the planned Auth.js integration, but Credentials sign-ins are not persisted as
adapter sessions. Server helpers validate the Auth.js session and reload the user by
that session's ID; they do not accept user IDs or role values from requests. The
Customer relation stays optional, and existing guest carts/orders remain valid.

## First administrator

There is no seed account or default password. Apply database migrations, then invoke
the explicit `npm run auth:bootstrap-admin` command with temporary
`ADMIN_BOOTSTRAP_PHONE` and `ADMIN_BOOTSTRAP_PASSWORD` environment values supplied by
a trusted shell or secret manager. Use a unique phone number and an 8–128 character password.
The command only creates a new ADMIN and refuses to modify an existing account. It
deletes those values from its process environment after reading them, hashes the
password, never prints it, and is never run automatically. Do not commit these values
or place them in persistent environment examples. In production, run it once from a
controlled deployment operator session and then remove the temporary values.

To assign or change the phone on an existing administrator without changing its
password, run `npm run auth:update-admin-phone` from `apps/web` with a one-time
`ADMIN_ACCOUNT_PHONE`. If there is more than one administrator, also provide the
existing account's `ADMIN_ACCOUNT_EMAIL` to select it. The command refuses ambiguous
accounts, accounts without a password hash, or a phone already owned by another user;
successful changes are recorded in the admin audit log. Supply these values only to a
trusted terminal or secret manager, not `.env.local` or a committed file.

## Abuse protection and limitations

An authenticated administrator can change their own password from `/admin/settings`
after confirming the current password. Password recovery remains unavailable.

Unknown phone numbers and incorrect passwords receive the same result; an asynchronous dummy
scrypt verification reduces obvious account-timing differences. Password reset, MFA,
SMS verification, and a rate limiter are not included. Add distributed rate limiting and
brute-force monitoring before exposing credentials authentication publicly. A real
PostgreSQL URL and `AUTH_SECRET` are needed to test a full login and persisted identity;
the local authorization tests do not claim production authentication readiness.
