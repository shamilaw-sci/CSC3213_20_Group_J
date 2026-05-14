import { useState } from "react";
import { products } from "../../data/mockData";

import ProductCard from "./components/ProductCard";
import CategoryBar from "./components/CategoryBar";
import SearchBar from "./components/search/SearchBar";
import FilterSidebar from "./components/FilterSidebar";

function Catalog() {

  // Existing states
  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Your filter states
  const [priceRange, setPriceRange] = useState(1000000);
  const [phoneType, setPhoneType] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [showFilters, setShowFilters] = useState(false);

  // Filtering
  let filteredProducts = products.filter((p) => {

    const matchCategory =
      category === "All" || p.category === category;

    const matchSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchPrice = p.price <= priceRange;

    const matchPhone =
      phoneType === "All" ||
      p.compatiblePhone === phoneType;

    return (
      matchCategory &&
      matchSearch &&
      matchPrice &&
      matchPhone
    );
  });

  // Sorting
  if (sortBy === "lowToHigh") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "highToLow") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="pt-5 p-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            iCrowd Accessories
          </h1>

          <p className="text-gray-500">
            Premium mobile gear for your devices
          </p>
        </div>

        <div className="w-1/2 flex justify-end">
          <SearchBar
            onSearch={(val) => setSearchQuery(val)}
            resultCount={filteredProducts.length}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#f3f3f3] p-2 mb-8 flex justify-between items-center rounded-sm border border-gray-200">

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-3 px-6 py-2 transition-all rounded-md ${
            showFilters
              ? "bg-gray-800 text-white"
              : "hover:bg-gray-200 text-gray-700"
          }`}
        >
          <span className="text-xl">≡</span>
          <span className="text-sm font-bold uppercase tracking-wider">
            Filters
          </span>
        </button>

        <select
          className="bg-white border border-gray-300 rounded-full px-6 py-1.5 text-sm outline-none"
          onChange={(e) => setSortBy(e.target.value)}
          value={sortBy}
        >
          <option value="default">Sort by latest</option>
          <option value="lowToHigh">Price: Low to High</option>
          <option value="highToLow">Price: High to Low</option>
        </select>
      </div>

      {/* Categories */}
      <CategoryBar
        activeCategory={category}
        setCategory={setCategory}
      />

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-8 mt-6">

        {/* Sidebar */}
        {showFilters && (
          <aside className="w-full md:w-1/4">
            <FilterSidebar
              activeCategory={category}
              setCategory={setCategory}
              productsCount={products.length}
              phoneType={phoneType}
              setPhoneType={setPhoneType}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
          </aside>
        )}

        {/* Products */}
        <main className={`${showFilters ? "md:w-3/4" : "w-full"}`}>

          {filteredProducts.length > 0 ? (
            <div
              className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
                !showFilters ? "lg:grid-cols-4" : ""
              }`}
            >
              {filteredProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 italic">
                No products found.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Catalog;