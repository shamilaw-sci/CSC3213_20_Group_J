import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { products } from '../../../data/mockData'

function ProductDetails() {
  const { id } = useParams()

  const product = products.find((p) => p.id == id)

  const [mainImage, setMainImage] = useState(
    product?.imageUrl
  )

  if (!product) {
    return (
      <div className='p-10 text-center text-red-500 text-2xl'>
        Product not found
      </div>
    )
  }

  const gallery = [
    product.imageUrl,
    product.imageUrl,
    product.imageUrl,
    product.imageUrl,
  ]

  return (
    <div className='min-h-screen bg-gray-100 p-6 md:p-10'>

      <Link
        to='/'
        className='text-blue-600 font-medium hover:underline'
      >
        ← Back to Products
      </Link>

      <div className='mt-6 bg-white rounded-2xl shadow-lg p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10'>

        {/* LEFT SIDE */}
        <div>

          {/* Main Image */}
          <div className='border rounded-2xl overflow-hidden bg-gray-50'>
            <img
              src={mainImage}
              alt={product.name}
              className='w-full h-[500px] object-cover'
            />
          </div>

          {/* Thumbnail Gallery */}
          <div className='flex gap-4 mt-4'>
            {gallery.map((img, index) => (
              <img
                key={index}
                src={img}
                alt='thumb'
                onClick={() => setMainImage(img)}
                className='w-24 h-24 rounded-xl border cursor-pointer hover:border-blue-500 object-cover'
              />
            ))}
          </div>
        </div>


        {/* RIGHT SIDE */}
        <div>

          {/* Category */}
          <p className='uppercase text-sm text-blue-600 font-bold tracking-wider'>
            {product.category}
          </p>

          {/* Product Name */}
          <h1 className='text-4xl font-bold text-gray-900 mt-2'>
            {product.name}
          </h1>

          {/* Rating */}
          <div className='flex items-center gap-2 mt-4'>
            <div className='text-yellow-500 text-xl'>★★★★★</div>
            <span className='text-gray-500 text-sm'>
              4.8 (120 Reviews)
            </span>
          </div>

          {/* Price */}
          <div className='mt-6'>
            <p className='text-gray-400 line-through text-lg'>
              $ {(product.price + 40).toFixed(2)}
            </p>

            <h2 className='text-5xl font-bold text-blue-600'>
              $ {product.price.toFixed(2)}
            </h2>

            <p className='text-green-600 font-semibold mt-2'>
              Save 15%
            </p>
          </div>

          {/* Stock */}
          <div className='mt-6'>
            {product.stock > 0 ? (
              <span className='bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold'>
                In Stock
              </span>
            ) : (
              <span className='bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold'>
                Out of Stock
              </span>
            )}
          </div>

          {/* Description */}
          <div className='mt-8'>
            <h3 className='text-2xl font-semibold text-gray-900'>
              Product Description
            </h3>

            <p className='mt-4 text-gray-600 leading-8'>
              {product.description}
            </p>
          </div>

          {/* Features */}
          <div className='mt-8'>
            <h3 className='text-2xl font-semibold text-gray-900 mb-4'>
              Features
            </h3>

            <ul className='space-y-3 text-gray-700'>
              <li>✔ Premium Quality Material</li>
              <li>✔ Fast Delivery Available</li>
              <li>✔ 1 Year Warranty</li>
              <li>✔ Compatible with Multiple Devices</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className='flex gap-4 mt-10'>
            <button className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition'>
              Add to Cart
            </button>

            <button className='border border-gray-300 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition'>
              Buy Now
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ProductDetails