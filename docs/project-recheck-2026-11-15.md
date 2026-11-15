# Project recheck — security, performance and reliability

Historical snapshot before remediation. See [the remediation report](remediation-2026-11-15.md) for the subsequent fixes and verification results.

15 November 2026 · Asia/Colombo · reviewed commit `02ec24fbd0483691fd926afa111d2b36dcac6739`

The recheck found **10 additional actionable issues (F37–F46)**. Of the 36 earlier findings, **32 remain open, three are partially resolved (F10, F21, F23), and one is resolved for its original scope (F19)**. There are therefore **45 findings still requiring some work**, spanning security, correctness, performance and operational configuration. This is not a count of independently exploitable vulnerabilities. Dependency matches are reported separately.

The highest priorities remain the published signing-key fallback, cross-account order access, unsafe startup data loading, lost stock updates, promotion/payment correctness, and the newly verified mismatch between bundle pricing and checkout. The current repository does not contain completed fixes for these paths. Application source was not modified during this recheck.

## Validation and scope

| Check | Current result | Limit |
|---|---|---|
| Backend suite | 137 tests passed, zero failures/errors | H2 and dummy/test configuration; not live PostgreSQL |
| Existing browser suites | 23 tests passed | Simulated API responses, headless Edge; not a real-backend end-to-end run |
| Focused audit probes | 32 observations completed | Disposable local data; includes HTTP, synchronized concurrency and mocked-repository calculation fixtures |
| Frontend build | Passed; main JS 1,216.77 kB / 339.81 kB gzip | Built using existing node_modules, which differs from the lockfile |
| Frontend lint | Failed: 23 errors, 6 warnings | See saved lint output |
| npm lockfile audit | 14 affected packages: 11 high, 1 moderate, 2 low | Advisory matches, not demonstrated browser exploits |
| Backend dependency query | 131 coordinates checked; 8 packages / 22 distinct advisory IDs | Includes test-classpath dependencies; no pagination left incomplete |

