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

        <div className='p-4'>
          <h2 className='text-xl font-semibold text-gray-800'>
            {product.name}
          </h2>

          <p className='text-gray-500 mt-1'>{product.category}</p>

          <p className='text-2xl font-bold text-blue-600 mt-3'>
            ${product.price}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard