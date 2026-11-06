import React from 'react';

const FilterSidebar = ({ currentCategory, currentSort, onCategoryChange, onSortChange }) => {
  const categories = ['All', 'Smartphone', 'Headset', 'PowerBank', 'Case'];
  
  return (
    <div className="bg-[#F6F6F6] p-6 rounded-[24px] h-fit sticky top-24 border border-transparent">
      <h3 className="text-xl font-semibold text-black mb-6 tracking-tight">Filters</h3>
      
      {/* Categories */}
      <div className="mb-8">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Category
        </h4>
        <div className="space-y-1 flex flex-col">
          {categories.map((cat) => {
            const isSelected = (currentCategory === cat) || (!currentCategory && cat === 'All');
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`text-left px-4 py-2.5 rounded-xl transition-all font-medium ${
                  isSelected 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-200 hover:text-black'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sorting */}
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Sort By
        </h4>
        <select 
          className="w-full bg-white text-black text-sm font-medium rounded-xl focus:ring-2 focus:ring-black block p-3 outline-none shadow-sm cursor-pointer appearance-none border-none"
          value={currentSort || ''}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="">Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
};

export default FilterSidebar;
