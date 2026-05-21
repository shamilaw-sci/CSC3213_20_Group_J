import { Link } from 'react-router-dom'

function ProductCard({ product }) {
  return (

    <Link to={`/product/${product.id}`}>
       <div className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer'> 
        <img
          src={product.imageUrl}
          alt={product.name}
          className='w-full h-64 object-cover'
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
    </Link>
  )
};

export default ProductCard;

