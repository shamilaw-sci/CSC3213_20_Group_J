// Runs a disposable copy of the API. No Neon data, real inbox, or PayHere service is used.
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createWriteStream } from 'node:fs';
import { access, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'icrowd_api', 'target');
const jar = join(target, 'icrowd-backend-0.0.1-SNAPSHOT.jar');
await access(jar).catch(() => { throw new Error('Build the backend first: run the Maven verify command in README Step 5.'); });
await mkdir(target, { recursive: true });
const work = await mkdtemp(join(target, 'evaluation-check-'));
const inbox = [];
const sockets = new Set();
const smtp = createServer(socket => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  socket.on('error', () => {});
  socket.setTimeout(30_000, () => socket.destroy());
  socket.write('220 local evaluation inbox\r\n');
  let buffer = '', data = null, recipients = [];
  socket.on('data', chunk => {
    buffer += chunk.toString('utf8');
    let end;
    while ((end = buffer.indexOf('\r\n')) !== -1) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (data !== null) {
        if (line === '.') {
          inbox.push({ recipients: [...recipients], raw: data.join('\r\n') });
          data = null;
          recipients = [];
          socket.write('250 accepted by local inbox\r\n');
        } else data.push(line.replace(/^\.\./, '.'));
      } else if (/^(EHLO|HELO)/i.test(line)) socket.write('250-localhost\r\n250 8BITMIME\r\n');
      else if (/^RCPT TO:/i.test(line)) {
        recipients.push(line.match(/<([^>]+)>/)?.[1]);
        socket.write('250 recipient accepted\r\n');
      } else if (/^DATA$/i.test(line)) { data = []; socket.write('354 send message\r\n'); }
      else if (/^QUIT$/i.test(line)) socket.end('221 goodbye\r\n');
      else socket.write('250 OK\r\n');
    }
  });
});
await new Promise((done, reject) => { smtp.once('error', reject); smtp.listen(0, '127.0.0.1', done); });
const portReservation = createServer();
await new Promise(done => portReservation.listen(0, '127.0.0.1', done));
const port = portReservation.address().port;
await new Promise(done => portReservation.close(done));
const base = 'http://127.0.0.1:' + port;
const password = randomBytes(24).toString('base64url');
const java = process.env.JAVA_HOME
  ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  : 'java';
