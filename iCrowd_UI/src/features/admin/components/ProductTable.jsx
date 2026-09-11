import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';

const StatusBadge = ({ isActive }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
        {isActive ? 'Active' : 'Inactive'}
    </span>
);

const StockBadge = ({ stock }) => {
    if (stock === 0) return <span className="text-xs font-bold text-red-500">Out of stock</span>;
    if (stock <= 5) return <span className="text-xs font-semibold text-amber-600">{stock} left</span>;
    return <span className="text-sm text-gray-700">{stock}</span>;
};

const ProductTable = ({ products, onEdit, onDelete, loading }) => {
    const [confirmId, setConfirmId] = useState(null);
    const confirmProduct = products.find(p => p.id === confirmId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Loading products…
                </div>
            </div>
        );
    }

    if (!products.length) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
                <p className="text-sm font-medium">No products found</p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                                <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{product.sku || '—'}</td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                        {product.imageUrls?.[0] ? (
                                            <img src={product.imageUrls[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 bg-gray-100" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <span className="font-medium text-gray-900 line-clamp-1">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-gray-600">{product.category?.name || '—'}</td>
                                <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                                    LKR {parseFloat(product.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <StockBadge stock={product.availableStock} />
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <StatusBadge isActive={product.isActive} />
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onEdit(product)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setConfirmId(product.id)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={!!confirmId}
                title="Deactivate Product?"
                message={`"${confirmProduct?.name}" will be hidden from the store but preserved in the database. You can reactivate it later.`}
                confirmLabel="Deactivate"
                onConfirm={() => { onDelete(confirmId); setConfirmId(null); }}
                onCancel={() => setConfirmId(null)}
            />
        </>
    );
};

export default ProductTable;
