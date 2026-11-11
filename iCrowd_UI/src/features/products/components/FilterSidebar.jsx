import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';

function PriceFilters({ extra, updateFilters }) {
  const [values, setValues] = useState(extra);
  const [error, setError] = useState('');
  const change = event => setValues(previous => ({ ...previous, [event.target.name]: event.target.type === 'checkbox' ? (event.target.checked ? 'true' : '') : event.target.value }));
  const submit = event => {
    event.preventDefault();
    for (const key of ['minPrice', 'maxPrice']) {
      if (values[key] !== '' && (!Number.isFinite(Number(values[key])) || Number(values[key]) < 0 || Number(values[key]) % 500 !== 0)) { setError('Enter prices in multiples of LKR 500.'); return; }
    }
    if (values.minPrice && values.maxPrice && Number(values.minPrice) > Number(values.maxPrice)) { setError('Minimum price must not exceed maximum price.'); return; }
    setError(''); updateFilters(values);
  };
  return <form onSubmit={submit} noValidate className="space-y-4">
    {Object.entries({ minPrice: 'Minimum price (LKR)', maxPrice: 'Maximum price (LKR)' }).map(([name, label]) => <div key={name}><label htmlFor={`filter-${name}`} className="mb-2 block text-sm font-semibold">{label}</label><input id={`filter-${name}`} className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3" name={name} value={values[name]} onChange={change} type={name === 'brand' ? 'text' : 'number'} min={name === 'brand' ? undefined : 0} step={name === 'brand' ? undefined : 500}/></div>)}
    <p className="text-xs leading-5 text-slate-500">Price ranges use LKR 500 increments.</p>
    <label className="block text-sm font-semibold">Minimum rating<select name="minRating" value={values.minRating} onChange={change} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3"><option value="">Any rating</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}+ stars</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm"><input name="inStock" type="checkbox" checked={values.inStock === 'true'} onChange={change}/>In stock only</label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button type="submit" className="w-full rounded-xl bg-slate-950 p-3 text-sm font-semibold text-white">Apply filters</button>
  </form>;
}

function BrandFilter({ category, value, updateFilters }) {
  const [brands, setBrands] = useState([]);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    let active = true;
    apiClient.get('/products/brands', { params: { category } }).then(({ data }) => {
      if (active) { setBrands(data); setStatus('loaded'); }
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [category]);
  return <div className="mb-4"><label className="block text-sm font-semibold">Brand<select disabled={status !== 'loaded'} value={value} onChange={event => updateFilters({ brand: event.target.value })} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3"><option value="">{status === 'loading' ? 'Loading brands…' : 'All brands'}</option>{value && !brands.includes(value) && <option value={value}>{value}</option>}{brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}</select></label>{status === 'error' && <p role="status" className="mt-2 text-sm text-red-700">Could not load brands. Refresh to retry.</p>}{status === 'loaded' && brands.length === 0 && <p className="mt-2 text-sm text-slate-500">No brands listed for this category.</p>}</div>;
}

export default function FilterSidebar({ currentCategory, currentSort, onCategoryChange, onSortChange, extra, updateFilters, clearFilters }) {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiClient.get('/categories').then(({ data }) => { if (active) setCategories(data); }).catch(() => { if (active) setError('Could not load categories. Refresh to retry.'); });
    return () => { active = false; };
  }, []);
  return <details open className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><summary className="mb-5 cursor-pointer font-bold">Filters and sorting</summary>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    <label className="mb-4 block text-sm font-semibold">Category<select className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3" value={currentCategory} onChange={event => onCategoryChange(event.target.value)}><option value="">All categories</option>{categories.map(category => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label>
    <label className="mb-4 block text-sm font-semibold">Sort by<select className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3" value={currentSort || 'newest'} onChange={event => onSortChange(event.target.value)}>{Object.entries({ newest: 'Newest', price_asc: 'Price: Low to High', price_desc: 'Price: High to Low', rating: 'Highest rated', name_asc: 'Name: A–Z', name_desc: 'Name: Z–A' }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {currentCategory && <BrandFilter key={currentCategory} category={currentCategory} value={extra.brand} updateFilters={updateFilters}/> }
    <PriceFilters key={JSON.stringify(extra)} extra={extra} updateFilters={updateFilters}/>
    <button onClick={clearFilters} className="mt-4 w-full text-sm font-semibold underline">Clear all</button>
  </details>;
}
