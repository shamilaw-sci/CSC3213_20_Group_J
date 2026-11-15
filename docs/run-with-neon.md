# Run on Windows using the existing Neon database

The backend reads `icrowd_api/.env` when started from `icrowd_api`. You do not need to install PostgreSQL locally. Use the `prod` profile to use the configured persistent database without demonstration seeding. The `local` profile instead selects a disposable in-memory database.

This workspace was prepared on 2026-11-15 using its existing Neon connection. A login-signing secret was generated, schema validation and the `prod` profile were enabled, and database TLS now verifies the server certificate and requires channel binding. The reviewed migration was applied after a complete backup, archive read-back, and restoration/migration rehearsal in an isolated PostgreSQL-compatible copy. The online PostgreSQL 17 database retained its 8 accounts, 25 products, 10 orders, inventory quantities, and order totals. No credentials are copied into this guide.

## Start or stop this prepared workspace

From the project folder in PowerShell, start both servers in the background:

```powershell
.\scripts\start-local.ps1
```

Open **http://localhost:5173** and sign in with an existing account. An active administrator already exists; its password was not changed. The backend is available at **http://localhost:8080/api/products?size=1**. Both servers listen only on this computer. An occupied port causes startup to stop with an explanation, rather than terminating another application.

To stop the servers started by that script:

```powershell
.\scripts\stop-local.ps1
```

Startup logs and process records are under `icrowd_api/target/local-run/`. The verified database backup and private configuration backups are in `local-backups/20261115-152419/`, outside Maven's disposable build directory. These files are ignored by Git and contain private database/account information; keep this folder private.

The backend was packaged with `.\mvnw.cmd -DskipTests package`, and frontend dependencies were installed with `npm.cmd ci`. Rebuild the backend after backend source changes. This local startup keeps marketing delivery disabled. SMTP and the public PayHere callback are still unconfigured, so email delivery and card checkout are not ready.

The remaining sections document first-time setup or running the two servers in separate terminals. **This prepared workspace does not need another migration, signing-secret generation, or administrator provisioning.**

## 1. Prepare the database

