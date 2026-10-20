import React, { useRef, useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProductSlider = ({ title, subtitle, products = [], loading = false, error = null }) => {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const handleScroll = (direction) => {
    if (!sliderRef.current) return;
    const scrollAmount = 320; // 1-card step
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 350);
  };

  if (loading) {
    return (
      <div className="w-full py-8">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight">{title}</h2>}
            {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
          </div>
        )}
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-[280px] sm:w-[300px] flex-shrink-0 h-[380px] bg-gray-100 animate-pulse rounded-[32px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null; // Gracefully omit empty sections
  }

  return (
    <div className="w-full py-8">
      {/* Header with Title and Scroll Arrows */}
      <div className="flex items-end justify-between mb-6">
        <div>
          {title && (
            <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight">
              {title}
            </h2>
          )}
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>

        {/* Side Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous suggestions"
            className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft size={20} className="text-black" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next suggestions"
            className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <ChevronRight size={20} className="text-black" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={sliderRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="w-[280px] sm:w-[300px] flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSlider;
