import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products = [], pagination, onPageChange, title, subtitle, loading, error }) => {
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 bg-red-50 rounded-2xl border border-red-200 max-w-2xl mx-auto my-10">
        <h2 className="text-red-600 text-xl font-bold mb-2">Oops!</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Optional Title Section */}
      {(title || subtitle) && (
        <div className="mb-8 text-center space-y-2">
          {title && (
            <h2 className="text-3xl font-black tracking-tight text-black">
              {title}
            </h2>
          )}
          {subtitle && <p className="text-gray-500">{subtitle}</p>}
        </div>
      )}

      {pagination && <p role="status" className="mb-4">{pagination.totalElements} results</p>}
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {/* Empty State */}
      {products.length === 0 && !loading && !error && (
        <div className="text-center py-20 text-gray-500">
          No products found.
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
          
          <div className="text-sm text-gray-500 mb-4 sm:mb-0">
            Showing <span className="font-bold text-black">{(pagination.number * pagination.size) + 1}</span> to <span className="font-bold text-black">{Math.min((pagination.number + 1) * pagination.size, pagination.totalElements)}</span> of <span className="font-bold text-black">{pagination.totalElements}</span> results
          </div>
          
          <div className="flex gap-2">
            <button 
              disabled={pagination.number === 0}
              onClick={() => onPageChange(pagination.number - 1)}
              className="px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-black rounded-xl transition-colors font-medium border border-gray-200"
            >
              Previous
            </button>
            
            <div className="flex items-center px-4 font-bold text-black bg-white rounded-xl border border-gray-200">
              Page {pagination.number + 1} of {pagination.totalPages}
            </div>

            <button 
              disabled={pagination.number >= pagination.totalPages - 1}
              onClick={() => onPageChange(pagination.number + 1)}
              className="px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-black rounded-xl transition-colors font-medium border border-gray-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
