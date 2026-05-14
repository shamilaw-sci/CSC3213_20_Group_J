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
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="pt-5 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">iCrowd Accessories</h1>
          <p className="text-gray-500">Premium mobile gear for your devices</p>
      </div>
      <div className="w-1/2 flex justify-end">
      <SearchBar
        onSearch={(val) => setSearchQuery(val)}
        resultCount={filteredProducts.length}
      /> 
      </div>
      </div>
      
      <CategoryBar activeCategory={category} setCategory={setCategory} />

      {searchQuery && filteredProducts.length > 0 && (
        <p className="text-sm text-gray-500 my-4">
          {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "
          <span className="font-medium text-gray-700">{searchQuery}</span>"
        </p>
      )}

      {filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Catalog;