Stop any backend instances connected to the database before applying the upgrade, and take a verified backup. For your first test, a Neon development branch provides an isolated copy of the existing schema and data. Create it from the current branch in Neon, and obtain its connection details using **Connect**. If you use that branch, update the database settings in `.env` to its connection details. An application connected to a branch writes to that branch, including checkout records and payment recovery changes. [Neon branching instructions](https://neon.com/docs/manage/branches).

Open Neon's **SQL Editor**, select the intended branch and database, and run the complete contents of `database_migrations/20261115_security_performance.sql`. Use the upgrade script for an existing application database. `database_setup.sql` is only for an empty installation. [Neon SQL Editor instructions](https://neon.com/docs/get-started/query-with-neon-sql-editor).

The migration intentionally stops if case-variant accounts or historical stock-allocation records require review. If it stops, retain the error and resolve that condition before continuing. Do not bypass the check with automatic schema updates or run only the remainder of the transaction.

After successful completion, this read-only query should return one row:

```sql
SELECT version, applied_at
FROM app_schema_migrations
WHERE version = '20261115_security_performance';
```

## 2. Update the existing backend configuration

Open `icrowd_api/.env` in your editor. Keep the database host, database name, username and password for your selected branch. Do not overwrite the file with `.env.example`.

Add or update these settings, with no quotes around the values:

```properties
DB_DDL_AUTO=validate
SPRING_PROFILES_ACTIVE=prod
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MARKETING_ENABLED=false
```

Within the existing `DB_URL`, replace `sslmode=require` with the following parameters. Preserve the rest of your URL, including its actual hostname and database name:

```text
sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory&channelBinding=require
```

This uses Java's trusted certificate store and requires server identity verification. Keep Java's security updates current. If certificate validation fails, resolve the certificate/trust configuration; do not disable verification. The alternative is to configure the correct CA explicitly with `sslrootcert`. [PostgreSQL JDBC SSL settings](https://jdbc.postgresql.org/documentation/ssl/).

## 3. Generate the missing login-signing secret once

Open PowerShell. These commands generate a random secret and append it to the existing `.env` without printing the secret. They work in Windows PowerShell 5.1 and newer PowerShell versions. Run them only when `JWT_SECRET` is missing or blank; preserve a valid existing secret on later starts.

```powershell
Set-Location -LiteralPath 'D:\UOP\Academic\CS\CSC3213 - Project\CSC3213_20_Group_J\icrowd_api'

$signingBytes = New-Object byte[] 48
$signingGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$signingGenerator.GetBytes($signingBytes)
$signingGenerator.Dispose()
Add-Content -LiteralPath '.env' -Value ("`nJWT_SECRET=" + [Convert]::ToBase64String($signingBytes))
```

Keep this file private and out of Git. Do not put database, payment, SMTP or signing secrets in frontend variables. Generating a new signing secret invalidates previously issued login sessions.

## 4. Start the backend in the first terminal

Java 21 is installed at the path below. Use a fresh PowerShell terminal so settings from a previous disposable-local run do not override `.env`.

```powershell
Set-Location -LiteralPath 'D:\UOP\Academic\CS\CSC3213 - Project\CSC3213_20_Group_J\icrowd_api'
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:SPRING_PROFILES_ACTIVE = 'prod'
$env:SERVER_ADDRESS = '127.0.0.1'
$env:SERVER_PORT = '8080'
.\mvnw.cmd spring-boot:run
```

This starts the API on your computer and connects it to your selected Neon database. Wait for the startup log to report port 8080 and successful application startup. Keep the terminal open. A schema-validation error means the selected database still needs the correct upgrade; it is not a reason to change `validate` back to `update`.

The API check at `http://localhost:8080/api/products?size=1` should return JSON in a browser. An empty product list is valid if the database has no products; production startup does not add sample stock.

## 5. Start the frontend in a second terminal

Node 22.17.0 and npm are already installed on this computer. Install the locked dependencies once after pulling these changes. Wait for `npm ci` to succeed before starting the server.

```powershell
Set-Location -LiteralPath 'D:\UOP\Academic\CS\CSC3213 - Project\CSC3213_20_Group_J\iCrowd_UI'
npm.cmd ci
```

Then run:

```powershell
$env:VITE_API_BASE_URL = 'http://localhost:8080/api'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://localhost:5173**. If a port is already occupied, stop the earlier instance you started before running another one. `--strictPort` prevents the frontend silently choosing a port that the API has not allowed.

## 6. Sign in

Use an existing account in your selected database, or register a new customer. An existing administrator can use `/admin`. Change any old demonstration administrator passwords before exposing the application publicly.

If the database has **no administrator account**, stop the backend with Ctrl+C and run this one-time setup in its terminal:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host 'New administrator email'
$administratorPassword = Read-Host 'New administrator password (at least 12 characters)' -AsSecureString
$env:BOOTSTRAP_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $administratorPassword).Password
$env:SPRING_PROFILES_ACTIVE = 'prod,bootstrap-admin'
.\mvnw.cmd spring-boot:run
```

Once startup succeeds, stop the backend with Ctrl+C. Remove the provisioning variables and start normally:

```powershell
Remove-Item Env:\BOOTSTRAP_ADMIN_EMAIL, Env:\BOOTSTRAP_ADMIN_PASSWORD
$env:SPRING_PROFILES_ACTIVE = 'prod'
.\mvnw.cmd spring-boot:run
```

Sign in with the email and password you chose. If the initializer reports that an administrator already exists, use the existing administrator process instead. It will not overwrite or promote an existing account automatically.

## 7. Test the features you have configured

Browsing, customer accounts, cart, inventory management and cash-on-delivery do not need SMTP or card-payment configuration. Use your development branch for trial purchases so they do not become business records in the live branch.

The checked `.env` contains PayHere credentials, but `PAYHERE_NOTIFY_URL` is missing. Card checkout requires a publicly reachable HTTPS callback ending in `/api/payments/notify`; localhost is not reachable by PayHere. Use matching PayHere sandbox credentials with `PAYHERE_SANDBOX=true` on your development branch and verify callbacks/refunds before using live payment mode.

SMTP settings are missing, so email confirmation and marketing are not ready. Leave `MARKETING_ENABLED=false` until `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM` and an HTTPS `PUBLIC_API_URL` are configured. Email confirmation deliberately does not enable a subscription when confirmation email cannot be sent.

## 8. Stop and restart

Press Ctrl+C in each terminal to stop the two servers. Data in Neon remains in the selected branch. On subsequent runs repeat steps 4 and 5; you do not need to regenerate the signing secret, repeat the database migration, reinstall unchanged dependencies, or repeat administrator provisioning.

## Public release is a separate step

These instructions run the application on this computer with an online database. A public release additionally needs HTTPS hosting, actual deployed frontend/API URLs, exact allowed origins, payment/SMTP verification, current Java/Node security patches, database/receipt backups, and trusted-proxy/shared-rate-limit configuration where applicable. Follow [deployment.md](deployment.md). Do not expose the frontend development server as the public production website.
