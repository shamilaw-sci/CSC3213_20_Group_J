function ProductCard({ product }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full">
      {/* Product Image */}
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-48 object-cover"
      />

      {/* Product Details */}
      <div className="p-4">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
          {product.category}
        </span>
        <h3 className="text-lg font-semibold text-gray-800 mt-1 truncate">
          {product.name}
        </h3>
        <p className="text-gray-600 mt-2 text-xl font-bold">
          ${product.price.toFixed(2)}
        </p>

        {/* Add to Cart Button */}
        <button className="w-full mt-4 bg-gray-900 text-white py-2 rounded hover:bg-gray-800 transition-colors font-medium">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
