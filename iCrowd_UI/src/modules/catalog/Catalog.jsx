import { useState } from 'react';
import { products } from '../../data/mockData';
import ProductCard from './components/ProductCard';
import CategoryBar from "./components/CategoryBar";

function Catalog(){
    const [category, setCategory] = useState("All");
    
      // Filter logic: Only show products that match the state
    const filteredProducts = category === "All" 
        ? products 
        : products.filter(p => p.category === category);
    
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">iCrowd Accessories</h1>
          <p className="text-gray-500 mb-8">Premium mobile gear for your devices</p>
          
          {/* Our New Component */}
          <CategoryBar activeCategory={category} setCategory={setCategory} />
    
          {/* The Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      );
}

export default Catalog