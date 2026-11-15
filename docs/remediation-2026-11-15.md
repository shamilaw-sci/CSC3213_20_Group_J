# Security, correctness and performance remediation

15 November 2026 · Repository baseline: `02ec24fbd0483691fd926afa111d2b36dcac6739`.

The fixes below address the findings in the [initial audit](project-audit-2026-11-12.md) and [subsequent recheck](project-recheck-2026-11-15.md). Those reports describe the earlier code and are preserved as historical evidence. Changes are in the working tree; no production database, deployed service, real payment, or real email delivery was modified.

Code and configuration changes have been implemented for the 45 findings that still needed work. F19's existing correction is retained and regression-tested. Applying the database migration, rotating deployed credentials, configuring TLS and trusted proxies, and reviewing ambiguous historical records remain deployment actions. In particular, distributed rate limiting is not supplied by the in-process limiters.

## Verified results

| Check | Result |
|---|---|
| Backend regression suite | **145 passed**, zero failures/errors/skips. Includes real HTTP authorization, product privacy/query count, stale stock edits, concurrent promotions, last-admin concurrency, payment callbacks, receipt authorization, analytics and marketing. |
| Final analytics correction | **10 passed** after removing fallback accuracy percentages for empty holdout data. Other backend code was unchanged after the full suite. |
| Browser coverage | **29 scenarios passed**, including one real API catalog smoke test. The initial run had one ambiguous status-element selector that passed on retry; it was corrected and all six storefront tests then passed with retries disabled. |
| Frontend unit checks | **4 passed**: formula/markup injection, quoted CSV data, and stale-session responses. |
| Lint and production build | Passed; zero lint errors/warnings. |
| Initial JavaScript | **347.49 kB / 112.56 kB gzip**, down from 1,216.77 / 339.81 kB: about **71% smaller** uncompressed and **67% smaller** compressed. Analytics and map code load separately. |
| Default hero image | Desktop **54,314 bytes**, mobile **15,530 bytes**, versus the former 1,988,419-byte PNG. Desktop is about **97% smaller**. |
| Catalog query regression | A ten-product public page needs at most **6 SQL statements** in the measured fixture, versus roughly 45 before; private cost fields are absent. |
| Frontend dependency audit | **0 reported vulnerabilities**; previously 14 affected packages. |
| Backend advisory query | **132 Maven coordinates**, **0 OSV advisory matches**; previously 8 affected packages / 22 advisory IDs. Includes test dependencies. |
| Installed dependency consistency | **249 installed package manifests checked; 0 version differences** against the updated lockfile. Platform-specific optional packages absent on Windows are not counted as mismatches. |
| Database scripts | Five isolated PostgreSQL-engine scenarios passed: fresh installation/repeated upgrade, legacy bootstrap upgrade, duplicate-email rejection/rollback, unknown legacy allocation rejection, and preservation of current order totals/allocation. |
| Application/database compatibility | Both fresh and upgraded legacy schemas passed Hibernate validation, checkout record persistence, and daily/hourly analytics SQL execution against isolated PGlite PostgreSQL 18.6. Native PostgreSQL 17 validation is also configured in CI; the hosted CI jobs have not been run from this session. |
| Diff formatting | `git diff --check` passed. |

The table above records the verification results. Reproduction scripts are in [audit-2026-11-15](audit-2026-11-15/). Raw logs and JSON snapshots, including `remediation-*` and `schema-verification.json`, are local ignored artifacts; fresh logs belong in CI artifacts rather than source control. Advisory results are a point-in-time check of known published issues, not proof that all dependencies are defect-free. Production throughput and live merchant/SMTP behavior were not load-tested.

