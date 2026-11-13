import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { fetchRecentlyViewed } from '../api/recommendationApi';
import ProductSlider from './ProductSlider';

const RecentlyViewedSection = ({ currentProductId }) => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Get sessionId from localStorage or generate one
    let sessionId = localStorage.getItem('icrowd_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('icrowd_session_id', sessionId);
    }

    fetchRecentlyViewed(8, sessionId)
      .then((items) => {
        if (isMounted) {
          // Filter out current product
          const filtered = (items || []).filter((p) => String(p.id) !== String(currentProductId));
          setRecentProducts(filtered);
        }
      })
      .catch((err) => {
        console.error("Error loading recently viewed products:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [currentProductId]);

  if (loading || recentProducts.length === 0) {
    return null;
  }

  return (
    <div className="my-12">
      <div className="flex items-center gap-2 mb-2 px-2">
        <span className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
          <History className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Browsing History</span>
      </div>
      <ProductSlider
        products={recentProducts}
        title="Recently Viewed Products"
        subtitle="Quickly return to items you inspected during this session."
      />
    </div>
  );
};

export default RecentlyViewedSection;

