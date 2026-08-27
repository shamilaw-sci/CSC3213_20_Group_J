import React from 'react';
import { ShieldCheck, Truck, CheckCircle2 } from 'lucide-react';

const ProductFeatures = ({ features = [], warranty, deliveryInfo }) => {
  return (
    <div className="flex flex-col gap-6 mt-8 border-t border-gray-200 pt-8">
      
      {/* Key Features List */}
      {features && features.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-black mb-4">Key Features</h3>
          <ul className="space-y-3">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warranty and Delivery Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {warranty && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
            <ShieldCheck className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-black">Warranty</p>
              <p className="text-xs text-gray-500 font-medium">{warranty}</p>
            </div>
          </div>
        )}
        
        {deliveryInfo && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
            <Truck className="w-6 h-6 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-black">Delivery</p>
              <p className="text-xs text-gray-500 font-medium">{deliveryInfo}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductFeatures;