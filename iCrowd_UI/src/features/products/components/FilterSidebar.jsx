import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';
export default function FilterSidebar({ currentCategory, currentSort, onCategoryChange, onSortChange, extra, updateFilters, clearFilters }) {
 const [categories,setCategories]=useState([]);
 const [error,setError]=useState('');
 useEffect(()=>{ let active=true; apiClient.get('/categories').then(({data})=>{if(active)setCategories(data);}).catch(()=>{if(active)setError('Could not load categories. Refresh to retry.');}); return ()=>{active=false;}; },[]);
 return <details open className="bg-gray-50 p-6 rounded-3xl"><summary className="font-bold mb-4 cursor-pointer">Filters and sorting</summary>
 {error && <p role="alert">{error}</p>}
 <label className="block mb-4">Category<select className="block w-full p-3" value={currentCategory} onChange={e=>onCategoryChange(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></label>
 <label className="block mb-4">Sort by<select className="block w-full p-3" value={currentSort || 'newest'} onChange={e=>onSortChange(e.target.value)}>{Object.entries({newest:'Newest',price_asc:'Price: Low to High',price_desc:'Price: High to Low',rating:'Highest rated',name_asc:'Name: A–Z',name_desc:'Name: Z–A'}).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
 <form key={JSON.stringify(extra)} onSubmit={e=>{e.preventDefault(); const values=Object.fromEntries(new FormData(e.currentTarget)); if(values.minPrice && values.maxPrice && Number(values.minPrice)>Number(values.maxPrice)){setError('Minimum price must not exceed maximum price.');return;} setError('');updateFilters({...values,inStock:values.inStock || ''});}}>
 {Object.entries({minPrice:'Minimum price',maxPrice:'Maximum price',brand:'Brand'}).map(([key,label])=><label key={key} className="block mb-4">{label}<input className="block w-full p-3" name={key} defaultValue={extra[key]} type={key==='brand'?'text':'number'} min="0" step="0.01"/></label>)}
 <label className="block mb-4">Minimum rating<select className="block w-full p-3" name="minRating" defaultValue={extra.minRating}><option value="">Any rating</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+ stars</option>)}</select></label>
 <label className="block mb-4"><input name="inStock" type="checkbox" value="true" defaultChecked={extra.inStock==='true'}/> In stock only</label>
 <button className="bg-black text-white p-3 rounded-xl">Apply filters</button></form><button className="mt-4 underline" onClick={clearFilters}>Clear all</button></details>;
}