The local installation differs from `package-lock.json` in **43 existing package paths**. For example, the build uses Vite 8.3.8 while the saved lockfile selects 8.0.3. The successful build/browser results therefore do **not** establish a successful clean `npm ci` build with the committed dependency set. The lockfile remains the relevant deployment advisory input; npm documents the lockfile tree as the input to its Quick Audit endpoint. No packages were upgraded or downgraded during this recheck. [npm audit documentation](https://docs.npmjs.com/cli/v11/commands/npm-audit/).

The first restricted test/build attempts encountered local file/loopback access restrictions. Reruns with the required access passed; these environment errors are not counted as project defects. All backend probes explicitly selected temporary H2 and bypassed the local environment-file import. Marketing delivery was disabled and payment credentials were dummy values. No live database, real mail, charge, refund, or deployed service was exercised.

Coverage included authentication and roles, account/address access, cart, checkout/payment transitions, inventory concurrency, promotions, reviews/questions, catalog/search, recommendations/chat, analytics, marketing, storefront media, SQL setup/migrations, dependencies and CI. Live reverse-proxy behavior, deployed secrets, PostgreSQL migration execution/plans and production-scale load remain outside this local recheck.

## Additional findings

### F37 — Medium — Public product responses expose internal cost prices

**Evidence:** Runtime HTTP. **Locations:** [Product.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/Product.java:53>), [ProductController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductController.java:47>).

An unauthenticated product request returned both costPrice and effectiveCostPrice as 22,330.00. Product is returned directly by public catalog, detail, recommendation and chat responses, so adding internal cost fields to the entity made them public. Actual supplier costs and margins can be disclosed once real values are stored.

**Resolution:** Return an explicit public product DTO with an allowlist of shopper-facing fields. Keep cost and other management-only fields in authorized admin responses, and test every public serializer.

### F38 — Medium — Catalog caching breaks later chat requests

**Evidence:** Runtime HTTP. **Locations:** [AiChatService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/assistant/AiChatService.java:407>), [Product.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/Product.java:63>).

After a fresh chat request for delivery information filled the cache, requests for headsets and powerbanks each returned HTTP 400 with HttpMessageNotWritableException. The singleton cache retains Product entities with lazy collections attached to a previous, closed request session. The later response cannot serialize those collections. Mock-repository chat tests do not exercise this persistence lifecycle.

**Resolution:** Build immutable chat product DTOs inside a read transaction and cache those DTOs. Refresh or invalidate the cache on catalog changes. Add a real-persistence test covering a FAQ followed by recommendations in separate requests.

### F39 — High — Advertised bundle savings disappear at checkout

**Evidence:** Runtime pricing comparison. **Locations:** [RecommendationService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/recommendation/RecommendationService.java:311>), [FrequentlyBoughtTogether.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/products/components/FrequentlyBoughtTogether.jsx:40>), [OrderService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderService.java:135>).

Frequently-bought-together advertises an 8% discount, but Add Bundle to Cart only adds ordinary products. In the isolated check the advertised bundle total was LKR 170,016; checkout used subtotal LKR 184,800 and discount 0, before shipping. OrderService contains no bundle qualification or pricing rule. Customers are shown a price the actual order does not honor.

**Resolution:** Implement a shared server-side bundle rule used by recommendations, cart validation and checkout, or remove the savings claim until that rule exists. Test the displayed bundle against the submitted order total.

### F40 — Medium — Public chat can bypass throttling and exceed its session capacity

**Evidence:** Runtime in-process / static reachability. **Locations:** [AiChatService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/assistant/AiChatService.java:380>), [AiChatService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/assistant/AiChatService.java:401>).

The request supplies the session ID; omitting it generates a fresh random ID. Throttling therefore does not constrain a client that rotates IDs. rateLimitStore never removes keys, and sessionStore only removes expired entries after exceeding MAX_SESSIONS, with no hard cap on fresh sessions. A bounded in-process check created 5,002 retained sessions and 5,002 rate-limit keys despite the declared 5,000-session cap. No load or availability attack was performed.

**Resolution:** Apply a server-derived network/account rate limit alongside session limits, constrain ID length, and use a size-bounded expiring cache for both stores. Define eviction behavior that does not reset another client's active limits.

### F41 — High — Normal startup creates historical demonstration sales

**Evidence:** Runtime/configuration. **Locations:** [OrderDataLoader.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderDataLoader.java:21>), [OrderDataLoader.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderDataLoader.java:87>).

A clean isolated database under profile audit received 20 historical orders without a checkout request. OrderDataLoader runs whenever the exact prod profile is absent, assigns paid/fulfilled statuses, and sets stockAllocated=true without allocating stock. It can attach these fabricated orders to the default customer or the first existing customer. The now-correct real analytics then counts this demo data as live sales.

**Resolution:** Require an explicit demo-only profile and a separate demonstration database. Remove automatic order seeding from shared/staging/production startup. Existing seeded records require a reviewed cleanup based on their identifiers and dependencies.

### F42 — Medium — Cost and supplier lead-time updates silently do nothing

**Evidence:** Runtime HTTP / static data flow. **Locations:** [ProductRequest.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductRequest.java:6>), [ProductService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductService.java:238>), [Product.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/Product.java:112>).

Product now has costPrice and leadTimeDays, and analytics uses them for profit and replenishment. ProductRequest and the management form do not expose them, and ProductService never maps them. A PUT containing costPrice=25 and leadTimeDays=99 returned HTTP 200 while stored values stayed 40 and 7. Products created through the normal API therefore fall back to an assumed 60% cost and seven-day lead time; the data is presented as purchase-time costs rather than an explicit estimate.

**Resolution:** Add validated management inputs and persist them, distinguish unknown cost from true zero, and label any estimates. Preserve purchase-time snapshots and prevent startup seeds from overwriting supplied values.

### F43 — Medium — Delivered purchases no longer qualify for product reviews

**Evidence:** Runtime HTTP. **Locations:** [ReviewService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/review/ReviewService.java:34>), [ReviewService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/review/ReviewService.java:70>).

ReviewService.purchased and the pending-review query accept only CONFIRMED, PROCESSING and COMPLETED. A customer whose only purchase was set to DELIVERED received HTTP 403 when posting a review. SHIPPED is also omitted. Customers lose eligibility at the point they would normally review an item.

**Resolution:** Use a shared qualifying-purchase definition including shipped/delivered orders and appropriate refund handling. Apply it to review creation and the pending-review list; test each supported fulfillment status.

### F44 — Medium — Sales charts omit transactions outside a few sampled hours and dates

**Evidence:** Runtime calculation fixture / static range review. **Locations:** [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:695>), [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:736>).

Today's chart counts only orders whose hour exactly equals 8, 11, 14, 17, 20 or 23, rather than interval buckets. A one-unit sale at 10:00 produced overviewUnits=1 and chartUnits=0. Monthly charts use four seven-day buckets and omit days 29–31; a sale on October 31 likewise appeared in the overview but not the chart. Daily/weekly grain uses periods relative to now even for custom dates; default monthly keys also omit the year.

**Resolution:** Construct explicit continuous intervals from the selected start/end dates, include the final partial interval, and use full dates or YearMonth as keys. Require the sum of actual chart buckets to equal the corresponding period total.

### F45 — Medium — Analytics cache retains an unlimited number of expired entries

**Evidence:** Runtime in-process / static lifetime review. **Locations:** [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:35>), [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:76>).

The 30-second TTL only decides whether an entry may be reused. No entry is removed and no maximum size is enforced. Cache keys use raw range/grain parameters before validation/canonicalization; arbitrary grain strings fall through to the same computation. Thirty equivalent invalid-grain requests retained thirty additional complete report objects (32 total including the two earlier fixtures). This endpoint requires ADMIN, so the exposure is long-running resource growth or misuse by an authorized caller, not anonymous access.

**Resolution:** Validate and canonicalize parameters before building keys and use a bounded cache with actual expiry/eviction. Avoid retaining report graphs for arbitrary input variants.

### F46 — Low — Bundle product links navigate to a nonexistent route

**Evidence:** Static route comparison. **Locations:** [FrequentlyBoughtTogether.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/products/components/FrequentlyBoughtTogether.jsx:96>), [App.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/App.jsx:48>).

The bundle cards link to /products/{id}, but App registers /product/:id. Following a bundle product name therefore reaches the fallback redirect to the homepage instead of opening the product. This path is not exercised by the current mocked browser tests.

**Resolution:** Use the registered singular product path, preferably through a shared route helper, and add a browser check that follows a bundle product link.

## Recheck of all earlier findings

| ID | Current priority / status | Current evidence and result |
|---|---|---|
| F01 | Critical; **Open** | Runtime: Published JWT signing-key fallback and optional tokenVersion still allow administrator impersonation when JWT_SECRET is absent. A forged token reached the admin users endpoint with HTTP 200. [JwtUtil.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/security/JwtUtil.java:23>) |
| F02 | High; **Open** | Runtime/configuration: Default demonstration administrator credentials still work under the audit profile; the initializer is enabled for every profile except the exact name prod. [AdminDataInitializer.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AdminDataInitializer.java:14>) |
| F03 | High; **Open** | Runtime: Two case-variant email registrations created distinct user IDs. The second user read the first order and switched it to COD (both HTTP 200). Payment initiation uses the same unsafe ownership comparison. [OrderService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderService.java:314>) |
| F04 | High; **Open** | Runtime: Running the startup loader changed stock 0 to 45, inactive to active, and price 1 to 38,500. It now also overwrites cost price and lead time. [ProductDataLoader.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductDataLoader.java:847>) |
| F05 | High; **Open** | Runtime/concurrency: A concurrent description edit restored inventory consumed by a sale: 41 to 40 to 41. Product still has no optimistic version, and the edit does not share checkout locking. [ProductService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductService.java:238>) |
| F06 | High; **Open** | Runtime: Two pending orders using a promotion limited to one use both confirmed through COD. The usage check excludes pending reservations and is not repeated at finalization. [PromoCodeService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/promo/PromoCodeService.java:201>) |
| F07 | High; **Open** | Runtime: The API accepted a 150% promotion and created an order totaling LKR -19,050. Percentage validation and a final nonnegative-total invariant remain missing. [PromoCodeService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/promo/PromoCodeService.java:274>) |
| F08 | High; **Open** | Runtime: Legacy checkout without shipping information committed an order and returned HTTP 200 with invalid JSON. Entity recursion and duplicate-retry risk remain. [OrderController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderController.java:133>) |
| F09 | High; **Open** | Runtime: A correctly signed simulated chargeback following success returned 200 and left the payment SUCCESS. The terminal-state return still ignores -3. [PaymentService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/PaymentService.java:62>) |
| F10 | Medium; **Partially resolved** | Runtime/code: Empty data now returns zero and demo mode is explicit. However, a single 10:00 sale still produces fabricated 35%/40%/25% morning/afternoon/evening profit buckets. Missing cost data is silently estimated. Original severity reduced from High; see F41, F42 and F44. [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:811>) |
| F11 | High; **Open** | Configuration: Missing database settings still select volatile H2 and automatic schema update, including production-like profiles. No fail-fast persistent-database requirement exists. [application.properties](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/resources/application.properties:7>) |
| F12 | Medium; **Open** | Static schema review: Bootstrap SQL still requires obsolete order_items/cart_items fields that the entities do not write. The checkout migration excludes SHIPPED, DELIVERED and legacy PAID/PENDING values used by current code/seeds. Fresh PostgreSQL installation and upgrade remain unverified. [database_setup.sql](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/database_setup.sql:159>) |
| F13 | Medium; **Open** | Static control flow: Recovery still sends INITIATED payments to a helper that acts only on REFUND_PENDING. Started payments are excluded from expiry; no provider retrieval or merchant review path resolves uncertainty. [PaymentService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/PaymentService.java:107>) |
| F14 | Medium; **Open** | Runtime: The alternate create-admin endpoint still promotes without the acting administrator password. The reauthentication check is conditional on the password being supplied. [AuthController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AuthController.java:170>) |
| F15 | Medium; **Open** | Static security review: Login still trusts the client-supplied X-Forwarded-For value. Counters use separate get/put operations, clear partial counts wholesale, and are process-local. [AuthController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/AuthController.java:189>) |
| F16 | Medium; **Open** | Static authorization/storage review: Receipt upload accepts arbitrary content/extensions and stores a new UUID file on every replacement. Downloads still use the generic static uploads handler with no order-owner check; no aggregate quota or replacement cleanup exists. [OrderController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderController.java:190>) |
| F17 | Medium; **Open** | Runtime: A newly registered, unverified mailbox immediately became subscribed. Delivery is disabled by default, but enabling marketing makes these accounts eligible without mailbox confirmation. No mail was sent during this check. [MarketingService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/marketing/MarketingService.java:45>) |
| F18 | Medium; **Open** | Runtime/concurrency: Two synchronized administrator deactivations both completed without error, leaving zero active administrators. The count-then-write check does not serialize the invariant. [UserService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/UserService.java:288>) |
| F19 | Medium; **Resolved for original scope** | Tests/runtime/code: Qualifying status filters now exclude pending, failed, cancelled and refunded orders. The fixture with sales 100, cost 40 and discount 20 reports netProfit 40. Revenue is defined as gross sales; this does not establish collected cash or resolve the other analytics findings. [AnalyticsService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/analytics/AnalyticsService.java:287>) |
| F20 | Medium; **Open** | Runtime: latest?limit=1000000 still returns the entire 25-product catalog; latest/featured lack a safe maximum before query creation and multiplication. [ProductService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductService.java:419>) |
| F21 | Medium; **Partially resolved** | Static/performance review: Chat now caches catalog reads for 60 seconds and limits message length, but caches entities unsafely (F38). Autocomplete still reads all active products and performs unbounded edit-distance work for each request; chat FAQs still fill the catalog cache. [ProductService.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductService.java:126>) |
| F22 | Medium; **Open** | Runtime measurement: A public page containing ten products executed 46 prepared database statements. Full entity serialization still loads lazy collections individually. [ProductController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/product/ProductController.java:27>) |
| F23 | Medium; **Partially resolved** | Static/performance review: Analytics now filters bounded date ranges in SQL and fetches order items, an improvement. Order history remains unpaged; the dashboard loads all users to count them; all-time analytics and public trending recommendations still load full order histories. [OrderHistoryController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/order/OrderHistoryController.java:21>) |
| F24 | Medium; **Open** | Static/performance review: Audience preparation still loops across all subscribers, catalog candidates and full purchase histories inside a global queue transaction. It runs even with delivery disabled. Dashboard counts remain one query per campaign/status. [MarketingWorker.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/marketing/MarketingWorker.java:50>) |
| F25 | Medium; **Open** | Static UI/control flow: The global cart provider still replaces all routes while account/cart loading is pending. API requests have no timeout, so a stalled request can prevent even the storefront or login screen rendering. [CartContext.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/cart/hooks/CartContext.jsx:19>) |
| F26 | Medium; **Open** | Static session flow: Password changes invalidate the server token, but ChangePasswordForm supplies no completion handler and Axios has no centralized 401 handling. The UI remains signed in with revoked credentials. [ChangePasswordForm.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/user/components/ChangePasswordForm.jsx:20>) |
| F27 | Medium; **Open** | Static session flow: AuthContext still does not observe cross-tab token changes while Axios reads the shared token on each request. A tab can display one identity and send another identity's credentials; skipped cart saves can remain in syncing state. [axios.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/lib/axios.js:11>) |
| F28 | Medium; **Open** | Static async flow: Autocomplete and administrator search still accept out-of-order responses. There is no cancellation or sequence guard, and administrator search is not debounced. [useSearchAutocomplete.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/products/hooks/useSearchAutocomplete.js:23>) |
| F29 | Medium; **Open** | Static authorization review: The backend inventory rules permit INVENTORY_MANAGER but the management UI and dashboard method security remain ADMIN-only. Intended inventory duties cannot be completed through the UI. [AdminRoute.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/admin/components/AdminRoute.jsx:25>) |
| F30 | Medium; **Open** | Configuration review: Security CORS origins are still hardcoded to localhost and ignore FRONTEND_URL. A separately hosted frontend remains blocked unless a same-origin proxy or other deployment override compensates. [SecurityConfig.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/auth/security/SecurityConfig.java:105>) |
| F31 | Medium; **Open** | Build measurement: Every route is still eagerly imported. The measured main bundle is 1,216.77 kB (339.81 kB gzip), larger than the earlier 1,155.71 kB. See the installed-package/lockfile limitation below. [App.jsx](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/App.jsx:19>) |
| F32 | Medium; **Open** | File measurement/static review: The default hero remains 1,988,419 bytes without responsive variants. Metadata hydrates the image blob, and the versioned image endpoint still returns no-cache without an explicit validator. [StorefrontController.java](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/src/main/java/com/icrowd_api/features/storefront/StorefrontController.java:23>) |
| F33 | Medium; **Open** | Static export review: CSV escaping still only quotes text and escapes quotation marks. Formula-leading product/category names remain executable spreadsheet formulas when opened by a spreadsheet application. No spreadsheet exploit was run. [analyticsExportUtils.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/src/features/analytics/utils/analyticsExportUtils.js:17>) |
| F34 | Medium; **Open** | Fresh dependency scans: The saved npm lockfile still reports 14 affected packages. A fresh query of 131 backend coordinates reports 8 matching packages and 22 unique advisory IDs. These are advisory matches, not 22 confirmed exploits. [pom.xml](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/pom.xml:8>) |
| F35 | Low; **Open** | Lint/CI review: Lint now reports 23 errors and 6 warnings. CI still builds without enforcing lint and uses a fixed backend startup sleep; existing passing tests miss the reproduced failures. [eslint.config.js](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/iCrowd_UI/eslint.config.js>) |
| F36 | Medium; **Open** | Configuration/vendor review: The example PostgreSQL URL still uses sslmode=require and channel_binding instead of the JDBC property channelBinding. Encryption alone does not authenticate the database server; live connection settings were not inspected. [.env.example](<D:/UOP/Academic/CS/CSC3213 - Project/CSC3213_20_Group_J/icrowd_api/.env.example:4>) |

The corrected empty-database behavior and qualifying-order filtering are real improvements. They do not close F10 completely because actual-mode profit charts still fabricate time-of-day allocations; nor do they prevent F41 from inserting demonstration sales into the same database used for actual reports. F19's resolved status is limited to the original status-filtering and discount-calculation defect.

## Most significant reproductions

| Scenario | Observed result |
|---|---|
| Known fallback signing key, no token-version claim | Admin users endpoint returned 200 |
| Different user IDs with case-variant emails | Order read and COD switch both returned 200 |
| Promotion limited to one use | Both pending orders confirmed successfully |
| Staff-created 150% discount | New order total was -19,050 |
| Signed success followed by signed chargeback | Stored payment stayed SUCCESS |
| Admin description edit racing a sale | Stock 41 → 40 → 41 |
| Legacy checkout without delivery fields | One order committed; response JSON invalid |
| Ten-product public list | 46 database statements |
| Two concurrent final-admin deactivations | Zero active administrators, no request errors |
| Public product detail | costPrice and effectiveCostPrice both exposed |
| Advertised bundle vs checkout | 170,016 advertised; 184,800 subtotal and zero discount |
| FAQ then product chat on cached entities | FAQ 200; later product requests 400 |
| New subscription without mailbox verification | Subscribed immediately |
| Only delivered purchase, then review | Review rejected with 403 |
| One sale at 10:00 | Overview one unit; sales chart zero units |
| One sale on October 31 | Monthly overview one unit; sales chart zero units |

## Dependency findings and applicability

The fresh npm audit still identifies these saved-lockfile packages: @babel/core, @humanfs/node, axios, brace-expansion, browserslist, follow-redirects, js-yaml, nanoid, postcss, react-router, react-router-dom, source-map-js, vite and zod. All fourteen audit entries report a fix available. A tool's severity is not proof that the affected execution path is reachable in this app: browser Axios, client-only routing, build tools and an exposed development server have different attack surfaces. Use the saved advisory details when planning compatible upgrades.

The backend remains on Spring Boot 4.1.0. The fresh OSV coordinate matches are:

| Package | Version | Advisory IDs for this coordinate |
|---|---|---:|
| org.apache.logging.log4j:log4j-api | 2.25.4 | 1 |
| tools.jackson.core:jackson-databind | 3.1.4 | 7 |
| tools.jackson.core:jackson-core | 3.1.4 | 2 |
| org.apache.tomcat.embed:tomcat-embed-core | 11.0.22 | 7 |
| org.springframework:spring-webmvc | 7.0.8 | 2 |
| org.postgresql:postgresql | 42.7.11 | 1 |
| com.fasterxml.jackson.core:jackson-databind | 2.21.4 | 9 |
| com.fasterxml.jackson.core:jackson-core | 2.21.4 | 2 |

The rows overlap: there are 22 unique advisory IDs. This scan does not establish application exploitability or claim the advisory database is exhaustive. Vendor checks confirm that Tomcat 11.0.22 is within affected ranges for later protocol fixes; actual exposure depends on enabled connectors/protocols and deployment behavior. [Apache Tomcat security notices](https://tomcat.apache.org/security-11.html).

Spring MVC 7.0.8 is within the XsltView advisory range, but no XsltView use was found here; it is a version match, not a demonstrated RCE path. [Spring advisory](https://spring.io/security/cve-2026-47884/). The installed PostgreSQL driver 42.7.11 is in the channel-binding downgrade range, and the maintainer identifies 42.7.12 as the patch for that specific issue. That advisory applies to channelBinding=require; the sample URL's separately misspelled setting remains F36. [pgJDBC advisory](https://github.com/pgjdbc/pgjdbc/security/advisories/GHSA-j92g-9f8w-j867).

For F36, pgJDBC documents that `sslmode=require` accepts all server certificates; `verify-full` adds certificate and hostname checks. Configure the appropriate trusted certificate material as well as the correct property names. [pgJDBC TLS documentation](https://jdbc.postgresql.org/documentation/ssl/).

Use a supported compatible Spring Boot dependency set, update the frontend lockfile consistently with the desired installed versions, and repeat clean-install functional tests plus advisory scans. Do not treat patching one listed advisory as proof that every dependency issue is closed.

## Suggested repair sequence

1. Close account/permission boundaries: F01–F03, F14–F18 and F37. If the fallback key/demo credentials were deployed, rotate them and invalidate affected sessions.
2. Protect orders and money: F04–F09, F12–F13, F18, F39 and F41. Add regressions for the reproduced concurrency and delayed-payment cases before deploying changes.
3. Repair shopper-visible regressions: F25–F29, F38, F43 and F46; complete analytics inputs and chart intervals for F10, F42 and F44.
4. Bound resource use: F20–F24, F31–F32, F40 and F45. Measure queries and loading with representative data after correction.
5. Align the dependency lockfile, fix lint, enforce the checks in CI, and validate schema creation/upgrades against isolated PostgreSQL before production use.

## Evidence and reproducibility

Raw evidence snapshots, lint/build/browser logs, and dependency advisory JSON are preserved locally under `docs/audit-2026-11-15/` and ignored by Git. The findings and validation summary above are the maintained record; use CI artifacts for new execution logs.

The three Java probes in [the probes directory](audit-2026-11-15/probes/) are diagnostic reproductions, not passing regression tests. Compile them against the current backend test classpath with Java 21; the two Spring probes explicitly start an isolated H2 database and use synthetic accounts/payment signatures. AnalyticsRecheckProbe uses mocked repositories and needs the Mockito Java agent in this environment. The saved browser configuration was run from iCrowd_UI against its local production build and the five named simulated-API suites.
