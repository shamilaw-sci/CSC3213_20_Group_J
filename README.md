# iCrowd E-commerce Platform

iCrowd is a university electronics-store project. Customers can browse products, create accounts, use the cart, place orders, track purchases, and receive recommendations. Administrators can manage products, stock, orders, promotions, and reports.

**The existing Neon database is provided for evaluation.** It already contains the required tables, dummy products, and test accounts. You do not need to download PostgreSQL or create a database.

## Choose how you want to check the project

| Option | What you can check | What you need |
| --- | --- | --- |
| [1. Run locally without email or PayHere](#option-1-run-locally-without-email-or-payhere) | Store, accounts, cart, cash-on-delivery orders, administration, and the built-in product assistant | Java, Node.js, project files, internet, and the group's private evaluation access details |
| [2. Run locally with email and PayHere](#option-2-run-locally-with-email-and-payhere) | Everything in Option 1, plus actual test emails and simulated card payments | Option 1, email credentials, PayHere sandbox credentials, and the additional tunnel download explained below |

Start with **Option 1** if you are running the project on your computer for the first time. Option 2 builds on it.

An **email address is still required for an account**. Option 1 means you do not need an email-sending service, access to an inbox, or a PayHere account. No Gemini/LLM key is required for the built-in product assistant.

## Option 1: Run locally without email or PayHere

### Step 1: Download and install two programs

| Download | What to choose | What it does |
| --- | --- | --- |
| [Java JDK 21](https://adoptium.net/temurin/releases/?version=21) | Version **21**, package **JDK**, and the installer for your operating system. On Windows, enable the installer's `JAVA_HOME` and PATH options. | Builds and runs the backend, which handles accounts, products, and orders. |
| [Node.js](https://nodejs.org/en/download) | Choose the latest **22.x** release, at least **22.12**. On Windows, use the `.msi` installer and keep npm selected. | Installs and runs the frontend, which is the website you see. |

A browser such as Chrome, Edge, or Firefox is also required. Maven and the project libraries download automatically in Step 5. You do not need a separate Maven installation, a code editor, Docker, or a local database.

Close and reopen your terminal after installing. The main instructions below use **Windows PowerShell**. macOS/Linux alternatives are included where the commands differ.

### Step 2: Download the project and open its folder

1. Open the [GitHub repository](https://github.com/shamilaw-sci/CSC3213_20_Group_J).
2. Select the **main** branch, which is the final evaluation branch.
3. Click **Code > Download ZIP**.
4. Extract the ZIP into a normal folder, for example `C:\Projects\iCrowd`. Do not run the project inside the ZIP.
5. Open the extracted folder containing `README.md`, `icrowd_api`, `iCrowd_UI`, and `scripts`. This is the **project root**.
6. On Windows, click File Explorer's address bar, type `powershell`, and press Enter. This opens PowerShell in that folder.

If you already have Git installed, you can download the same branch using:

```sh
git clone --branch main https://github.com/shamilaw-sci/CSC3213_20_Group_J.git
cd CSC3213_20_Group_J
```

You do not need Git when using Download ZIP. On macOS/Linux, open Terminal and use `cd` to enter the extracted project root.

Run these checks in PowerShell:

```powershell
java -version
node --version
npm.cmd --version
```

**Check:** Java should report version 21, Node should report version 22.12 or later, and npm should print a version number. On macOS/Linux, use `npm --version` instead of `npm.cmd --version`. If a command is not found, finish installing that program and reopen the terminal.

### Step 3: Get the evaluation access details

Obtain the following through the project's private evaluation handover:

- The **complete Neon JDBC connection URL**, database username, and database password.
- An **administrator login** and a **customer login** for the website.

Database access and website logins are different things. The database details go in a configuration file; the website logins are entered in the browser.

These details are required before continuing. They are intentionally not published in GitHub. The project group must provide working evaluation credentials to the evaluators. Email and PayHere credentials are unnecessary for Option 1.

### Step 4: Create the two configuration files

**What this does:** tells the backend which database to use and tells the website where to find the backend.

In PowerShell, from the project root:

```powershell
if (-not (Test-Path -LiteralPath icrowd_api/.env)) {
    Copy-Item -LiteralPath icrowd_api/.env.example -Destination icrowd_api/.env
}
notepad .\icrowd_api\.env
```

This copies the included [configuration example](icrowd_api/.env.example) only if your private file does not already exist, then opens it. For macOS/Linux, use `cp -n icrowd_api/.env.example icrowd_api/.env` and open the file in a text editor.

In `icrowd_api/.env`, replace the matching settings with the following. Add a setting if it is missing. Keep only one line for each setting:

```properties
DB_URL=PASTE_THE_COMPLETE_SUPPLIED_JDBC_URL_HERE
DB_USERNAME=PASTE_THE_DATABASE_USERNAME_HERE
DB_PASSWORD=PASTE_THE_DATABASE_PASSWORD_HERE
DB_DDL_AUTO=validate
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=PASTE_YOUR_GENERATED_SECRET_HERE

FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
PUBLIC_API_URL=http://localhost:8080
MARKETING_ENABLED=false

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=

PAYHERE_SANDBOX=true
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_NOTIFY_URL=
PAYHERE_APP_ID=
PAYHERE_APP_SECRET=
```

Replace each `PASTE_...` value with its actual value, without quotation marks. Leave the email and PayHere credentials empty for this option.

The database URL starts with `jdbc:postgresql://`. Copy the **whole supplied URL**, including its TLS settings and any `currentSchema` part. That selects the prepared evaluation data. Keep `DB_DDL_AUTO=validate`: it checks the existing tables without recreating them. The `prod` profile uses the persistent evaluation database; it does not mean real customer sales are being processed.

Generate your `JWT_SECRET` by running this in PowerShell:

```powershell
$signingBytes = New-Object byte[] 48
$signingGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$signingGenerator.GetBytes($signingBytes)
$signingGenerator.Dispose()
[Convert]::ToBase64String($signingBytes)
```

**What this does:** creates a random secret used to protect sign-in sessions. Copy the output after `JWT_SECRET=`, save the file, and keep that secret for later starts. On macOS/Linux, generate it with `openssl rand -base64 48`.

Next, open the frontend configuration:

```powershell
notepad .\iCrowd_UI\.env
```

If asked to create the file, choose Yes. Save these lines:

```properties
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GEMINI_API_KEY=
```

On macOS/Linux, create the same file in a text editor. Make sure both files are named exactly `.env`, not `.env.txt`. They belong in different folders. Keep these private files out of GitHub; the repository already ignores them.

A safe [frontend configuration example](iCrowd_UI/.env.example) is also included. The example files contain no working private credentials.

**Check:** the backend file contains the supplied database values and your generated secret. The frontend file contains the local API address. No `PASTE_...` values should remain.

### Step 5: Download the project libraries and build

Run one line at a time in PowerShell, starting at the project root:

```powershell
Set-Location icrowd_api
.\mvnw.cmd -B verify
Set-Location ../iCrowd_UI
npm.cmd ci
npm.cmd run build
Set-Location ..
```

| Command | What it does | What success looks like |
| --- | --- | --- |
| `.\mvnw.cmd -B verify` | Downloads Java libraries, runs backend tests using test configuration, and builds the backend. | `BUILD SUCCESS` and a file named `icrowd_api/target/icrowd-backend-0.0.1-SNAPSHOT.jar` |
| `npm.cmd ci` | Downloads the exact frontend libraries listed in the lockfile. | Finishes without an installation error |
| `npm.cmd run build` | Checks that the website can be built and creates its output files. | A successful Vite build and an `iCrowd_UI/dist` folder |

The first build needs internet and may take several minutes. Wait for each command to finish. **If a command fails, resolve that error before continuing.** The `Set-Location` commands only move between folders.

<details>
<summary>macOS / Linux build commands</summary>

From the project root:

```sh
cd icrowd_api
sh mvnw -B verify
cd ../iCrowd_UI
npm ci
npm run build
cd ..
```

</details>

### Step 6: Start the project

On Windows, run from the project root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

**What this does:** starts both parts of the application on your computer and keeps email campaigns disabled. The execution-policy option applies only to this PowerShell process, so a permanent policy change is unnecessary.

Open [the local website](http://localhost:5173) in your browser.

**Check:** the home page should show products and sample images. You can also open the [backend product check](http://localhost:8080/api/products?size=1); a page of structured product data is expected there.

<details>
<summary>macOS / Linux, or starting the two servers manually on Windows</summary>

Open two terminals. In the first, enter the project's `icrowd_api` folder and run:

```sh
java -jar target/icrowd-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --server.address=127.0.0.1 --server.port=8080 --spring.jpa.hibernate.ddl-auto=validate --app.marketing.enabled=false
```

In the second, enter `iCrowd_UI` and run:

```sh
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Use `npm.cmd` instead of `npm` in Windows PowerShell. Leave both terminals open while using the website. Press Ctrl+C in each to stop.

</details>

### Step 7: Try the main features

1. Browse products, search, and filter the catalog. **This checks product loading and the database connection.**
2. Sign in using the supplied customer account, or create an account. **This checks registration and login; no verification email is needed for normal sign-in.**
3. Add an available product to the cart, continue to checkout, and enter the required delivery details.
4. On the payment screen, select **Cash on delivery**. The screen initially selects card payment, so change it before placing the order. **This checks checkout without PayHere.**
5. Place the order and open your account's order history. **This checks that the order was saved.**
6. Open the product assistant and try a product question. Keep the optional Gemini mode off. **This checks the built-in assistant without an LLM key.**
7. Sign out, sign in as the supplied administrator, and open [the admin area](http://localhost:5173/admin). Check products, inventory, orders, and reports.

These actions update the shared evaluation database. Use dummy order details and products intended for testing. Email subscriptions and card payment are tested separately in Option 2.

### Step 8: Stop, and start again later

For servers started with the Windows helper, run this from the project root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1
```

For manually started servers, press Ctrl+C in both server terminals. Stopping the application does not delete the Neon data.

Next time, run Step 6 again. Repeat Step 5 after downloading changed source code; repeat `npm ci` when frontend dependencies change. Helper logs are in `icrowd_api/target/local-run/`.

## Option 2: Run locally with email and PayHere

**First complete Option 1 and confirm it works.** This option sends real test emails and uses PayHere's sandbox to simulate payments. No real payment is taken in the sandbox. [PayHere sandbox guide](https://support.payhere.lk/sandbox-and-testing)

Email links and payment notifications must be reachable from outside your computer. A **tunnel** provides a temporary public HTTPS address for a service running on your computer. Two tunnels are used here: one for the backend and one for the website.

### Step 1: Obtain the test service credentials

| Service | Details needed | Where they come from |
| --- | --- | --- |
| Email | Sending email address and SMTP app password | The group's test email account, or your own test sender |
| PayHere | Sandbox Merchant ID and Merchant Secret for the approved local checkout address `http://localhost:5173` | The group's evaluation integration, or your own approved PayHere sandbox integration |
| Website | A customer account using an inbox you can open, and the administrator login | Register the customer account in iCrowd; obtain the admin login from the group |

For a Gmail test sender:

1. Sign into that Google account and enable **2-Step Verification**.
2. Open Google's [App passwords instructions](https://support.google.com/accounts/answer/185833) and create an app password for iCrowd.
3. Use the generated app password as `SMTP_PASSWORD`, without spaces between its groups of characters. Do not use the account's normal password. If Google does not offer app passwords for that account, use the group's test sender or another SMTP provider supporting STARTTLS.

For your own PayHere integration, use the [sandbox portal](https://sandbox.payhere.lk/) and its **Integrations** page. Obtain the Merchant ID and the secret issued for the approved checkout address. A secret is specific to its registered domain/app; approval may be required before it works. Follow [PayHere's integration instructions](https://support.payhere.lk/api-%26-mobile-sdk/checkout-api). An arbitrary website address cannot be substituted for the approved one.

The steps below use the group's localhost integration for checkout. The public website tunnel is used for email links and images.

### Step 2: Download Cloudflare Tunnel

Download `cloudflared` from the [official Cloudflare download page](https://developers.cloudflare.com/tunnel/downloads/).

On a typical 64-bit Windows computer:

1. In the page's **Windows** section, download the **64-bit Executable**.
2. Rename the downloaded file to `cloudflared.exe`.
3. Keep it in your Windows **Downloads** folder. The commands below assume that location; change the path if you saved it elsewhere.

This executable runs directly; you do not need to install a Cloudflare desktop app. [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) do not require a Cloudflare account or your own domain.

On macOS/Linux, install the matching version using the same official page. Replace `& "$env:USERPROFILE\Downloads\cloudflared.exe"` in the commands below with `cloudflared`.

### Step 3: Start two temporary public links

Keep Option 1 running for this step. Open **two additional PowerShell windows**.

In the first new window, run:

```powershell
& "$env:USERPROFILE\Downloads\cloudflared.exe" tunnel --url http://127.0.0.1:8080
```

**What this does:** makes your backend reachable for PayHere notifications and email confirmation links. Copy the printed `https://...trycloudflare.com` address and label it **API URL**.

In the second new window, run:

```powershell
& "$env:USERPROFILE\Downloads\cloudflared.exe" tunnel --url http://127.0.0.1:5173
```

**What this does:** creates a public address for the website, product links, and sample images in emails. Copy this different address and label it **WEBSITE URL**.

Leave both tunnel windows open. These are temporary public links to your running application, available to anyone who has the links. Do not enable an email-login gate on the API tunnel because PayHere must be able to send notifications to it.

### Step 4: Update the private configuration

Stop the application using Option 1, Step 8, but **leave both tunnel windows running**.

Open `icrowd_api/.env`. Keep the database and JWT values from Option 1. Replace or add these settings, with only one entry for each name:

```properties
FRONTEND_URL=https://YOUR-WEBSITE-TUNNEL.trycloudflare.com
PUBLIC_API_URL=https://YOUR-API-TUNNEL.trycloudflare.com
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://YOUR-WEBSITE-TUNNEL.trycloudflare.com

app.frontend.url=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=YOUR_TEST_SENDER@gmail.com
SMTP_PASSWORD=YOUR_GMAIL_APP_PASSWORD
SMTP_FROM=YOUR_TEST_SENDER@gmail.com
MARKETING_ENABLED=true

PAYHERE_SANDBOX=true
PAYHERE_MERCHANT_ID=YOUR_SANDBOX_MERCHANT_ID
PAYHERE_MERCHANT_SECRET=YOUR_SANDBOX_MERCHANT_SECRET
PAYHERE_NOTIFY_URL=https://YOUR-API-TUNNEL.trycloudflare.com/api/payments/notify
```

Replace every `YOUR_...` / `YOUR-...` value. Use the **actual two addresses printed in Step 3**, without a trailing slash. The names in this example are not working links. Use your provider's host and port if using a sender other than Gmail.

| Setting | Why it is needed |
| --- | --- |
| `FRONTEND_URL` | Public website address used for product links and images in emails. |
| `PUBLIC_API_URL` | Public backend address used for subscription confirmation and unsubscribe links. |
| `CORS_ALLOWED_ORIGINS` | Allows both the local website and its public tunnel to contact the backend. |
| `app.frontend.url` | Keeps PayHere return pages on the approved local checkout address. It overrides the payment setting without changing the public email links. |
| `SMTP_*` | Lets the backend send email through the test sender. |
| `MARKETING_ENABLED=true` | Enables sending eligible product and promotion campaigns, including eligible queued campaigns in the evaluation database. |
| `PAYHERE_NOTIFY_URL` | Lets PayHere report the payment result directly to the backend. Keep the `/api/payments/notify` ending. |

In `iCrowd_UI/.env`, change the API address to:

```properties
VITE_API_BASE_URL=https://YOUR-API-TUNNEL.trycloudflare.com/api
VITE_GEMINI_API_KEY=
```

The `/api` ending is required here. This allows the public website to work from an email link on another device.

`PAYHERE_APP_ID` and `PAYHERE_APP_SECRET` can remain empty for a normal successful sandbox checkout. Automatic merchant verification/refunds require separate Merchant API credentials. An administrator's payment-review action records an outcome already verified with the merchant; it does not itself perform a refund.

### Step 5: Restart the application for integration testing

Use **two fresh application terminals** in addition to the two tunnel windows. This section uses manual startup so that the public API address is used.

Open the first application terminal at the project root, as explained in Option 1, Step 2. Run:

```sh
cd icrowd_api
java -jar target/icrowd-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --server.address=127.0.0.1 --server.port=8080 --spring.jpa.hibernate.ddl-auto=validate --server.forward-headers-strategy=framework --app.marketing.enabled=true
```

**What this does:** starts the backend with email campaigns enabled and allows it to understand the HTTPS address supplied by the tunnel.

Open the second application terminal at the project root. Replace the example hostname below with your **website tunnel hostname only**: no `https://` and no slash.

```powershell
Set-Location iCrowd_UI
$env:__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS = "YOUR-WEBSITE-TUNNEL.trycloudflare.com"
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

**What this does:** lets the frontend answer requests for your specific tunnel hostname. This is Vite's documented [additional allowed host setting](https://vite.dev/config/server-options#server-allowedhosts).

On macOS/Linux, use these commands from the project root in the second terminal:

```sh
cd iCrowd_UI
export __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="YOUR-WEBSITE-TUNNEL.trycloudflare.com"
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

**Check these before sending emails or paying:**

- Open your **API URL** followed by `/api/products?size=1`. It should show product data.
- Open your **WEBSITE URL**. It should show the working store and images.
- Open [the local website](http://localhost:5173). Use this address for the PayHere checkout below.

You now have four running terminals: backend, frontend, API tunnel, and website tunnel. Keep all four open throughout the tests.

### Step 6: Test email confirmation and a product email

1. On the website, register or sign in as a **customer whose email inbox you can open**. A fresh test customer makes it easier to avoid previous campaign limits.
2. Open **My Account > Product alerts and offers**.
3. Tick **Email me relevant products and promotions**, enter `office` under **Interests or main uses**, and click **Save email preferences**.
4. Open the customer's inbox, including the Spam folder. Open the confirmation link in the iCrowd email, then click the confirmation button on that page. **This confirms the customer wants to receive product emails.** Simply opening the link is not enough.
5. In another browser or private window, sign in as the administrator and open **Products > Add Product**.
6. Create a new test product: give it a name and price, select a category, set stock above zero, keep it active, and include `office` in **Tags**. You can use `/images/products/sku-001.png` in **Image URLs**. Save the product **after** confirming the subscription.
7. Wait a few minutes and check the customer's inbox. The worker checks the queue about once a minute; existing queued campaigns can add a delay. **A product email with the new product's link demonstrates campaign delivery.**
8. Open the email's product link and check that the product page and image load. Use the unsubscribe link and its confirmation button if you want to stop receiving campaigns.

Creating a new eligible product triggers a campaign. Editing an existing active product is not a reliable way to trigger a new campaign. By default, campaigns are limited to 100 sending attempts per rolling day and two per customer per rolling week; repeated testing may reach these limits.

Evaluators can use their own email address. Confirmation is required before campaign emails are sent. Other confirmed subscribers may also receive the campaign if they match the product or promotion and are within the sending limits. Each recipient receives an individual message; their address is not shared with other subscribers.

### Step 7: Test a PayHere sandbox payment

1. Open [http://localhost:5173](http://localhost:5173), sign in as a customer, and add an in-stock product to the cart.
2. Continue to checkout and fill in the required delivery and contact details.
3. Select **Credit or debit card** and continue. **This opens the PayHere sandbox checkout.**
4. Check that the payment page is on `sandbox.payhere.lk`. Use the official sandbox Visa number `4916217501611292`, a test cardholder name, a valid CVV such as `123`, and a future expiry date. Use test card details only. [Official test cards](https://support.payhere.lk/sandbox-and-testing)
5. Complete the test payment and return to iCrowd.
6. Wait for the order page to confirm the result, then check order history. **The order should be confirmed and its payment successful.** A return from PayHere alone does not prove success; the backend must receive the notification through the API tunnel.

If the payment remains pending, check the API tunnel, `PAYHERE_NOTIFY_URL`, and the matching sandbox credentials. Keep the original order reference when reporting a problem to the group.

### Step 8: Finish the test or return to Option 1

Press Ctrl+C in all four terminals to stop. Tunnel addresses stop working when their processes stop; new tunnels may produce different addresses. Repeat Steps 3-5 and update every affected URL before another test.

To return to basic local use:

1. Restore the local `FRONTEND_URL`, `PUBLIC_API_URL`, `CORS_ALLOWED_ORIGINS`, and `VITE_API_BASE_URL` values shown in Option 1.
2. Set `MARKETING_ENABLED=false` and empty `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, and all PayHere credential/notification values as shown there.
3. Remove the `app.frontend.url` override added for Option 2.
4. Open a fresh terminal and start using Option 1, Step 6.

Setting `MARKETING_ENABLED=false` pauses campaigns. Clearing the SMTP settings as well prevents a customer-requested subscription confirmation email from being sent.

## Dummy product images and real image URLs

The evaluation products use **33 sample image files included in [iCrowd_UI/public/images/products](iCrowd_UI/public/images/products)**. The database stores website paths such as `/images/products/sku-001.png`. Those paths refer to files served by the frontend, so they do not depend on the project group's computer.

Downloading this repository includes the sample images. Building the frontend copies them into `dist/images/products`. You can check a sample at [this local image address](http://localhost:5173/images/products/sku-001.png) after starting the project.

**Real image URLs can be used instead of these dummy images:**

1. Sign in as administrator and open **Products > Add Product**, or edit an existing product.
2. In **Image URLs**, enter one public HTTPS image URL per line.
3. Save the product and check that each image displays.

Use a URL that opens the image itself without requiring a login. A normal Google Drive sharing-page link is not necessarily a direct image URL. An unavailable or blocked URL may show a broken image or placeholder.

External image URLs are stored in Neon; the image files stay on their original website. Adding a product with such URLs does **not** require uploading those images to GitHub or creating a new code commit. You can also keep using the included sample paths.

## Optional Gemini / LLM testing

The built-in catalog assistant works without an external LLM key in both options.

The optional Gemini client now uses Google's current [Gemini 3.5 Flash-Lite model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). The model name can be changed using `VITE_GEMINI_MODEL` in `iCrowd_UI/.env`; restart the frontend after changing it.

To check Gemini:

1. Get an evaluation API key from [Google AI Studio](https://aistudio.google.com/apikey). The key must have access to the selected model and available quota. No extra software download is needed.
2. Open the website and click **Open AI Assistant**, then **AI Tool**.
3. Enter your evaluation key and click **Save**. The **Use Gemini for answers** checkbox enables this mode; untick it to return to the built-in assistant.
4. Ask a product question. A successful external response has a **Google Gemini AI** label beneath it. Current store results are supplied to the model to avoid relying on an old hardcoded product list.
5. If the provider rejects the key, is unavailable, or reaches a limit, the chat displays a reason and uses the built-in answer. This fallback is not proof of a successful Gemini test.
6. Remove the key using the **Remove Key** button when finished on a shared computer.

The selected mode is remembered after a reload. The browser stores the supplied key locally and sends chat text and relevant catalog context to Google when Gemini is enabled. Keep shared keys out of committed files and published frontend build settings; evaluators can enter their own key in the settings above. No live Gemini account/key is included in this repository.

## Common problems

| What you see | What to do |
| --- | --- |
| `java` or `node` is not recognized | Install the required program, then close and reopen PowerShell. |
| Maven reports the wrong Java version | Set `JAVA_HOME` to your JDK 21 installation and ensure its `bin` folder is on PATH. The JDK installer's environment options can do this. |
| `mvnw.cmd` cannot be found | Run it from `icrowd_api`, using `.\mvnw.cmd` on Windows. |
| Database connection error | Check internet access and the complete supplied database URL, username, and password. Run the backend from `icrowd_api` so it finds `.env`. |
| Database schema validation error | Ask the group to verify the supplied schema and final code version. Do not change `validate` to `create` or run setup scripts against the shared evaluation database. |
| Website loads but products do not | Check that the backend is running, `VITE_API_BASE_URL` ends in `/api`, and the frontend address appears in `CORS_ALLOWED_ORIGINS`. Restart after editing configuration. |
| Port 8080 or 5173 is already in use | Stop the previous copy you started. Use the helper's stop command for helper-started servers, or Ctrl+C for manual servers. |
| Tunnel website says the host is blocked | Set `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` to the current website tunnel hostname and restart the frontend. |
| Tunnel link shows a connection error | Check that the relevant local server and tunnel are both running and the copied address is current. |
| Email confirmation does not arrive | Check Spam, the sender/app password, and the public HTTPS API address. A pending confirmation link lasts 24 hours; repeated requests are limited. |
| Confirmation works but no product email arrives | Confirm the subscription before creating the new product; match its tag to the customer's interest; ensure stock and active status; check campaign limits and that marketing is enabled. |
| PayHere rejects checkout | Check sandbox credentials and that checkout uses the frontend address approved for that Merchant Secret. |
| Card payment stays pending | Verify the public notification URL and API tunnel. Returning to the website alone does not update payment status. |
| Changing `.env` has no effect | Restart the affected server. Variables already set in the terminal can override the file; use a fresh terminal. |

## Technical reference

The backend uses **Java 21 and Spring Boot 4.1.2**; see [pom.xml](icrowd_api/pom.xml). The frontend uses **React 19, Vite 8, and Tailwind CSS 4**; see [package.json](iCrowd_UI/package.json) and its [lockfile](iCrowd_UI/package-lock.json). Dependency installers use these files; individual library downloads are unnecessary.

<details>
<summary>Automated checks for developers</summary>

Backend, from `icrowd_api`:

```powershell
.\mvnw.cmd -B verify
```

Use `sh mvnw -B verify` on macOS/Linux. Tests use their own test configuration.

Frontend, from `iCrowd_UI`:

```sh
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
```

After building the backend, run this from the **project root**:

```sh
node scripts/check-evaluation.mjs
```

This checks registration, login, cart, cash-on-delivery, administrator order filtering, the built-in assistant, email confirmation, product emails, unsubscribe, and signed payment notifications through a running backend. It creates a temporary H2 database and a local SMTP inbox, and uses a simulated PayHere notification. It does not connect to Neon, send to real inboxes, or charge a card. Results are written under `icrowd_api/target/evaluation-check-*/`. Java 21 must be on PATH or selected through `JAVA_HOME`.

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`. For browser checks, start an isolated `local`-profile backend on port 8080 with a unique `JWT_SECRET`. Leave port 5173 available for the test preview server, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

The first command downloads the test browser. Browser tests are developer checks, not required for an evaluator to use the website.

</details>

<details>
<summary>Creating a different database or a disposable development environment</summary>

These instructions are **not needed for the supplied Neon evaluation database**. Do not run setup or sample-data initialization against that shared database.

- For a new empty PostgreSQL database, apply [database_setup.sql](database_setup.sql) using PostgreSQL's `ON_ERROR_STOP=1`, set its connection details, and keep `DB_DDL_AUTO=validate`. This creates tables without the prepared evaluation accounts or orders.
- For an older installation, stop application instances, take a verified backup, and apply [20261115_security_performance.sql](database_migrations/20261115_security_performance.sql) using `ON_ERROR_STOP=1`. Resolve reported data conflicts. The older `20261030_checkout_final_allocation.sql` migration is retired and intentionally refuses to run.
- To create the first administrator in a new database, set `BOOTSTRAP_ADMIN_EMAIL` and a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 12 characters. Start once with `--spring.profiles.active=prod,bootstrap-admin`, stop the backend, remove those two provisioning values, then restart with `prod` only.
- The `local` profile uses bundled H2 and creates disposable sample catalog data. Adding `demo` creates demo accounts/orders and requires `DEFAULT_ADMIN_PASSWORD` and `DEFAULT_CUSTOMER_PASSWORD` of at least 12 characters. Set a unique `JWT_SECRET`. Data disappears after shutdown. Do not combine `local` or `demo` with `prod`.

</details>

This is the single maintained README. Git contains application files, sample product images, configuration examples, dependency files, database scripts, startup helpers, tests, and workflows. Private credentials, generated files, logs, reports, presentations, and extra notes remain outside the committed project.

The final evaluation uses **main**. Prepare and review changes on a working branch or **developer**, then merge the approved final version into main before submission.
