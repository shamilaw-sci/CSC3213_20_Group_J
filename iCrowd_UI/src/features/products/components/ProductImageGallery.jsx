import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProductImageGallery = ({ images = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-white rounded-[32px] flex items-center justify-center border border-gray-200 text-gray-400">
        No Image
      </div>
    );
  }

  const nextImage = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Display Image */}
      <div className="relative group w-full aspect-square bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-200">
        <img
          src={images[activeIndex]}
          alt={`Product view ${activeIndex + 1}`}
          className="w-full h-full object-contain p-4 transition-opacity duration-300"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md shadow-md focus:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md shadow-md focus:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Navigation */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 bg-white rounded-[16px] overflow-hidden border-2 transition-all ${
                activeIndex === idx
                  ? 'border-black opacity-100'
                  : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