The SQL checks use an isolated WebAssembly build of PostgreSQL and its local connection adapter, documented by [PGlite](https://pglite.dev/docs/) and [PGlite Socket](https://pglite.dev/docs/pglite-socket). They do not connect to the application's configured database. The Java validator uses simple-query mode because the adapter retains prepared statements across client connections; that mode is a test-adapter setting, not a production configuration change.

## Finding disposition

| Finding | Implemented change |
|---|---|
| F01 — Published JWT fallback | Startup rejects absent, short and known default keys. Authentication requires expiration and a matching token version, uses the current database role/status, and returns consistent 401/403 JSON. Rotate any deployed old secret. |
| F02 — Default privileged accounts | Demo accounts require the explicit `demo` profile and supplied passwords. First-admin provisioning is a separate, one-time `bootstrap-admin` profile. Production cannot combine `prod` with `local` or `demo`. |
| F03 — Case-variant account/order access | Canonical email handling and case-insensitive uniqueness preflight/index; order/payment ownership compares immutable account IDs. Ambiguous existing identities stop migration. |
| F04 — Startup overwrites inventory | Product initialization is local/demo only and inserts missing entries without updating existing prices or stock. |
| F05 — Lost stock updates | Product optimistic versioning, stock updates that increment that version, required client edit versions, and serialized checkout allocation. Stale/missing edit versions return 409. |
| F06 — Promotion limits | Promotion rows are locked; recent pending reservations count toward limits; eligibility is rechecked before fulfillment or COD conversion. Concurrent limit-one checkouts admit one reservation. |
| F07 — Invalid discounts | Reject percentages over 100, negative amounts, invalid limits and reversed date ranges; discount cannot exceed subtotal. |
| F08 — Legacy checkout | Obsolete checkout returns 410. Current creation validates delivery data and item bounds. Unexpected failures no longer expose raw internal exception messages. |
| F09 — Chargebacks | Chargeback callbacks update payment/order state even after success; later duplicate success cannot revive the payment. Shipped goods are not automatically restocked. |
| F10 — Fabricated analytics | Live histories use recorded period totals; future estimates are separate. Explicit demo data stays labelled. Missing cost assumptions are shown in the UI/exports, zero costs remain valid, and absent sales do not produce invented accuracy percentages. Removed the unused dashboard with hardcoded figures. |
| F11 — Silent volatile database | Persistent database variables are required and schema validation is the default. H2 requires the explicit disposable local profile or isolated test configuration. |
| F12 — Schema drift | Replaced fresh setup with current mappings; supplied transactional upgrade, guarded historical-data preflight, indexes and schema validation checks. Retired the unsafe old migration. |
| F13 — Payment reconciliation | Merchant lookup with amount/currency checks, bounded retries/backoff and a password-protected, audited payment-review screen. Unknown payments cannot trigger a new charge/COD conversion. Administrators record verified failed/refunded outcomes; live merchant verification is still required. |
| F14 — Alternate admin creation bypass | All administrator creation paths require administrator authorization and password confirmation. |
| F15 — Login throttling | Ignore untrusted forwarded IP headers; synchronize counters, expire entries and reject new keys at capacity rather than clear active locks. A successful login does not reset the IP's failures against other accounts. Shared limits and trusted-proxy configuration remain deployment requirements. |
| F16 — Receipt exposure/storage | Owner/admin-only download, attachment/no-store response, strict paths, PDF/image validation, bounded dimensions/size, per-owner quota and atomic replacement. Public uploads are denied. Old orphan files require an ownership-aware retention review. |
| F17 — Unverified email consent | Expiring hashed confirmation tokens and confirmation POST, with resend cooldown; campaigns target confirmed subscribers. Pending subscriptions can be cancelled. SMTP must be configured before consent emails can be sent. |
| F18 — Last administrator race | Stable-order administrator locks serialize demotion/deactivation. Concurrent mixed changes retain one active administrator. |
| F19 — Qualifying sales/discounts | Existing qualifying-status filtering and gross/net distinction retained; database-backed tests cover cancelled, unpaid, disputed, COD and discounted orders. |
| F20 — Unbounded catalog limits | Clamp latest/featured/recent responses, cap cart suggestion IDs, and limit low-stock dashboard results. |
| F21 — Catalog scans | Bounded database candidates for autocomplete/recommendations and a bounded, expiring detached chat catalog cache. |
| F22 — Public entity/N+1 responses | Public product allowlists, compact summaries, category fetch plans and batched collections. |
| F23 — Full-history loading | Paginated order history, database sales/customer/trending aggregates, bounded chart windows and database user counts. Historical order graphs are not loaded to build reports. |
| F24 — Marketing scale | Bounded campaign preparation/delivery batches, cursor progress, aggregate affinities, grouped dashboard counts, and no queue preparation while delivery is disabled. |
| F25 — App blocked by account/cart requests | Routes render while cart initialization runs; requests have deadlines and cart retries are explicit. |
| F26 — Password-change session | Clear revoked credentials and return to sign-in after password change; expired-token handling is shared. |
| F27 — Cross-tab identities | Synchronize token changes across tabs, remount account-bound cart state, capture request credentials and discard stale responses/queued writes. Old failures cannot clear a newer login. |
| F28 — Stale search responses | Abort stale searches, guard result ownership and debounce management searches. |
| F29 — Inventory role mismatch | Inventory staff can reach the dashboard/products/categories; account administration, analytics, payments and other administrator-only tools remain protected. Login/navigation use the same role rules. |
| F30 — Hardcoded CORS | Configure explicit application origins; reject wildcard/invalid origin configuration and remove conflicting controller overrides. |
| F31 — Eager browser bundle | Lazy route loading splits analytics, account, management, checkout and map code. |
| F32 — Heavy hero delivery | Responsive WebP defaults; metadata queries avoid image bytes; versioned ETags/cache headers allow early 304 responses. |
| F33 — Spreadsheet injection | Neutralize formula prefixes including leading whitespace/control characters. Also escape markup and text cells in the HTML-based Excel export. |
| F34 — Vulnerable/stale dependencies | Upgrade Spring Boot's dependency set and npm resolutions; synchronize the lockfile and verify known advisory matches. |
| F35 — Missing quality gates | Fix lint errors, add unit/security/concurrency/browser regression checks, and require lint/audit/build/tests in CI. API startup uses a bounded readiness loop instead of fixed sleep. Corrected an ambiguous browser-test selector. |
| F36 — Database identity verification | Example URL now requires full server certificate/hostname verification and channel binding. Actual deployed URLs and CA configuration must be updated separately. |
| F37 — Cost data exposure | Public DTOs exclude cost/version/lead-time management data; defensive entity ignores protect nested serializers. Authorized admin DTOs expose editable management fields. |
| F38 — Cached JPA serialization | Cache initialized detached catalog copies without persistence proxies. Separate FAQ/product chat requests serialize successfully. |
| F39 — False bundle savings | Remove the advertised 8% discount because checkout does not implement it. Bundle totals equal the purchasable item totals; zero savings are hidden. |
| F40 — Chat limiter/cache growth | Rate limit the server-observed remote address independently of supplied session IDs; bound/expire rate and conversation stores and limit identifier length. |
| F41 — Seeded fake purchases | Historical sample orders require the explicit `demo` profile; normal/production startup does not create sales history. Existing fake records are not automatically deleted. |
| F42 — Uneditable cost/lead time | Extend authorized product requests/responses and management forms with validated cost and supplier lead time fields. |
| F43 — Purchase verification mismatch | Shipped/delivered qualifying purchases count for verified review status. |
| F44 — Missing/collapsed time buckets | Include all elapsed hours and month-end dates; preserve years and honor custom aggregation grain. Boundary tests cover both inclusive endpoints. |
| F45 — Analytics cache growth | Validate range/grain/date windows and bound the expiring analytics cache. |
| F46 — Broken product links | Recommendation/product links consistently use the actual `/product/:id` route. |

## Release requirements

### Developer branch integration on 15 November

Merged `developer` at `f8295e7` into `feature/catalog` based on `a185931`, preserving lazy routes, protected administrator screens, paginated order history, payment-dispute labels, and the isolated local database profile. The incoming order-management screens use the existing authentication and configured CORS rules. Fulfillment updates hold the order lock, reject invalid reversals and unresolved payment cancellation, and record status/tracking notes in the audit history. Inventory staff do not receive customer order details on the shared dashboard. Receipt downloads use the authenticated API.

Post-merge validation: **166 backend tests passed**, **31 browser tests passed with retries disabled**, **4 frontend unit tests passed**, lint passed with no warnings, and backend packaging/frontend production builds passed. Browser checks used a disposable local database; the online database was not used for merge testing. The new receipt test was corrected to expect the browser's `.pdf` filename extension before the complete browser suite passed.

Tracked crash logs, raw audit output, and incoming backup copies were removed from the index and kept locally. See [repository file guidance](repository-files.md). This cleanup does not rewrite previous commits.

Follow [deployment.md](deployment.md) before starting a persistent installation. In particular: apply the correct database script to a backed-up, stopped environment; generate a new private signing key; configure verified database TLS and HTTPS origins; provision the first administrator explicitly if needed; and validate the merchant/SMTP integrations in their test environments. Deployed secrets, shared rate limiting and ambiguous historical data cannot be corrected safely by assuming values from the repository.
