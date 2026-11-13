import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Check, Sparkles } from 'lucide-react';
import { fetchFrequentlyBoughtTogether } from '../api/recommendationApi';
import { useCart } from '../../cart/hooks/CartContext';
import { Link } from 'react-router-dom';

const FrequentlyBoughtTogether = ({ productId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    setLoading(true);

    fetchFrequentlyBoughtTogether(productId, 2)
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error("Error loading bundle data:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [productId]);

  if (loading || !data || !data.bundledProducts || data.bundledProducts.length === 0) {
    return null;
  }

  const { targetProduct, bundledProducts, regularTotal, bundleTotal, savings, discountPercentage, isEmpiricalBasket } = data;

  const handleAddBundle = () => {
    if (targetProduct) addToCart(targetProduct);
    bundledProducts.forEach((p) => addToCart(p));
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const allItems = [targetProduct, ...bundledProducts];

  return (
    <div className="my-10 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isEmpiricalBasket ? 'AI Frequent Pair' : 'AI Smart Bundle'}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Save {discountPercentage}%
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
            Frequently Bought Together
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Customers frequently pair this with the complementary accessories below.
          </p>
        </div>
      </div>

      {/* Products & Bundle Summary Row */}
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
        
        {/* Products Visual Group */}
        <div className="flex-1 flex flex-wrap items-center justify-center sm:justify-start gap-4">
          {allItems.map((p, idx) => (
            <React.Fragment key={p.id}>
              {idx > 0 && (
                <div className="p-2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  <Plus className="w-4 h-4" />
                </div>
              )}
              <div className="group w-40 sm:w-44 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-3.5 flex flex-col items-center transition-all">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-900/60 p-2 flex items-center justify-center overflow-hidden mb-3">
                  <img
                    src={p.imageUrls?.[0] || 'https://via.placeholder.com/150'}
                    alt={p.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <Link
                  to={`/products/${p.id}`}
                  className="text-xs font-bold text-white text-center line-clamp-2 hover:text-emerald-400 transition-colors"
                  title={p.name}
                >
                  {p.name}
                </Link>
                <span className="text-[11px] text-slate-400 font-medium mt-1">
                  {p.category?.name || 'Accessory'}
                </span>
                <span className="text-xs font-black text-emerald-400 mt-2">
                  LKR {Number(p.price || 0).toLocaleString()}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Pricing & CTA Card */}
        <div className="w-full lg:w-72 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Bundle Total ({allItems.length} Items)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                LKR {Number(bundleTotal || 0).toLocaleString()}
              </span>
            </div>
            {Number(savings || 0) > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-slate-500 line-through">
                  LKR {Number(regularTotal || 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Save LKR {Number(savings || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddBundle}
            disabled={added}
            className={`w-full mt-5 py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              added
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-500/30'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                Bundle Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Add Bundle to Cart
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;

