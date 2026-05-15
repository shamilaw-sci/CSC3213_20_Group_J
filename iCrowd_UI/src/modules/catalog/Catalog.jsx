import { useState } from "react";
import { products } from "../../data/mockData";
import ProductCard from "./components/ProductCard";
import CategoryBar from "./components/CategoryBar";
import SearchBar from "./components/search/SearchBar";

function Catalog() {
  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) => {
    const matchCategory = category === "All" || p.category === category;
    const matchSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">iCrowd Accessories</h1>
          <p className="text-gray-500">Premium mobile gear for your devices</p>
        </div>

        <div className="w-full md:w-auto">
          <SearchBar
            onSearch={(val) => setSearchQuery(val)}
            resultCount={filteredProducts.length}
          />
        </div>
      </div>
      
      <CategoryBar activeCategory={category} setCategory={setCategory} />

      {searchQuery && filteredProducts.length > 0 && (
        <p className="my-4 text-sm text-gray-500">
          {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "
          <span className="font-medium text-gray-700">{searchQuery}</span>"
        </p>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      ) : (
        <div className="mt-20 text-center">
           <p className="text-gray-400 text-lg">No products match your search.</p>
        </div>
      )}
    </div>
  );
}

export default Catalog;