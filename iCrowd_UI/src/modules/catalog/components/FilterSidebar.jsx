import React from 'react';

function FilterSidebar({ activeCategory, setCategory, phoneType, setPhoneType, priceRange, setPriceRange }) {
  const brands = ["Motorola", "Google", "Nothing Phone (1)", "Apple", "Samsung"];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-sm uppercase">Category Filter</div>
      
      <div className="p-4">
        {/* Brand Section */}
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Brands</h3>
        <ul className="space-y-2 mb-6">
          <li onClick={() => setCategory("All")} className={`cursor-pointer text-sm ${activeCategory === "All" ? "text-blue-600 font-bold" : "text-gray-600"}`}>All Brands</li>
          {brands.map(brand => (
            <li key={brand} onClick={() => setCategory(brand)} className={`cursor-pointer text-sm ${activeCategory === brand ? "text-blue-600 font-bold" : "text-gray-600 hover:text-blue-500"}`}>
              {brand}
            </li>
          ))}
        </ul>

        {/* Compatibility Section */}
        <h3 className="font-bold text-gray-800 mb-3 text-sm border-t pt-4 uppercase">Device Type</h3>
        <div className="space-y-2 mb-6">
          {["All", "iPhone", "Android"].map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="radio" name="phone" checked={phoneType === type} onChange={() => setPhoneType(type)} className="accent-blue-600" />
              {type}
            </label>
          ))}
        </div>

        {/* Price Filter Section */}
        <h3 className="font-bold text-gray-800 mb-3 text-sm border-t pt-4 uppercase">Max Price</h3>
        <input 
          type="range" min="0" max="500000" step="5000"
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
        />
        <div className="text-xs text-gray-600 mt-2 font-bold">$ {Number(priceRange).toLocaleString()}</div>
      </div>
    </div>
  );
}

export default FilterSidebar;