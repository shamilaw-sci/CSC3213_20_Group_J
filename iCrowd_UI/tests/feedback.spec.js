import { test, expect } from '@playwright/test';

async function setup(page, role = 'CUSTOMER') {
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  await page.route(/^https:\/\//, route => route.abort());
  const reviews = { 1: [], 2: [] };
  const questions = { 1: [], 2: [] };
  if (role) await page.addInitScript(() => localStorage.setItem('token', 'test-token'));
  await page.route('**/api/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname; const method = req.method();
    let data = [];
    if (path === '/api/auth/me') data = { id: 1, firstName: 'Buyer', role };
    const match = path.match(/^\/api\/products\/(\d+)(?:\/(reviews|questions)(?:\/(\d+))?(?:\/(answer))?)?$/);
    if (match) {
      const [, id, section, itemId, answer] = match;
      const items = section === 'reviews' ? reviews[id] : questions[id];
      if (!section) data = { id: Number(id), name: 'Product ' + id, description: 'Test product', price: 100, availableStock: 10, category: {name: 'Accessories'}, imageUrls: [], specifications: {}, reviewCount: reviews[id].length, averageRating: reviews[id].length ? reviews[id].reduce((sum,r) => sum+r.rating,0)/reviews[id].length : 0 };
      else if (method === 'GET') data = { content: items, last: true };
      else if (method === 'POST') {
        const body = req.postDataJSON();
        data = { id: Date.now(), userId: 1, authorName: 'Buyer', createdAt: '2026-11-04T12:00:00', ...(section === 'reviews' ? body : {question: body.text}) }; items.unshift(data);
      } else if (method === 'PUT') {
        data = items.find(i => String(i.id) === itemId); Object.assign(data, answer ? {answer: req.postDataJSON().text, answeredBy: 'Store staff'} : req.postDataJSON());
      } else if (method === 'DELETE') { items.splice(items.findIndex(i => String(i.id) === itemId),1); return route.fulfill({ status: 204 }); }
    }
    await route.fulfill({ json: data });
  });
}

test('customer can create, edit and delete reviews; ratings refresh and products remain separate', async ({page}) => {
  await setup(page);
  await page.goto('/product/1', {waitUntil:'domcontentloaded'});
  await expect(page.getByText('Not rated', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Write a Review',exact:true}).click();
  await page.getByLabel('Rating', {exact:true}).selectOption('4');
  await page.getByLabel('Your review', {exact:true}).fill('Reliable and useful product');
  await page.getByRole('button',{name:'Save review',exact:true}).click();
  await expect(page.getByText('(1 reviews)',{exact:true})).toBeVisible();
  await expect(page.getByText('4.0',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Edit review',exact:true}).click();
  await page.getByLabel('Rating',{exact:true}).selectOption('2');
  await page.getByRole('button',{name:'Save review',exact:true}).click();
  await expect(page.getByText('2.0',{exact:true})).toBeVisible();
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(page.getByText('Reliable and useful product',{exact:true})).toBeVisible();
  await page.goto('/product/2', {waitUntil:'domcontentloaded'});
  await expect(page.getByText('Not rated',{exact:true})).toBeVisible();
  await expect(page.getByText('Reliable and useful product',{exact:true})).toHaveCount(0);
  await page.goto('/product/1', {waitUntil:'domcontentloaded'});
  page.on('dialog',dialog => dialog.accept());
  await page.getByRole('button',{name:'Delete review',exact:true}).click();
  await expect(page.getByText('Not rated',{exact:true})).toBeVisible();
});

test('questions persist across reloads and staff can answer', async ({page}) => {
  await setup(page,'ADMIN');
  await page.goto('/product/1', {waitUntil:'domcontentloaded'});
  await page.getByLabel('Your question',{exact:true}).fill('Does it include a cable?');
  await page.getByRole('button',{name:'Ask question',exact:true}).click();
  await expect(page.getByText('Does it include a cable?',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Answer question',exact:true}).click();
  await page.getByLabel('Staff answer',{exact:true}).fill('Yes, a cable is included.');
  await page.getByRole('button',{name:'Save answer',exact:true}).click();
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(page.getByText('Yes, a cable is included.',{exact:true})).toBeVisible();
  await page.goto('/product/2', {waitUntil:'domcontentloaded'});
  await expect(page.getByText('Does it include a cable?',{exact:true})).toHaveCount(0);
});

test('guests can read feedback and are invited to sign in',async ({page}) => {
  await setup(page,null);await page.goto('/product/1', {waitUntil:'domcontentloaded'});
  await expect(page.getByRole('heading',{name:'Customer Reviews',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Sign in to write a review',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Sign in to ask a question',exact:true})).toBeVisible();
});

test('load-more prevents duplicate requests and recovers from a failed page', async ({page}) => {
  await setup(page,null);
  let requests = 0;
  const review = id => ({id, userId:2, authorName:'Other buyer', rating:3, comment:'Review number ' + id, createdAt:'2026-11-04T12:00:00'});
  await page.route('**/api/products/1/reviews?*', async route => {
    const current = Number(new URL(route.request().url()).searchParams.get('page'));
    if (current === 0) return route.fulfill({json:{content:Array.from({length:10},(_,i) => review(i+1)),last:false}});
    requests++;
    await new Promise(resolve => setTimeout(resolve,200));
    if(requests === 1) return route.fulfill({status:500,json:{message:'Temporary failure'}});
    return route.fulfill({json:{content:[review(11)],last:true}});
  });
  await page.goto('/product/1', {waitUntil:'domcontentloaded'});
  const more = page.getByRole('button',{name:'Load More Reviews',exact:true});
  await more.click();
  await expect(more).toBeDisabled();
  await expect(page.getByText('Temporary failure')).toBeVisible();
  await expect(page.getByText('Review number 1',{exact:true})).toBeVisible();
  await more.click();
  await expect(page.getByText('Review number 11',{exact:true})).toBeVisible();
  expect(requests).toBe(2);
  await expect(more).toHaveCount(0);
});
