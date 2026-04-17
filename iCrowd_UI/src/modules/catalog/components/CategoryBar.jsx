// src/components/CategoryBar.jsx
function CategoryBar({ activeCategory, setCategory }) {
  const categories = ["All", "Cases", "Chargers", "Protection"];

  return (
    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            activeCategory === cat 
              ? "bg-gray-900 text-white" 
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export default CategoryBar;