import React, { useState } from 'react';
import { Routes, Route } from "react-router-dom";
import ProductCard from './modules/catalog/components/ProductCard';
import FilterSidebar from './modules/catalog/components/FilterSidebar';
import Catalog from "./modules/catalog/Catalog";
import ProductDetails from "./modules/catalog/pages/ProductDetails";


const HomePage = ({ 
  showFilters, setShowFilters, activeCategory, setCategory, 
  phoneType, setPhoneType, priceRange, setPriceRange, 
  sortBy, setSortBy, filteredProducts, mockProducts 
}) => (
  <div className="bg-white min-h-screen text-gray-800">
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-gray-700">Mobile Phones</h1>
      </div>

      <div className="bg-[#f3f3f3] p-2 mb-8 flex justify-between items-center rounded-sm border border-gray-200">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-3 px-6 py-2 transition-all rounded-md ${showFilters ? 'bg-gray-800 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
        >
          <span className="text-xl">≡</span>
          <span className="text-sm font-bold uppercase tracking-wider">Filters</span>
        </button>
        
        <div className="flex items-center px-4">
          <span className="text-sm text-gray-500 mr-4">Showing all {filteredProducts.length} results</span>
          <select 
            className="bg-white border border-gray-300 rounded-full px-6 py-1.5 text-sm outline-none focus:border-blue-500 text-gray-600"
            onChange={(e) => setSortBy(e.target.value)}
            value={sortBy}
          >
            <option value="default">Sort by latest</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {showFilters && (
          <aside className="w-full md:w-1/4 animate-in slide-in-from-left duration-300">
            <FilterSidebar 
              activeCategory={activeCategory} 
              setCategory={setCategory} 
              productsCount={mockProducts.length}
              phoneType={phoneType}
              setPhoneType={setPhoneType}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
          </aside>
        )}

        <main className={`transition-all duration-300 ${showFilters ? "md:w-3/4" : "w-full"}`}>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${showFilters ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 italic">No products found for this filter.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  </div>
);


function App() {
  const [activeCategory, setCategory] = useState("All");
  const [priceRange, setPriceRange] = useState(1000000); 
  const [phoneType, setPhoneType] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showFilters, setShowFilters] = useState(false); 

  const mockProducts = [
    { id: 1, name: "Motorola Moto G57 5G 8GB RAM 128GB", category: "Motorola", price: 79990.00, compatiblePhone: "Android", imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400" },
    { id: 2, name: "Google Pixel 10a 8GB RAM 128GB", category: "Google", price: 151500.00, compatiblePhone: "Android", imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400" },
    { id: 3, name: "Nothing Phone 2 Pro 8GB RAM 128GB", category: "Nothing Phone (1)", price: 109990.00, compatiblePhone: "Android", imageUrl: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=400" },
    { id: 4, name: "iPhone 15 Pro Max 256GB", category: "Apple", price: 345000.00, compatiblePhone: "iPhone", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTe4MPIhPPbirq2QDBGoxYqqauG-M76Q4Zl5w&s" },
    { id: 5, name: "Samsung Galaxy S24 Ultra", category: "Samsung", price: 310000.00, compatiblePhone: "Android", imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400" }
  ];

  let filteredProducts = showFilters ? mockProducts.filter(product => {
    const matchCategory = activeCategory === "All" || product.category === activeCategory;
    const matchPrice = product.price <= priceRange;
    const matchPhone = phoneType === "All" || product.compatiblePhone === phoneType;
    return matchCategory && matchPrice && matchPhone;
  }) : mockProducts;

  if (sortBy === "lowToHigh") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "highToLow") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <Routes>
      <Route path="/" element={
        <HomePage 
          showFilters={showFilters} setShowFilters={setShowFilters}
          activeCategory={activeCategory} setCategory={setCategory}
          phoneType={phoneType} setPhoneType={setPhoneType}
          priceRange={priceRange} setPriceRange={setPriceRange}
          sortBy={sortBy} setSortBy={setSortBy}
          filteredProducts={filteredProducts}
          mockProducts={mockProducts}
        />
      } />
      <Route path="/catalog-old" element={<Catalog />} />
      <Route path="/product/:id" element={<ProductDetails />} />
    </Routes>
  );
}

export default App;