const log = createWriteStream(join(work, 'backend.log'));
const backend = spawn(java, [
  '-jar', jar, '--spring.profiles.active=local,demo',
  '--spring.config.import=', '--server.address=127.0.0.1', '--server.port=' + port,
  '--spring.datasource.url=jdbc:h2:mem:evaluation-check;DB_CLOSE_DELAY=-1;MODE=PostgreSQL',
  '--spring.datasource.username=sa', '--spring.datasource.password=', '--spring.jpa.hibernate.ddl-auto=create-drop',
  '--app.default-admin.email=admin@example.test', '--app.default-customer.email=customer@example.test',
  '--app.frontend.url=' + base,
  '--app.marketing.enabled=true', '--app.marketing.interval-ms=1000',
  '--app.marketing.from=sender@example.test', '--app.marketing.frontend-url=https://store.example.test',
  '--app.marketing.public-api-url=https://api.example.test',
  '--spring.mail.host=127.0.0.1', '--spring.mail.port=' + smtp.address().port,
  '--spring.mail.username=', '--spring.mail.password=', '--spring.mail.properties.mail.smtp.auth=false',
  '--spring.mail.properties.mail.smtp.starttls.enable=false', '--spring.mail.properties.mail.smtp.starttls.required=false',
  '--payhere.sandbox=true', '--payhere.merchant-id=evaluation-merchant',
  '--payhere.merchant-secret=evaluation-secret', '--payhere.notify-url=https://api.example.test/api/payments/notify',
  '--payhere.app-id=', '--payhere.app-secret=',
], {
  cwd: work, windowsHide: true,
  env: { ...process.env, JWT_SECRET: randomBytes(48).toString('base64'),
    DEFAULT_ADMIN_PASSWORD: password, DEFAULT_CUSTOMER_PASSWORD: password },
  stdio: ['ignore', 'pipe', 'pipe'],
});
backend.stdout.pipe(log, { end: false });
backend.stderr.pipe(log, { end: false });
let launchError;
backend.on('error', error => { launchError = error; });
const checks = [];
const passed = name => { checks.push(name); console.log('PASS ' + name); };
async function request(path, { method = 'GET', body, token, form = false } = {}) {
  const response = await fetch(base + path, {
    method, signal: AbortSignal.timeout(15_000),
    headers: { ...(body ? { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? (form ? new URLSearchParams(body) : JSON.stringify(body)) : undefined,
  });
  const text = await response.text();
  assert.ok(response.ok, method + ' ' + path + ' returned ' + response.status + ': ' + text.slice(0, 250));
  return response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text;
}
async function waitFor(check, description, seconds = 30) {
  const expires = Date.now() + seconds * 1000;
  while (Date.now() < expires) {
    if (launchError) throw launchError;
    if (backend.exitCode !== null) throw new Error('API stopped. See ' + join(work, 'backend.log'));
    const result = await check();
    if (result) return result;
    await delay(250);
  }
  throw new Error('Timed out: ' + description);
}
function decodeEmail(message) {
  return message.raw.split(/^--[^\r\n]+\r?\n/gm).map(part => {
    const split = part.indexOf('\r\n\r\n');
    if (split < 0) return part;
    const headers = part.slice(0, split).replace(/\r\n[ \t]+/g, '');
    let body = part.slice(split + 4);
    if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(headers)) {
      body = body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
    } else if (/Content-Transfer-Encoding:\s*base64/i.test(headers)) {
      body = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf8');
    }
    return headers + '\n' + body;
  }).join('\n');
}
try {
  await waitFor(async () => {
    try {
      const response = await fetch(base + '/api/products?size=1', { signal: AbortSignal.timeout(1000) });
      return response.ok && (await response.json()).content?.length > 0;
    }
    catch { return false; }
  }, 'API startup and sample catalog initialization', 120);
  const catalog = await request('/api/products?size=20');
  assert.ok(catalog.content.length);
  passed('Catalog starts with a disposable database');
  const admin = (await request('/api/auth/login', { method: 'POST', body: { email: 'admin@example.test', password } })).token;
  const email = 'evaluator@example.test';
  await request('/api/auth/register', { method: 'POST', body: {
    email, password, firstName: 'Evaluation', lastName: 'Customer', phone: '0712345678',
  } });
  const customer = (await request('/api/auth/login', { method: 'POST', body: { email, password } })).token;
  assert.equal((await request('/api/auth/me', { token: customer })).email, email);
  passed('Customer registration, customer login, and administrator login');
  const product = catalog.content.find(item => item.availableStock > 3);
  assert.ok(product, 'An in-stock demo product is required');
  await request('/api/cart/sync', { method: 'POST', token: customer, body: { items: [{ productId: product.id, quantity: 1 }] } });
  assert.equal((await request('/api/cart', { token: customer })).items.length, 1);
  const orderBody = { shippingFullName: 'Evaluation Customer', shippingPhone: '0712345678', shippingEmail: email,
    shippingAddress: 'Evaluation address', shippingDistrict: 'Colombo', deliveryType: 'STANDARD',
    items: [{ productId: product.id, quantity: 1 }] };
  const cod = await request('/api/orders', { method: 'POST', token: customer,
    body: { ...orderBody, paymentMethod: 'COD', checkoutKey: randomUUID() } });
  assert.equal(cod.orderStatus, 'CONFIRMED');
  assert.equal((await request('/api/orders/' + cod.orderId + '/payment-status', { token: customer })).paymentStatus, 'DUE_ON_DELIVERY');
  const orders = await request('/api/admin/orders?size=100', { token: admin });
  assert.ok(orders.content.some(row => (row.id ?? row.orderId) === cod.orderId), 'Unfiltered admin list must include confirmed orders');
  passed('Cart, cash-on-delivery checkout, saved payment status, and unfiltered admin orders');
  const card = await request('/api/orders', { method: 'POST', token: customer,
    body: { ...orderBody, paymentMethod: 'CARD', checkoutKey: randomUUID() } });
  const payment = await request('/api/payments/initiate', { method: 'POST', token: customer,
    body: { orderId: card.orderId, paymentMethod: 'CARD' } });
  assert.equal(new URL(payment.checkoutUrl).hostname, 'sandbox.payhere.lk');
  const notice = { merchant_id: 'evaluation-merchant', order_id: payment.internalPaymentId, payment_id: 'evaluation-transaction',
    payhere_amount: Number(payment.amount).toFixed(2), payhere_currency: 'LKR', status_code: '2' };
  const md5 = value => createHash('md5').update(value).digest('hex').toUpperCase();
  notice.md5sig = md5(notice.merchant_id + notice.order_id + notice.payhere_amount + notice.payhere_currency + notice.status_code + md5('evaluation-secret'));
  await request('/api/payments/notify', { method: 'POST', body: notice, form: true });
  await request('/api/payments/notify', { method: 'POST', body: notice, form: true });
  assert.equal((await request('/api/orders/' + card.orderId + '/payment-status', { token: customer })).paymentStatus, 'SUCCESS');
  passed('Sandbox checkout fields and a simulated signed payment callback, including repeat delivery');
  const assistant = await request('/api/ai/chat', { method: 'POST', body: { sessionId: randomUUID(), message: 'headphones' } });
  assert.ok(assistant.reply);
  passed('Built-in assistant without a Gemini key');
  await request('/api/marketing/preferences', { method: 'PUT', token: customer, body: { subscribed: true, interests: 'office', brands: '' } });
  const confirmation = await waitFor(() => inbox.find(mail => mail.recipients.includes(email) && mail.raw.includes('Confirm your iCrowd')), 'confirmation email');
  const confirmationToken = decodeEmail(confirmation).match(/confirm\?token=([a-f0-9]{64})/)?.[1];
  assert.ok(confirmationToken, 'The confirmation email must contain a usable link');
  const form = await request('/api/marketing/confirm?token=' + confirmationToken);
  assert.match(form, /action='\/api\/marketing\/confirm'/);
  assert.match(await request('/api/marketing/confirm', { method: 'POST', form: true, body: { token: confirmationToken } }), /subscription is confirmed/);
  passed('Confirmation email reaches the local inbox and its form confirms the subscription');
  const newProduct = await request('/api/products', { method: 'POST', token: admin, body: {
    sku: randomUUID(), name: 'Evaluation office headphones', description: 'Temporary automated test product',
    price: 5000, availableStock: 10, categoryId: product.category.id, tags: ['office'], isActive: true,
    imageUrls: ['/images/products/sku-001.png'], leadTimeDays: 7,
  } });
  const campaign = await waitFor(() => inbox.find(mail => mail.recipients.includes(email) && decodeEmail(mail).includes('/product/' + newProduct.id)), 'product campaign email', 45);
  assert.deepEqual(campaign.recipients, [email]);
  const campaignText = decodeEmail(campaign);
  assert.ok(campaignText.includes('https://store.example.test/images/products/sku-001.png'));
  const unsubscribe = campaignText.match(/unsubscribe\?token=([a-fA-F0-9-]{72})/)?.[1];
  assert.ok(unsubscribe);
  const unsubscribeForm = await request('/api/marketing/unsubscribe?token=' + unsubscribe);
  assert.match(unsubscribeForm, /action='\/api\/marketing\/unsubscribe'/);
  await request('/api/marketing/unsubscribe', { method: 'POST', form: true, body: { token: unsubscribe } });
  assert.equal((await request('/api/marketing/preferences', { token: customer })).subscribed, false);
  passed('Targeted product email, public sample-image URL, and unsubscribe');
  const result = { result: 'passed', checks, database: 'temporary H2', email: 'local SMTP capture only', payment: 'simulated callback only' };
  await writeFile(join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log('All evaluation checks passed. Results: ' + join(work, 'result.json'));
} finally {
  await writeFile(join(work, 'captured-mail.json'), JSON.stringify(inbox, null, 2) + '\n');
  backend.kill();
  for (const socket of sockets) socket.destroy();
  await new Promise(done => smtp.close(done));
  log.end();
}
