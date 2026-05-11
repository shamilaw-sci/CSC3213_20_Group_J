import { useParams, Link } from 'react-router-dom'
import { products } from '../../../data/mockData'

function ProductDetails() {
  const { id } = useParams()

  const product = products.find((p) => p.id == id)

  if (!product) {
    return (
      <div className='p-10 text-center text-red-500 text-2xl'>
        Product not found
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <Link
        to='/'
        className='text-blue-600 font-semibold hover:underline'
      >
        ← Back to Products
      </Link>

      <div className='mt-6 bg-white rounded-2xl shadow-lg overflow-hidden grid md:grid-cols-2 gap-8 p-8'>
        <div>
          <img
            src={product.imageUrl}
            alt={product.name}
            className='w-full rounded-xl'
          />
        </div>

        <div>
          <h1 className='text-4xl font-bold text-gray-900'>
            {product.name}
          </h1>

          <p className='text-gray-500 text-lg mt-2'>
            {product.category}
          </p>

          <p className='text-3xl font-bold text-blue-600 mt-4'>
            ${product.price}
          </p>

          <p className='mt-6 text-gray-700 leading-7'>
            {product.description}
          </p>

          <p className='mt-4 font-semibold'>
            Stock Available: {product.stock}
          </p>

          <button className='mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-semibold transition'>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails