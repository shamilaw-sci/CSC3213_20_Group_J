import React from 'react';
import { Settings } from 'lucide-react';

const ProductSpecs = ({ specifications }) => {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null;
  }

  return (
    <div className="mb-20 bg-[#F6F6F6] p-8 md:p-12 rounded-[32px]">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-black" />
        <h3 className="text-2xl font-bold text-black">Technical Specifications</h3>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <tbody>
            {Object.entries(specifications).map(([key, value]) => (
              <tr 
                key={key} 
                className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <th className="py-4 px-6 text-sm font-bold text-gray-700 w-1/3 border-r border-gray-200 align-top bg-gray-50/50">
                  {key}
                </th>
                <td className="py-4 px-6 text-sm font-medium text-gray-600">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductSpecs;