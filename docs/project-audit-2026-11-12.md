# Project security, performance and reliability audit

Date: 12 November 2026 (Asia/Colombo)

## Result and scope

The current working tree contains **36 findings: one critical configuration vulnerability, ten high-priority defects/risks, 24 medium-priority issues and one low-priority quality-gate issue**. These are triaged findings, not 36 independently exploitable security vulnerabilities. Several high findings are deployment-dependent; each states its conditions. Dependency advisories are counted separately and are not presented as confirmed exploits.

The most urgent work is to remove the published signing-key fallback, enforce order ownership by user ID, stop startup inventory resets, serialize all inventory writers, and enforce promotion limits at finalization. The isolated runtime audit also reproduced negative order totals, invalid legacy checkout, ignored chargebacks and fabricated analytics.

Reviewed the React UI, Spring API, authentication/authorization, products/categories, cart, checkout/payments, promotions, reviews/questions, user/address handling, analytics, storefront media, marketing, database scripts, dependency manifests and CI configuration. The review included existing modified and untracked source files. Application source was not changed; this report and its evidence snapshot are audit deliverables.

Evidence labels distinguish runtime reproduction, measurements, static code findings and deployment/advisory conditions. Line links refer to the reviewed working tree and can move after edits.

## Validation completed

| Check | Result | Practical limit |
|---|---|---|
| Production frontend build | Passed; main JS 1,155.71 kB / 324.49 kB gzip | Bundle-size warning remains |
| Frontend lint | Failed: 20 errors, 5 warnings | Full result captured locally |
| Existing backend suite | 105 tests passed; 0 failures/errors | Local test configuration/H2; not live PostgreSQL |
| Selected browser suites | 23 tests passed | Existing simulated-API suites in headless Edge; real-backend integration suite not run |
| Isolated backend audit | 17 recorded observations, completed | Synthetic users/orders in temporary H2; dummy payment credentials |
| npm audit | 14 affected packages, all reporting a fix available | Registry advisory matches; feature/deployment applicability varies |
| Backend dependency inventory | 131 resolved jars queried; 8 coordinates / 22 distinct OSV advisory matches | Includes test jars; vendor advisories checked separately |

Backend tests required an explicit Mockito agent and local-loopback access in this Windows environment. Earlier tool/network restrictions were resolved before reporting the successful results; they are not application failures. Runtime probes disabled external mail/refunds and did not connect to the configured live database, send mail, or charge/refund real payments.

Selected browser suites: catalog-checkout, feedback, filtering, search-correction and storefront. Passing them demonstrates those covered paths work; it does not contradict the additional failures reproduced below.

## Prioritized findings

### F01 — Critical — default configuration — A published signing key permits administrator impersonation

**Evidence:** Runtime confirmed. **Locations:** [JwtUtil.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/security/JwtUtil.java:23>), [JwtAuthenticationFilter.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/security/JwtAuthenticationFilter.java:61>), [application.properties](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/resources/application.properties:34>).

When JWT_SECRET is absent, the application uses the signing key published in the repository, including under the prod profile. An isolated request signed with that key and an existing administrator's email reached the admin users endpoint with HTTP 200 without knowing the administrator's password. Omitting tokenVersion also bypassed the version check; missing versions are accepted.

**Fix and verification:** Require a strong externally supplied signing key at startup outside explicit tests, reject the known fallback and weak keys, and require the token-version claim. Rotate the key and invalidate existing tokens on any deployment that used the default. Add regressions for missing/old token versions and startup with no secret.

### F02 — High — deployment dependent — Demo administrator credentials are enabled unless the profile is exactly prod

**Evidence:** Runtime confirmed. **Locations:** [AdminDataInitializer.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AdminDataInitializer.java:17>).

The initializer runs under the default profile and every profile except the literal prod profile. It creates an administrator using credentials published in the source when no administrator exists. The isolated audit successfully logged in with those defaults. Naming a deployment profile production or staging does not disable this initializer.

**Fix and verification:** Restrict demonstration accounts to an explicit local/demo profile. Provision the initial production administrator through a separate controlled bootstrap process with a required unique credential. Remove or rotate existing demo accounts before exposing an environment.

### F03 — High — Case-variant email accounts can access and alter another customer's order

**Evidence:** Runtime confirmed. **Locations:** [UserService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/UserService.java:43>), [OrderService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderService.java:317>), [OrderService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderService.java:369>), [PaymentService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/PaymentService.java:31>).

Registration stores email without canonicalization and looks it up case-sensitively, while order ownership uses equalsIgnoreCase. The audit created auditowner@example.test and AuditOwner@example.test as different user IDs, then used the second account to read the first account's payment-status response and switch its card order to COD; both returned 200. The response includes order and shipping information. The same ownership mistake exists in payment initiation.

