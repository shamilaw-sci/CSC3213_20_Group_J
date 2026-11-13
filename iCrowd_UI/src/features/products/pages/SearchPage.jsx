import { useEffect, useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import FilterSidebar from '../components/FilterSidebar';
import { useProducts } from '../hooks/useProducts';
import { useProductFilters } from '../hooks/useProductFilters';
import { fetchSuggestions } from '../api/fetchSuggestions';
export default function SearchPage() {
 const filters=useProductFilters();
 const {keyword,category,sort,page,extra,updateFilters,clearFilters,setCategory,setSort,setPage}=filters;
 const result=useProducts(keyword,category,sort,page,8,extra,!filters.exact);
 const [suggestion,setSuggestion]=useState(null);
 const restricted=Boolean(category || Object.values(extra).some(Boolean));
 useEffect(()=>{let active=true; setSuggestion(null); if(!result.loading && !result.error && result.pagination.totalElements===0 && keyword && !restricted) fetchSuggestions(keyword).then(data=>{if(active)setSuggestion({keyword,term:data.terms?.[0]});}); return ()=>{active=false;};},[keyword,restricted,result.loading,result.error,result.pagination.totalElements]);
 return <div className="max-w-7xl mx-auto px-4 py-12"><div className="flex flex-col lg:flex-row gap-8"><aside className="w-full shrink-0 lg:w-64"><FilterSidebar currentCategory={category} currentSort={sort} onCategoryChange={setCategory} onSortChange={setSort} extra={extra} updateFilters={updateFilters} clearFilters={clearFilters}/></aside><main className="w-full min-w-0 lg:flex-1">
 <div className="flex flex-wrap gap-2 mb-4">{Object.entries({q:keyword,category,...extra}).filter(([,v])=>v).map(([key,value])=><button key={key} className="rounded-full bg-gray-100 px-3 py-2" aria-label={'Remove '+key+' filter'} onClick={()=>updateFilters({[key]:''})}>{key}: {value} ×</button>)}</div>
 {!result.loading && !result.error && result.correctedKeyword && <p role="status" className="mb-6 rounded-xl bg-blue-50 p-4">Showing results for <strong>{result.correctedKeyword}</strong>. No matches for “{keyword}”.{' '}<button className="underline" onClick={()=>updateFilters({exact:'1'})}>Search instead for “{keyword}”</button></p>}
 {suggestion?.keyword===keyword && suggestion.term && suggestion.term.toLowerCase()!==keyword.toLowerCase() && <p>Did you mean <button className="underline" onClick={()=>updateFilters({q:suggestion.term})}>{suggestion.term}</button>?</p>}
 <ProductGrid {...result} title={keyword ? 'Search results for “'+(result.correctedKeyword || keyword)+'”' : category || 'All products'} onPageChange={setPage}/>
 {!result.loading && !result.error && result.products.length===0 && <button className="underline" onClick={clearFilters}>Clear filters and browse all products</button>}
 </main></div></div>;
}
