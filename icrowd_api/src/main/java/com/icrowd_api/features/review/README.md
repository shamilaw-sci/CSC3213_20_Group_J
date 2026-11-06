# Product feedback

Reviews and Q&A are scoped by product ID. Public visitors can read both. Writes require authentication.

- A review requires an order with status CONFIRMED, PROCESSING or COMPLETED containing the product.
- One review per customer per product. The product row is locked before checking duplicates and changing ratings, preventing simultaneous writes from losing totals.
- Owners may edit/delete reviews. Admins may delete reviews, but cannot rewrite customer reviews.
- Ratings must be 1–5; trimmed review text must be 5–1000 characters.
- Average rating is calculated from saved ratings without intermediate rounding. The UI displays one decimal place.
- Any signed-in user may ask a question (5–1000 characters). Only admins may answer or update an answer (5–2000 characters). Answers are marked Store staff.
- Question owners and admins may delete a question and its answer.
- Lists use newest-first pagination, with a maximum page size of 50.
- My Reviews uses the current account's real review history and unreviewed products from confirmed purchases.

Pending-payment, failed, cancelled and stock-unavailable orders do not qualify. This matches the existing checkout flow; it currently has no delivery-completion endpoint.

## Storage

The existing Hibernate update configuration creates the product_question table when the backend restarts. Environments using explicit schema migrations must create the table before enabling Q&A. The default in-memory H2 database resets on backend restart; configure the existing DB_URL, DB_USERNAME and DB_PASSWORD settings for persistent PostgreSQL storage.

Existing stored rating totals are recalculated on the next review mutation. To correct all legacy totals immediately, run this SQL against the intended database after taking the normal backup:

```sql
UPDATE products p
SET review_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id),
    average_rating = COALESCE((SELECT AVG(CAST(r.rating AS DOUBLE PRECISION)) FROM reviews r WHERE r.product_id = p.id), 0);
```

Existing duplicate reviews are preserved; resolve them through moderation if needed.

## Verification

Run the backend Maven tests, including ProductFeedbackIntegrationTest. These use an isolated H2 database and real HTTP requests to verify permissions, product isolation, validation, purchases, duplicate prevention, review changes, rating totals, Q&A and concurrent submissions.

From iCrowd_UI run:

```text
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test --config playwright.feedback.config.js
```

The feedback browser suite uses Microsoft Edge and mocked API responses to test UI behavior separately from the backend HTTP tests.
