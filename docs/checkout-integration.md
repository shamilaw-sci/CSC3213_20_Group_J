# PayHere checkout

The shop supports PayHere hosted checkout and cash on delivery. Online bank transfer is disabled in both the UI and order API. The legacy enum remains so historical orders can still be read.

## Setup

For local configuration, edit the ignored `icrowd_api/.env` file. Spring Boot imports it when started from `icrowd_api`. Use unquoted `KEY=value` lines, not PowerShell syntax. The tracked `.env.example` lists the available settings without real credentials. Existing PowerShell environment variables override values in this file; use a fresh terminal if old settings are still present. Database and PayHere secrets belong only in this backend file, never in frontend `VITE_` variables.

Create a PayHere Sandbox account and register your frontend domain in Integrations. Obtain the Merchant ID and the Merchant Secret for that domain. Keep the secret on the backend. PayHere requires a publicly reachable notification endpoint; localhost cannot receive its callbacks. Use a deployed test backend or a deliberately configured HTTPS tunnel. The frontend domain must match the domain registered with PayHere.

Set the existing DB_URL, DB_USERNAME and DB_PASSWORD, plus:

```powershell
$env:PAYHERE_SANDBOX="true"
$env:PAYHERE_MERCHANT_ID="your-sandbox-merchant-id"
$env:PAYHERE_MERCHANT_SECRET="your-domain-merchant-secret"
$env:PAYHERE_NOTIFY_URL="https://your-public-backend/api/payments/notify"
$env:FRONTEND_URL="https://your-registered-frontend"
cd icrowd_api
.\mvnw.cmd spring-boot:run
```

Start the shop frontend in another terminal from `iCrowd_UI` with `npm.cmd run dev`. Configure its existing API base URL to reach your backend. No separate gateway process or database is required.

PayHere Merchant API credentials are separate from the checkout secret. To enable automatic full refunds, set PAYHERE_APP_ID and PAYHERE_APP_SECRET using sandbox API credentials with the required provider permissions. Without these, paid orders that lose stock remain REFUND_PENDING for merchant handling.

## Behavior and recovery

Carts do not reserve stock. COD allocates during order creation. Online checkout allocates only after a verified successful notification. Product locks serialize competing allocations. The browser return URL never proves payment success; it polls the saved order state.

After a verified card decline or cancellation, customers can switch the same order to COD using the failed-payment screen. The server locks the order, verifies ownership and that every card attempt has failed, then allocates current stock and confirms COD. Pending or unknown outcomes block the switch. Repeated successful switches return the existing COD order. A late successful card notification is refunded while the order remains COD, without deducting inventory again. Reusing the original checkout key with COD also follows these rules.

Checkout initiation reuses an initiated payment. Failed attempts may be retried. A late success from another attempt is refunded if the order already has its stock, without changing the winning order's status. Duplicate callbacks do not deduct stock twice.

Refund requests are claimed durably before sending. An explicit successful refund response marks REFUNDED. A timeout, rejected response, or crash after claiming leaves REFUND_PENDING and REFUND_SUBMITTED_REQUIRES_VERIFICATION in the payment record. The system does not blindly resubmit an ambiguous refund. Check the PayHere merchant portal and reconcile the record operationally; there is no admin reconciliation screen yet. A second provider transaction ID for the same checkout attempt also requires merchant review.

Pending payments with missing callbacks remain pending. Check PayHere and arrange notification replay/reconciliation; do not mark an order paid based on a browser redirect. Chargebacks require merchant review; automated chargeback inventory handling is outside this checkout scope.

## Testing

Use PayHere's documented sandbox cards: Visa 4916217501611292 or Mastercard 5307732125531191 with valid-format name, expiry and CVV. Test declines using the current official testing guide.

Verify success, decline, duplicate notification, invalid signature, amount mismatch, COD versus card competition for one item, and refund pending recovery. Use two customer accounts in separate browser sessions for the last-item scenario.

The checkout database migration already applied to neondb remains necessary. This provider switch introduces no new entity columns and does not require rerunning that migration.

## Live deployment

Live mode requires merchant approval, live credentials, registered frontend domain, public notification URL and applicable Merchant API IP allowlisting. Set PAYHERE_SANDBOX=false only when ready for real payments.

References:
- https://support.payhere.lk/api-&-mobile-sdk/checkout-api
- https://support.payhere.lk/api-&-mobile-sdk/refund-api
- https://support.payhere.lk/sandbox-and-testing
