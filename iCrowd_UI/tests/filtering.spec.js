import { test, expect } from '@playwright/test';
test('filters combine, reset pagination, survive navigation and clear', async ({ page }) => {
 const requests=[];
 // Match backend requests without intercepting Vite's /src/**/api/ modules.
 await page.route(url => url.pathname.startsWith('/api/'), async route => {
  const url=new URL(route.request().url());
  if(url.pathname==='/api/categories') return route.fulfill({json:[{id:9,name:'Chargers'}]});
  if(url.pathname==='/api/products') { requests.push(url.searchParams); return route.fulfill({json:{content:[],totalElements:0,totalPages:0,number:0,size:8}}); }
  return route.fulfill({json:{terms:[],categories:[],products:[]}});
 });
 await page.goto('/search?page=3');
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('Chargers');
 await expect(page).not.toHaveURL(/page=3/);
 await page.getByLabel('Minimum price',{exact:true}).fill('10');
 await page.getByLabel('Maximum price',{exact:true}).fill('100');
 await page.getByLabel('Brand',{exact:true}).fill('Anker');
 await page.getByLabel('In stock only').check();
 await page.getByRole('combobox',{name:'Minimum rating',exact:true}).selectOption('4');
 await page.getByRole('button',{name:'Apply filters'}).click();
 await page.getByRole('combobox',{name:'Sort by',exact:true}).selectOption('rating');
 await expect.poll(()=>requests.at(-1)?.get('sort')).toBe('rating');
 const last=requests.at(-1);
 for(const [key,value] of Object.entries({category:'Chargers',minPrice:'10',maxPrice:'100',brand:'Anker',inStock:'true',minRating:'4'})) expect(last.get(key)).toBe(value);
 await page.reload();
 await expect(page.getByLabel('Minimum price',{exact:true})).toHaveValue('10');
 await page.getByRole('button',{name:'Remove brand filter',exact:true}).click();
 await expect(page.getByLabel('Brand',{exact:true})).toHaveValue('');
 await page.goBack();
 await expect(page.getByLabel('Brand',{exact:true})).toHaveValue('Anker');
 await page.getByRole('button',{name:'Clear all',exact:true}).click();
 await expect(page).toHaveURL(/\/search$/);
});
