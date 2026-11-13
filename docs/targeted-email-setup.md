# Targeted email setup

1. Choose a dedicated Gmail sender. Enable 2-Step Verification and create an App Password: https://support.google.com/accounts/answer/185833 . Some managed accounts do not support App Passwords.
2. Add SMTP settings from icrowd_api/.env.example to your existing private .env or deployment secrets. Preserve database/payment settings. SMTP_USERNAME and SMTP_FROM are your Gmail address; SMTP_PASSWORD is the App Password without display spaces. Never commit or share credentials in chat.
3. Use smtp.gmail.com on port 587 with STARTTLS. Allow outbound server connections on port 587.
4. Use a persistent database: the in-memory default loses consent, queues and counters on restart. DB_DDL_AUTO=update creates the new email tables; managed migration deployments need equivalent tables.
5. Set FRONTEND_URL and PUBLIC_API_URL to real public HTTPS base URLs without /api. Localhost links cannot work for customers. Add the deployed frontend origin to existing backend CORS settings.
6. Keep MARKETING_ENABLED=false while checking Admin > Promo Codes > Targeted email campaigns. Customers subscribe under My Account > Product alerts and offers.
7. Test with your own customer: subscribe with interest office, then publish a new in-stock product tagged office. Preview its audience. Set MARKETING_ENABLED=true and restart. Verify the email, product button and unsubscribe confirmation.
8. Default caps: 100 attempts per rolling 24 hours and two per customer per rolling seven days. Other emails from the Gmail account also consume Google's quota. Set MARKETING_ENABLED=false and restart to pause.

SMTP reference: https://developers.google.com/workspace/gmail/imap/imap-smtp

## Behavior and limitations

New active products and draft activation create one campaign per product; ordinary edits do not resend. New promotions wait for their start dates. Only customers subscribed before campaign creation qualify. Queue preparation runs each minute, including while delivery is disabled.

Targeting uses successful purchase categories (more weight within 180 days), selected interests matching exact case-insensitive category names or tags, and brand boosts. Brand alone never qualifies. Add office, gaming, studying or travel tags where relevant. Previously purchased, unavailable and inactive products are excluded. Work environment is voluntarily selected.

Promotions are cart-wide coupons; emails feature the highest-matching product and coupon conditions. Before delivery the worker rechecks consent, account status, relevance, stock and promotion eligibility. Checkout confirms final discount eligibility. Product links show the code without automatic login or redemption.

Database locking coordinates queue claims. Unsubscribe GET shows confirmation; POST changes consent and supports one-click requests. Connection failures retry up to three times with backoff and normal caps. Ambiguous delivery failures are not automatically retried; SENDING after a crash requires inspection before manual recovery. SENT means SMTP accepted the message, not guaranteed inbox delivery.

Campaigns expire after 14 days, measured from promotion start when supplied, or earlier at promotion expiry. Large catalogs should batch audience scans. Exact compatibility, digest emails, click analytics and automatic asynchronous bounce processing are not included; monitor sender inbox bounces.

For a future upgrade change SMTP settings and limits to a paid Workspace account or another STARTTLS provider. OAuth-only or implicit-TLS providers require extra transport configuration. Real Gmail delivery requires the owner's credentials and final verification; automated tests use a simulated sender.