**Fix and verification:** Authorize every order operation by immutable user ID. Canonicalize account email consistently and add a database uniqueness constraint on the canonical value after resolving existing collisions. Test different IDs with case-variant emails. Standard PostgreSQL text uniqueness is case-sensitive; see [PostgreSQL's explanation](https://www.postgresql.org/docs/17/citext.html).

### F04 — High — Every startup overwrites existing catalog prices and inventory

**Evidence:** Runtime confirmed. **Locations:** [ProductDataLoader.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductDataLoader.java:26>), [ProductDataLoader.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductDataLoader.java:832>).

The unprofiled startup loader rewrites the 25 seeded SKUs, including price, stock and active status. In the audit, a product changed to stock 0, inactive and price LKR 1 became stock 45, active and price LKR 38,500 after the startup loader ran. This can undo real sales, stock corrections and product withdrawals after a restart.

**Fix and verification:** Run seeds only in an explicitly selected development/demo environment. Never reset existing operational rows during application startup. Use controlled migrations for intentional data changes and a restart regression that preserves edited product values.

### F05 — High — An ordinary admin product edit can undo a concurrent sale's stock reduction

**Evidence:** Runtime confirmed. **Locations:** [ProductService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductService.java:237>), [Product.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/Product.java:28>), [StockAllocationService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/StockAllocationService.java:1>).

Checkout locks product rows, but updateProduct reads an entity without a lock or version and later saves its stale state. A synchronized audit paused a description-only edit after its read, completed a COD order, then resumed the edit: stock changed 41 → 40 → 41. Checkout's own locking therefore does not protect inventory from other writers.

**Fix and verification:** Coordinate every inventory writer. Use optimistic version checks with conflict handling, or the same row lock for product edits and checkout; make stock adjustments explicit operations. A description edit must not write stale inventory or aggregate rating fields. Retain this concurrent edit/order scenario as a regression.

### F06 — High — Pending orders bypass promotion usage limits

**Evidence:** Runtime confirmed. **Locations:** [PromoCodeService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/promo/PromoCodeService.java:201>), [PromoCodeUsageRepository.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/promo/PromoCodeUsageRepository.java:14>), [OrderService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderService.java:275>), [OrderService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderService.java:313>).

Usage is validated when a pending card order is created, but pending usages do not consume the relevant limits and confirmation does not recheck them. Two pending orders using a code limited to one total use and one use per customer were both successfully confirmed through COD. A check-then-write race also exists between concurrent redemptions. The new-customer eligibility query additionally omits SHIPPED although other purchase queries include it.

**Fix and verification:** Reserve promotion capacity atomically with a defined expiry, or atomically validate and redeem at final confirmation. Enforce global and per-customer limits together, and define how delayed payments handle expiry or changed eligibility. Align the paid/fulfilled status sets and test concurrent and delayed redemptions.

### F07 — High — Invalid promotion percentages can produce negative order totals

**Evidence:** Runtime confirmed. **Locations:** [PromoCodeRequest.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/promo/PromoCodeRequest.java:10>), [PromoCodeController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/promo/PromoCodeController.java:36>), [PromoCodeService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/promo/PromoCodeService.java:274>).

The admin promotion API accepts a percentage above 100 without request validation. A 150% promotion was accepted and a subsequent order was created with totalAmount -19050. This requires a staff-created invalid promotion; a customer cannot directly select the promotion percentage. UI validation alone cannot protect the API.

**Fix and verification:** Validate promotion requests on the server: percentage in 0–100, nonnegative amounts, valid date ranges, sensible usage limits and required eligibility fields. Cap a discount at the eligible subtotal and enforce a nonnegative payable total in the order service as a final invariant.

### F08 — High — Legacy checkout commits invalid orders and returns malformed JSON

**Evidence:** Runtime confirmed. **Locations:** [OrderController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderController.java:133>), [OrderService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderService.java:413>), [OrderItem.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderItem.java:24>).

The legacy /api/orders/checkout path lacks request validation and calls the newer order creation method internally, bypassing its normal controller validation. A COD request without shipping information committed an order and allocated stock. Returning the raw Order entity then followed the Order → items → order cycle until JSON nesting failed. The client received a 200 response with invalid JSON despite the committed side effects, inviting duplicate retries.

**Fix and verification:** Remove the unused legacy route or route it through the same explicit validated service boundary as current checkout. Return a bounded response DTO, not the entity graph. Reject missing delivery data before any write and verify that a successful response is valid JSON with one committed order.

### F09 — High — A valid chargeback notification leaves an order marked paid

**Evidence:** Runtime confirmed. **Locations:** [PaymentService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/PaymentService.java:59>).

The callback allowlist includes status -3, but the handler returns immediately for an already successful payment and has no chargeback transition. The audit submitted correctly signed simulated success and then chargeback notifications: both returned 200 and the stored payment remained SUCCESS. PayHere documents -3 as chargeback; this is not a signature-verification bypass. [PayHere checkout documentation](https://support.payhere.lk/api-%26-mobile-sdk/checkout-api).

**Fix and verification:** Represent chargebacks explicitly and define fulfillment, accounting and merchant-alert handling. Make callback processing idempotent by event/transition, rather than ignoring all later events after success. Test success followed by chargeback and repeated chargeback notifications.

### F10 — High — Analytics presents fabricated revenue and sales as actual results

**Evidence:** Runtime confirmed. **Locations:** [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:162>), [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:222>), [analyticsExportUtils.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/analytics/utils/analyticsExportUtils.js:47>).

When fewer than five units are found, analytics replaces actual totals with synthetic figures. An empty order database reported LKR 248,500 revenue and 1,480 units sold. Profit is fixed at 45%, growth is assumed, and several charts contain hardcoded figures; the CSV even labels the forecast as machine learning. These results can mislead stock, pricing and business decisions.

**Fix and verification:** Return actual zero/low-volume results. Put demonstration data behind an explicit demo mode with prominent labeling. Label estimates and their assumptions, and calculate profit only when actual cost data exists. Verify an empty database, a single sale and a known reporting period.

### F11 — High — deployment dependent — Missing database configuration silently starts a volatile database

**Evidence:** Code/configuration confirmed. **Locations:** [application.properties](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/resources/application.properties:7>).

The common configuration falls back to an in-memory H2 database and defaults to Hibernate schema update. There is no separate production configuration that requires a persistent database. A missing deployment variable can therefore produce an apparently working shop whose customers, orders, consent records and queues disappear on restart. The same defaults apply if the prod profile is selected.

**Fix and verification:** Keep H2 and automatic schema creation in explicit local/test profiles. Require the production database connection and use schema validation plus versioned migrations. Fail startup for incomplete production settings and verify persistence across a restart.

### F12 — Medium — setup dependent — The supplied SQL schema and migrations disagree with the Java model

**Evidence:** Static finding. **Locations:** [database_setup.sql](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/database_setup.sql:155>), [OrderItem.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderItem.java:35>), [CartItem.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/cart/CartItem.java:32>), [20261030_checkout_final_allocation.sql](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/database_migrations/20261030_checkout_final_allocation.sql:23>).

The setup script requires order_items.product_name, unit_price and sub_total, plus cart_items.unit_price, but the entities do not write those columns. An installation based on this script can reject normal inserts; Hibernate update does not remove obsolete NOT NULL columns. The checkout migration's order-status constraint also excludes SHIPPED and DELIVERED, both present in the Java model. These scripts were reviewed, not executed against a live PostgreSQL database.

**Fix and verification:** Choose one authoritative, versioned schema history; migrate/backfill or remove obsolete columns safely and align enum constraints. Test a fresh PostgreSQL install and an upgrade from the supplied schema, not only ORM-generated test tables.

### F13 — Medium — Started card payments have no effective reconciliation path

**Evidence:** Static finding. **Locations:** [PaymentService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/PaymentService.java:83>), [PaymentService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/PaymentService.java:106>), [OrderRepository.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderRepository.java:14>).

The recovery job selects INITIATED payments but calls a refund helper that only acts on REFUND_PENDING payments. Expiration excludes every order with a payment record. An abandoned gateway flow or lost callback can therefore leave an order pending indefinitely, with COD switching blocked and initiation reusing the same pending payment.

**Fix and verification:** Reconcile unresolved payments using the provider's status retrieval API and a bounded retry/review policy. Only enable retry, expiry or COD once payment uncertainty is resolved. Add a merchant review path for ambiguous refunds as well. [PayHere retrieval API](https://support.payhere.lk/api-%26-mobile-sdk/retrieval-api).

### F14 — Medium — An alternate administrator-promotion route bypasses reauthentication

**Evidence:** Runtime confirmed. **Locations:** [AuthController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AuthController.java:151>), [AdminController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AdminController.java:56>).

The primary promotion route requires the administrator's password, but /api/auth/create-admin treats it as optional. An authenticated administrator request containing only the target email returned 200 and changed the target to ADMIN. This is not anonymous privilege escalation, but it defeats the application's protection against a stolen or unattended admin session.

**Fix and verification:** Apply the same fresh-authentication policy in the shared promotion service for every route, or remove the alternate route. Include administrator registration in the same policy decision and verify that omission of reauthentication fails.

### F15 — Medium — Login rate limits trust a spoofable header and lose counts

**Evidence:** Static finding. **Locations:** [AuthController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AuthController.java:185>), [LoginAttemptService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/security/LoginAttemptService.java:75>).

The controller trusts the first X-Forwarded-For value without checking a trusted proxy, so direct clients can rotate the apparent IP and evade the network-level limit. Account-level limits still exist. Counter increments use separate get/put operations, and the attempt map is cleared wholesale after 5,000 entries, losing partial counts. Limits are also process-local.

**Fix and verification:** Accept forwarded addresses only from a configured trusted proxy that replaces incoming headers. Use atomic expiring counters, bounded eviction and shared state when running multiple instances. Keep both account and network signals and test concurrent failures.

### F16 — Medium — Receipt files lack download ownership checks and content restrictions

**Evidence:** Static finding. **Locations:** [OrderController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderController.java:156>), [WebMvcConfig.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/config/WebMvcConfig.java:14>), [SecurityConfig.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/security/SecurityConfig.java:89>).

Receipt upload checks order ownership, but files are exposed through a generic /uploads resource handler. Authentication alone guards downloads; no order-owner check is performed for a user who obtains another receipt's UUID URL. Upload accepts arbitrary bytes/extensions, and repeated replacements leave old files behind. The configured 5 MB per-file cap does not limit total storage consumption. Executable-content exploitation was not demonstrated.

**Fix and verification:** Serve receipts through an owner/admin-authorized download endpoint. Validate supported file types, use attachment delivery for untrusted content, enforce per-order/user quotas, and clean up replaced/orphaned files. Keep uploads outside any generic static resource directory.

### F17 — Medium — when email delivery is enabled — Marketing consent can be recorded for an unverified mailbox

**Evidence:** Static finding. **Locations:** [UserService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/UserService.java:43>), [MarketingService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/marketing/MarketingService.java:37>).

Public registration does not verify mailbox ownership. A newly registered account can immediately mark its email preference subscribed. Once marketing is enabled, someone can register another person's address and cause marketing mail to be sent to that mailbox. A recorded timestamp establishes that an account opted in, not that the mailbox owner did.

**Fix and verification:** Require mailbox verification or a signed double-opt-in confirmation before a subscription is eligible for delivery. Preserve unsubscribe behavior and test that unverified accounts never enter delivery audiences.

### F18 — Medium — Concurrent administrator changes can remove the last active admin

**Evidence:** Static concurrency finding. **Locations:** [UserService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/UserService.java:239>), [UserService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/UserService.java:294>).

Demotion and deactivation count active administrators and then update a different user row. Two simultaneous requests can both observe two active administrators and both proceed, leaving none. A normal transaction does not serialize this cross-row invariant. The audit did not run this concurrency case.

**Fix and verification:** Serialize changes that affect the active-administrator set using an agreed lock/guard record or a suitable transactional invariant. Test two simultaneous demotions/deactivations and require at least one to fail.

### F19 — Medium — Real sales analytics includes unpaid/failed orders and ignores discounts

**Evidence:** Static finding. **Locations:** [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:122>).

Even after the synthetic fallback is removed, the real-order loop filters only by date and sums quantity × original item price. It includes pending, failed and cancelled orders, and does not account for discounts or refunds. This is a separate calculation defect from the demo-data substitution.

**Fix and verification:** Define separate metrics for orders placed, fulfilled sales, collected payments and net revenue. Filter each by the appropriate statuses and include discounts/refunds consistently. Validate totals using a small fixture containing successful, discounted, cancelled and refunded orders.

### F20 — Medium — Public latest/featured limits are not bounded

**Evidence:** Runtime confirmed. **Locations:** [ProductController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductController.java:67>), [ProductService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductService.java:381>), [ProductService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductService.java:419>).

These public endpoints pass a caller-supplied limit into database pagination without the bound used by the main search endpoint. latest?limit=1000000 returned the full 25-product seed catalog. At scale this permits expensive database fetches and large entity serialization; featured also multiplies the limit, allowing overflow/invalid requests.

**Fix and verification:** Apply a small positive maximum before any arithmetic or query creation and return a predictable validation response. Use the same bound on all collection endpoints and test zero, negative and very large limits.

### F21 — Medium — Autocomplete and chat scan the whole catalog per request

**Evidence:** Static performance finding. **Locations:** [ProductService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductService.java:126>), [AiChatService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/assistant/AiChatService.java:36>).

Autocomplete loads all active products and repeatedly calculates unrestricted edit distances before limiting its results. The chat service also loads all products before handling even simple greeting/business queries. Output limits do not bound this work, and autocomplete has no explicit input-length bound. Cost grows with catalog size and typing/request frequency.

**Fix and verification:** Bound input length and candidate count, fetch lightweight projections, use indexed candidate selection or a cached search index, and limit edit-distance work. Handle chat FAQs before catalog retrieval. Add realistic catalog-size measurements and public-endpoint rate limits.

### F22 — Medium — A 10-product listing causes roughly 45 database statements

**Evidence:** Runtime measured. **Locations:** [Product.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/Product.java:43>), [Product.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/Product.java:55>), [ProductController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductController.java:1>).

Two isolated measurements around a public size=10 product request observed 45 and 46 prepared SQL statements. Returning Product entities serializes four lazy collections and category data for each product, with open-in-view allowing queries during response rendering. This creates many database round trips and returns detail fields that listing cards do not need.

**Fix and verification:** Return a compact catalog DTO and batch-fetch only required data. Avoid fetching multiple collections into one cartesian join. Move response assembly inside an explicit read transaction and disable open-in-view after query plans are corrected. Verify a bounded query count as page size grows.

### F23 — Medium — History and analytics load complete tables into memory

**Evidence:** Static performance finding. **Locations:** [OrderHistoryController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderHistoryController.java:20>), [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:35>), [AdminController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AdminController.java:139>).

Order history has no pagination. Analytics fetches all orders before applying its date range and traverses lazy item/product relationships; even a Today report scans historical data. The admin dashboard loads all users merely to call size(). These paths become slower and more memory-intensive as the store grows.

**Fix and verification:** Paginate order history, perform date/status filters and aggregates in the database, and replace list.size() with count queries. Add indexes for the actual filtered/sorted queries and inspect PostgreSQL execution plans with representative data.

### F24 — Medium — Marketing work scales across subscribers, products and full histories

**Evidence:** Static performance finding. **Locations:** [MarketingService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/marketing/MarketingService.java:81>), [MarketingService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/marketing/MarketingService.java:100>), [MarketingService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/marketing/MarketingService.java:113>), [MarketingWorker.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/marketing/MarketingWorker.java:46>).

Audience preparation loads each subscribed user and their full order history, then matches against the product pool; promo campaigns can multiply work across subscribers × products × history items. All unprepared campaigns run inside one transaction holding the queue lock. Preparation still runs when delivery is disabled. The dashboard performs six count queries for each of up to 30 campaigns.

**Fix and verification:** Batch audience preparation with checkpoints, precompute purchase preferences, use bounded projections and aggregate delivery counts in one grouped query. Keep long audience calculations outside the queue-claim lock. Make disabled-mode preparation an explicit operational choice and measure it separately from mail sending.

### F25 — Medium — Account/cart loading blocks every route without a request deadline

**Evidence:** Static finding. **Locations:** [CartContext.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/cart/hooks/CartContext.jsx:17>), [CartContext.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/cart/hooks/CartContext.jsx:135>), [axios.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/lib/axios.js:3>).

CartProvider wraps the whole router and withholds all children while authentication or the initial cart request is pending. Axios has no timeout. A stalled account/cart request can therefore leave even public browsing on a loading message indefinitely. Authentication initialization also removes the stored token on any request error, including a transient outage.

**Fix and verification:** Render the site shell and public routes independently of account/cart readiness. Add bounded request timeouts, explicit retry states and cancellation. Distinguish an expired/invalid session from network failure; do not automatically retry non-idempotent payment operations.

### F26 — Medium — Changing a password leaves the UI using an invalid token

**Evidence:** Static finding. **Locations:** [UserService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/UserService.java:390>), [ChangePasswordForm.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/user/components/ChangePasswordForm.jsx:20>), [useChangePassword.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/user/hooks/useChangePassword.js:46>), [axios.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/lib/axios.js:10>).

The backend correctly increments tokenVersion when a password changes. The form displays success but supplies no completion handler to clear/replace the token or refresh authentication. The app has no central response handler for the ensuing 401s, so it still appears logged in while protected requests fail.

**Fix and verification:** Complete password changes with a fresh authenticated session or clear the session and direct the user to sign in again. Handle expired/revoked tokens consistently across API calls. Test a password change followed immediately by a protected cart/profile request.

### F27 — Medium — Session changes in another tab leave the current tab with the wrong identity

**Evidence:** Static finding. **Locations:** [AuthContext.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/auth/context/AuthContext.jsx:12>), [axios.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/lib/axios.js:10>), [CartContext.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/cart/hooks/CartContext.jsx:83>).

The token is shared through localStorage, but AuthContext has no storage/BroadcastChannel subscription and retains its current user. After another tab signs into a different account, normal API requests can use the new token while this tab displays the old account. Cart requests capture the old token; their mismatch guard returns before the finally block that clears syncing, so saves can remain stuck.

**Fix and verification:** Synchronize login/logout/account changes across tabs, cancel old requests and remount account-scoped state before further actions. Associate request credentials with the same identity represented in the UI. Ensure every skipped cart sync settles its loading state. Add a two-tab account-switch test.

### F28 — Medium — Search responses can overwrite newer user input

**Evidence:** Static finding. **Locations:** [useSearchAutocomplete.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/products/hooks/useSearchAutocomplete.js:21>), [useAdminUsers.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/admin/hooks/useAdminUsers.js:12>).

Autocomplete has no cancellation or stale-response guard, so an older request can overwrite newer suggestions or reopen a cleared dropdown. Admin user search likewise accepts out-of-order responses and sends a request on every keystroke. Slow networks make the displayed list inconsistent with the input.

**Fix and verification:** Abort superseded requests or compare a request sequence/query key before updating state. Debounce admin search and only let the newest request control loading/error state. Test two responses delivered in reverse order.

### F29 — Medium — Inventory-manager permissions disagree between the UI and API

**Evidence:** Static finding. **Locations:** [AdminRoute.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/admin/components/AdminRoute.jsx:25>), [AdminController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AdminController.java:22>), [SecurityConfig.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/security/SecurityConfig.java:66>).

SecurityConfig grants INVENTORY_MANAGER product/category operations and dashboard access, but AdminRoute only allows ADMIN. The dashboard controller also has an ADMIN-only class annotation. An inventory manager can therefore have authorized backend inventory duties yet be blocked from their management UI/dashboard.

**Fix and verification:** Define one role-to-capability matrix and apply it consistently to routes, navigation and method security. Give inventory managers only their intended screens/endpoints; keep customer-management and financial analytics restricted as required. Test both roles end to end.

### F30 — Medium — separate-origin deployments — CORS ignores the configured frontend deployment URL

**Evidence:** Static finding. **Locations:** [SecurityConfig.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/security/SecurityConfig.java:101>), [application.properties](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/resources/application.properties:17>).

The security filter's CORS allowlist is hardcoded to localhost origins, while FRONTEND_URL is used elsewhere. Deploying the frontend on a different origin and setting that variable does not authorize browser API requests. This affects a separate-origin deployment; a same-origin reverse proxy can avoid the problem.

**Fix and verification:** Read an explicit validated list of allowed frontend origins from deployment configuration and test the deployed preflight request. Do not replace the list with a broad wildcard for authenticated requests.

### F31 — Medium — The initial browser bundle includes every route

**Evidence:** Build measured. **Locations:** [App.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/App.jsx:5>).

The production build produced one main JavaScript bundle of 1,155.71 kB, or 324.49 kB gzip, and Vite emitted its large-chunk warning. Eager route imports pull admin analytics/charting, profile maps and checkout code into the initial download for ordinary shoppers.

**Fix and verification:** Split routes with React.lazy/Suspense and load charts/maps when their screens are opened. Measure the initial customer route separately from admin routes and enforce a sensible bundle budget. Simply raising the warning limit would not improve loading.

### F32 — Medium — Hero delivery loads oversized media and repeatedly fetches the database blob

**Evidence:** Measured size plus static finding. **Locations:** [StorefrontHero.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/products/components/StorefrontHero.jsx:6>), [StorefrontController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/storefront/StorefrontController.java:21>), [StorefrontHero.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/storefront/StorefrontHero.java:14>).

The default hero PNG is about 1.99 MB and has no responsive alternatives. For an uploaded hero, the metadata query hydrates the image byte array and the image request reads it again. The versioned image URL is served with no-cache and no explicit validator, so the application does not use its version identifier for efficient immutable caching.

**Fix and verification:** Provide appropriately sized modern image variants and srcset/sizes. Query metadata without the image blob and cache images by immutable version, or use an ETag with revalidation. Consider object storage/CDN delivery for uploaded media.

### F33 — Medium — spreadsheet export — CSV escaping does not prevent spreadsheet formulas

**Evidence:** Static finding. **Locations:** [analyticsExportUtils.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/analytics/utils/analyticsExportUtils.js:20>).

sanitizeCSV escapes quotes but preserves formula-leading text. A product/category name such as =1+1 becomes a quoted CSV cell that spreadsheet applications may interpret as a formula when an administrator opens the report. Writing these names requires product/category permissions; no arbitrary-code execution was demonstrated.

**Fix and verification:** Export untrusted text as literal text using a spreadsheet-safe policy for formula prefixes, including leading whitespace/control characters, or generate a typed spreadsheet with explicit string cells. Preserve actual numeric cells and test exports in the supported spreadsheet application.

### F34 — Medium — advisory triage — Frontend and backend versions match published security advisories

**Evidence:** Dependency scans plus source checks. **Locations:** [package-lock.json](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/package-lock.json:1>), [pom.xml](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/pom.xml:1>).

The npm audit returned 14 affected packages: 11 high, one moderate and two low according to registry classifications. An OSV query of all 131 jars on the resolved backend test classpath found eight Maven package coordinates with 22 distinct advisories. These counts are version matches, not counts of exploitable application defects. Vendor checks identified further relevant patch information that the OSV results did not fully cover; details follow below.

**Fix and verification:** Upgrade the frontend lockfile and the backend's coordinated dependency/BOM versions, then rerun dependency checks and functional tests. Review each advisory's required features and deployment conditions. Prefer a compatible patched Spring Boot release over arbitrary independent framework overrides, and include automated advisory scanning in CI.

### F35 — Low — Lint fails and CI does not enforce the failing check

**Evidence:** Validation confirmed. **Locations:** [eslint.config.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/eslint.config.js:1>), [frontend-checks.yml](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/.github/workflows/frontend-checks.yml:1>), [e2e-checks.yml](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/.github/workflows/e2e-checks.yml:54>).

npm run lint reports 20 errors and five warnings: undefined process in the Playwright config, unused values, mixed fast-refresh exports and state/effect dependency issues. The frontend workflow builds but does not run lint. The workflows target pull requests to developer, and the E2E workflow uses a fixed 30-second backend startup sleep. Passing tests currently leave the reproduced security/business cases uncovered.

**Fix and verification:** Fix the real lint issues, configure appropriate Node globals for test configuration, and enforce lint in the relevant branch checks. Replace fixed startup sleeps with bounded readiness checks. Add focused regressions for F01–F09 and verify migrations against PostgreSQL; avoid treating style warnings as security vulnerabilities.

### F36 — Medium — database connection configuration — The sample PostgreSQL URL does not authenticate the database server

**Evidence:** Offline driver check and vendor documentation confirmed. **Locations:** [.env.example](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/.env.example:4>).

The example uses sslmode=require, which encrypts the connection but accepts unverified server certificates in pgJDBC. It also uses channel_binding=require, whereas the JDBC property is channelBinding; the intended enforcement is therefore not configured by that spelling. Parsing an equivalent example URL with the installed driver confirmed that its effective channel-binding policy remained prefer. This leaves a deployment following the example without the expected server-identity protections. The actual deployed connection settings were not inspected, and the offline check opened no database connection.

**Fix and verification:** Use sslmode=verify-full with the appropriate trusted CA and hostname, and the correctly named channelBinding property if required. Upgrade the JDBC driver before relying on enforced channel binding (see the dependency notes). Verify an invalid certificate/hostname is rejected. [pgJDBC TLS documentation](https://jdbc.postgresql.org/documentation/ssl/) and [connection properties](https://jdbc.postgresql.org/documentation/use/).

## Dependency details and applicability

The complete version inventory, package-to-advisory mappings, source URLs and runtime observations are in [the evidence snapshot](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/docs/audit-2026-11-12/evidence.json>). The JSON preserves advisory-database severity separately from this report's application assessment. Vendor and database severity labels sometimes differ; a database label does not establish exploitability here.

### Frontend snapshot

| Package | Resolved version | npm severity | Lockfile scope |
|---|---|---|---|
| @babel/core | 7.29.0 | Low | Development |
| @humanfs/node | 0.16.7 | Moderate | Development |
| axios | 1.19.0 | High | Application dependency |
| brace-expansion | 1.1.13 | High | Development |
| browserslist | 4.28.1 | High | Development |
| follow-redirects | 1.16.0 | High | Axios dependency; Node HTTP path |
| js-yaml | 4.1.1 | High | Development |
| nanoid | 3.3.11 | High | Development |
| postcss | 8.5.8 | High | Development |
| react-router | 7.15.0 | High | Application dependency |
| react-router-dom | 7.15.0 | Low | Application dependency |
| source-map-js | 1.2.1 | High | Development |
| vite | 8.0.3 | High | Development |
| zod | 4.3.6 | High | Development |

All 14 entries reported an available fix. This does not establish that an automatic update is compatible or sufficient for every issue. Update in a controlled change and rescan the resulting lockfile.

Examples of necessary applicability checks:

- Vite 8.0.3 matches the development-server WebSocket file-read advisory. Its described attack requires a network-exposed development server. The repository's default Vite configuration is not evidence that this server is publicly exposed, and a deployed static build does not run the Vite development server. Several additional Vite advisories are in the scan, so applying only one early patch is insufficient. [Vite maintainer advisory](https://github.com/vitejs/vite/security/advisories/GHSA-p9ff-h696-f583).
- Axios includes Node HTTP adapter advisories. For example, the data-URL denial-of-service advisory explicitly does not affect browser XHR/fetch adapters; this project uses Axios from its browser UI. That advisory is therefore not proof of server-side denial of service in this application. Other Axios entries still need individual review. [Axios maintainer advisory](https://github.com/axios/axios/security/advisories/GHSA-c29m-xwm3-cm6r).
- Router server/SSR/RSC paths must be assessed separately from this client-side BrowserRouter application. Development/build-tool advisories concern those tools and their inputs; the npm severity alone does not mean all those packages execute in the shopper's browser.

### Backend snapshot

The scan queried the installed versions from the successful backend test classpath using the [OSV batch API](https://google.github.io/osv.dev/post-v1-querybatch/). All 131 package queries completed without pagination tokens. The eight matching coordinates are:

| Maven package | Version | Distinct advisory IDs for this coordinate |
|---|---|---:|
| org.apache.logging.log4j:log4j-api | 2.25.4 | 1 |
| tools.jackson.core:jackson-databind | 3.1.4 | 7 |
| tools.jackson.core:jackson-core | 3.1.4 | 2 |
| org.apache.tomcat.embed:tomcat-embed-core | 11.0.22 | 7 |
| org.springframework:spring-webmvc | 7.0.8 | 2 |
| org.postgresql:postgresql | 42.7.11 | 1 |
| com.fasterxml.jackson.core:jackson-databind | 2.21.4 | 9 |
| com.fasterxml.jackson.core:jackson-core | 2.21.4 | 2 |

The rows overlap: there are **22 unique advisory IDs**, not 31 separate defects. Both Jackson generations are present because the web stack and JWT support bring different dependency lines. No backend dependency exploit was executed as part of this audit.

- **Tomcat:** several indexed issues require container FORM/DIGEST authentication, rewrite rules or container security constraints, which this Spring Security/JWT application does not configure. Apache's current list also contains later protocol and request/response-isolation fixes beyond the seven OSV matches, including HTTP/2 issues affecting 11.0.22 and a reverse-proxy-related HTTP/1.0 issue. The production proxy/connectors were not inspected. Upgrade the supported coordinated stack and review deployment applicability against the vendor list; the scan count is not a complete Tomcat advisory inventory. [Apache Tomcat security notices](https://tomcat.apache.org/security-11.html).
- **Jackson:** many matches require specific annotations/types or enabled polymorphic deserialization. No application use of JsonView, JsonUnwrapped, JsonIdentityInfo, JsonTypeInfo, default typing, InetAddress or XMLGregorianCalendar was found. The DataInput parser advisory is specific to that parser and is not proof that normal HTTP InputStream parsing is affected. Numeric parsing and other bindings still merit regression checks after an update. [Jackson DataInput advisory](https://github.com/FasterXML/jackson-core/security/advisories/GHSA-7hhh-6rmp-j9qf), [numeric parsing advisory](https://github.com/FasterXML/jackson-core/security/advisories/GHSA-p6pp-m3f8-5c89), [identity-reference advisory](https://github.com/FasterXML/jackson-databind/security/advisories/GHSA-cxp5-3px4-pw24).
- **Spring MVC 7.0.8:** the vendor identifies XsltView and SSE-fragment issues fixed in 7.0.9. Neither feature was found in this repository, so these remain version matches without demonstrated application reachability. [XsltView advisory](https://spring.io/security/cve-2026-47884/), [SSE advisory](https://spring.io/security/cve-2026-47890/).
- **PostgreSQL JDBC 42.7.11:** the channel-binding downgrade advisory affects connections configured with channelBinding=require; it is fixed in 42.7.12. The example configuration has the separate problem described in F36. Verify certificate/hostname authentication and upgrade before relying on enforced channel binding. [pgJDBC maintainer advisory](https://github.com/pgjdbc/pgjdbc/security/advisories/GHSA-j92g-9f8w-j867).
- **Log4j API:** the match concerns malformed JSON for non-finite values in MapMessage serialization. No application MapMessage use was found; the default logging path uses Logback. It is not the historical Log4Shell issue. The evidence snapshot includes the vendor reference for CVE-2026-49844.
- **Additional vendor checks:** Spring Security 7.1.0 has a two-argument AesBytesEncryptor issue fixed in 7.1.1, and Spring Data JPA 4.1.0 has a native-query sorting issue fixed in 4.1.1. Neither AesBytesEncryptor use nor native-query repository methods were found here. These vendor checks supplement the OSV results rather than inflating its match count. [Spring Security advisory](https://spring.io/security/cve-2026-47842/), [Spring Data JPA advisory](https://spring.io/security/cve-2026-47834/).

Patch versions above describe individual advisories, not a claim that those exact versions are the newest or resolve every advisory. Choose a currently supported compatible release and rescan.

## Reproduced behavior

| Probe | Observed result |
|---|---|
| Empty order database | Analytics reported 1,480 units and LKR 248,500 revenue |
| Published default admin credentials | Login succeeded in the isolated non-prod profile |
| Token signed with repository fallback key, no version claim | Admin users endpoint returned 200 |
| Two case-variant email registrations | Both accepted; distinct user IDs |
| Second account reads/switches first account's order | Both operations returned 200 |
| Promotion capped at one use | Two pending orders both confirmed with the promotion |
| 150% percentage promotion | Accepted; order total was LKR -19,050 |
| Signed payment success followed by signed chargeback | Both accepted; stored status remained SUCCESS |
| Description edit concurrent with a sale | Stock 41 → 40 after sale → 41 after admin save |
| Legacy checkout without shipping | One order committed; 200 response could not be parsed as JSON |
| Product page size 10 | 45–46 prepared SQL statements observed |
| Latest products limit 1,000,000 | Returned all 25 seeded products |
| Startup product loader after inventory edits | Stock 0 → 45; inactive → active; price 1 → 38,500 |
| Administrator promotion without password confirmation | Returned 200; target became ADMIN |

The 17 raw observations include individual setup and callback results, so the grouped table has fewer rows than the evidence snapshot. The concurrency probe used a controlled pause around the actual repository read to force the overlapping edit/sale schedule; it did not change application source.

## Suggested repair order

1. **Account and order isolation:** F01–F03, then F14–F18 and F36. Remove unsafe deployment credentials, use stable user IDs for authorization, and protect account-sensitive operations.
2. **Inventory and money correctness:** F04–F09, F11–F13 and F19. Preserve stock across restarts/concurrent edits, enforce final promotion constraints, validate every checkout path and model payment reversals/recovery.
3. **Truthful reporting:** F10 and F19 before using analytics for operational decisions or exports.
4. **Dependency maintenance:** F34, alongside the urgent code fixes. Recheck reachability and the vendor advisories for the actual deployment configuration.
5. **Scale and user experience:** F20–F32. Start with bounded queries, product DTOs, public-route loading independence and route splitting; use measurements to guide later tuning.
6. **Export and regression quality:** F33 and F35. Add the missing focused security/concurrency/migration cases and enforce the checks in CI.

## Working protections and limits

The review found useful existing controls: password hashing; server-side role checks; account-status/token-version checks for normally issued tokens; provider notification signature, amount and currency validation; server-calculated checkout prices; locked checkout stock allocation; owner checks in several user-content operations; and image decoding/re-encoding for the storefront banner. The findings identify gaps around those controls, not their absence everywhere. No obvious raw-SQL string concatenation or React HTML-injection sink was identified in the reviewed application code; that is not a formal proof against injection.

The current-tree secret-pattern inspection did not establish a leaked external private key or account token. The published JWT/bootstrap defaults are the confirmed credential risks. Private environment values and full Git history were not audited. JWT storage in localStorage is an additional consequence amplifier if XSS is introduced; no XSS exploit was demonstrated, so that storage choice alone is not counted as a proven vulnerability.

This is a broad source/dependency/local-runtime review, not a guarantee that every vulnerability has been found. It did not exercise live PostgreSQL migrations, real PayHere/SMTP delivery, production TLS/proxies/access controls/backups, long-running load, operating-system/JDK advisories, or Maven plugin dependencies outside the resolved test classpath. Deployed configuration may mitigate or expose conditional findings. Application source remains unchanged.

