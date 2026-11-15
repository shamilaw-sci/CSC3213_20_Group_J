# Setup and deployment

For this Windows workspace's existing online database configuration, follow [Run with Neon](run-with-neon.md). It includes the required environment changes, database upgrade, two-terminal startup and first-administrator setup.

Use Java 21 and Node.js 22.12 or newer. Install the frontend with `npm ci` from `iCrowd_UI`. Run backend commands from `icrowd_api` so configuration paths resolve correctly.

## Disposable local development

The explicit `local` profile uses an in-memory database and adds missing sample catalog entries. Its data disappears on shutdown. It does not create demonstration users or orders.

PowerShell, from `icrowd_api`:

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:SPRING_PROFILES_ACTIVE = 'local'
.\mvnw.cmd spring-boot:run
```

In another terminal, from `iCrowd_UI`, run `npm ci` and `npm run dev`. Register a customer through the application. To provision the first administrator, use the one-time procedure below. Do not enable `demo` against a real database: that profile deliberately creates demonstration accounts and orders and requires explicitly supplied passwords.

## Existing persistent installation

1. Stop all application instances, payment recovery and marketing workers. Take and verify a database backup and preserve the receipt storage directory. Test the upgrade against a restored copy first.
2. Apply `database_migrations/20261115_security_performance.sql` with PostgreSQL's `ON_ERROR_STOP=1`. It runs in a transaction, retains existing totals and stock quantities, adds required columns/indexes, canonicalizes account emails, and disables subscriptions that have never been confirmed. Do not run the retired `20261030_checkout_final_allocation.sql`.
3. If the migration stops for duplicate email identities, resolve account ownership before merging or deleting anything. If old orders have no `stock_allocated` state, reconcile existing stock reservations and captured payments and populate verified values before retrying. The migration intentionally cannot infer those historical facts. Resolve duplicate promo usages or conflicting legacy cart tables if a uniqueness/preflight check reports them.
4. Supply `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, a newly generated `JWT_SECRET`, `FRONTEND_URL`, and the exact `CORS_ALLOWED_ORIGINS`. Use `DB_DDL_AUTO=validate`. The API no longer silently starts on H2 when persistent settings are absent. For a new empty installation, apply `database_setup.sql` instead of the upgrade.
5. Use the provider's PostgreSQL CA certificate and `sslmode=verify-full`; the example also requires channel binding. An existing `.env` is not edited automatically. Set actual HTTPS application origins and `PUBLIC_API_URL` for production; do not deploy localhost origins. Set `SPRING_PROFILES_ACTIVE=prod` without `local` or `demo`.
6. Review historical demonstration orders, old cost estimates, suspicious accounts, and old receipt files separately. The source fixes do not prove which existing records are genuine and do not delete them. Delete unwanted receipt files only after comparing them with verified order references and retaining the required business records. Set actual product costs and lead times through product management; historical unknown costs remain explicitly labelled estimates.
7. Build and release both API and UI together. Rotating the signing secret signs out existing sessions. Product edits now require the version returned by the admin product endpoint, order history is paginated, and receipts are downloaded through the authenticated order endpoint.

### First administrator

For a database without any administrator, set `BOOTSTRAP_ADMIN_EMAIL` and a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 12 characters and start once with `SPRING_PROFILES_ACTIVE=prod,bootstrap-admin`. After provisioning, stop the API, remove those two provisioning secrets, and restart with just `prod`. Local development can use `local,bootstrap-admin` instead. Existing administrator accounts are never overwritten. Additional administrators require an authenticated administrator's password confirmation in the application.

### Payments

Configure hosted-checkout credentials and the verified HTTPS callback URL. Configure `PAYHERE_APP_ID` and `PAYHERE_APP_SECRET` for merchant verification and refunds. Test callback signatures, delayed callbacks, chargebacks, and refunds in the merchant sandbox before accepting payments.

Unresolved transactions are retried with bounded backoff and then appear in **Payment reviews**. They cannot be retried as a new charge or switched to COD while their outcome is unknown. Administrators must inspect the merchant's records, re-enter their password, and record a verification note before marking a payment failed or refunded. A captured payment must actually be refunded through the merchant before selecting refunded. This action records a verified outcome; it does not send a new refund. Disputed/chargeback payments require a separate merchant and fulfillment review. No inventory is automatically returned for a chargeback because the goods may already have shipped.

### Email and deployment limits

Email delivery stays disabled until SMTP and sender settings are configured and `MARKETING_ENABLED=true`. Subscription confirmation also requires a public HTTPS API URL. Existing unconfirmed subscriptions must opt in again. Clicking an emailed link displays a confirmation form; the subscription changes only on the subsequent confirmation POST.

Login and chat limiters are bounded and synchronized within one application instance. For multiple instances, enforce a shared limit at the reverse proxy/API gateway. Requests use the server's remote client address; arbitrary forwarded headers are not trusted. Behind a proxy, configure the web container to accept forwarded addresses **only from the actual trusted proxy addresses**, or all clients may share the proxy's local limit. Validate this with the real deployment topology before release. These infrastructure settings cannot be inferred from the repository.

## Checks

```powershell
# icrowd_api
.\mvnw.cmd -B test
# iCrowd_UI
npm ci
npm run lint -- --max-warnings=0
npm run test:unit
npm audit --audit-level=moderate
npm run build
# Start an isolated local API on port 8080 first:
npx playwright install chromium
npm run test:e2e
```

The browser checks use the production build. Set `PLAYWRIGHT_CHANNEL=msedge` to use an installed Edge browser on Windows. The full suite includes a real API catalog request; most UI scenarios use controlled responses for repeatability. CI now runs lint, unit tests, dependency auditing, production builds, backend tests, PostgreSQL setup/upgrade validation, and browser checks with a readiness check instead of a fixed startup delay.
