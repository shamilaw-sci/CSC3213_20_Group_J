import { useState, useEffect } from "react";
// import { products } from "../../data/mockData"; //we trying to get data from actual database
import ProductCard from "./components/ProductCard";
import CategoryBar from "./components/CategoryBar";
import SearchBar from "./components/search/SearchBar";

function Catalog() {
  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [products, setProducts] = useState([]); // to update state with the fetch data
  const [loading, setLoading] = useState(true);

  //fetch the data from server
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/products")
        const data = await response.json()

        setProducts(products)
        setLoading(false)

      } catch (error) {
        console.log("error fetching product" ,error);
        setLoading(false)
      }

      fetchProducts();
    }
  },[]);

  // Show a loading screen while Spring Boot sends the data
  if (loading) return <div className="p-8 bg-gray-50 min-h-screen">Loading iCrowd Catalog...</div>;

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

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      ) : (
        // when product doesnot exist
        <div className="text-center py-12 text-gray-500">
          No products found matching your criteria.
        </div>
      )}
    </div>
  );
}

export default Catalog;