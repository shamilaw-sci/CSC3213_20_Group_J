import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';

const CategoryTable = ({ categories, onEdit, onDelete, loading }) => {
    const [confirmId, setConfirmId] = useState(null);
    const confirmCategory = categories.find(c => c.id === confirmId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Loading categories…
                </div>
            </div>
        );
    }

    if (!categories.length) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-sm font-medium">No categories yet</p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {categories.map(cat => (
                            <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                                <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">#{cat.id}</td>
                                <td className="px-4 py-3.5 font-semibold text-gray-900">{cat.name}</td>
                                <td className="px-4 py-3.5 text-gray-500 max-w-xs">
                                    <span className="line-clamp-2">{cat.description || <span className="italic text-gray-300">No description</span>}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onEdit(cat)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setConfirmId(cat.id)}
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
                title="Delete Category?"
                message={`Deleting "${confirmCategory?.name}" is permanent. This will fail if products are still assigned to this category.`}
                confirmLabel="Delete"
                onConfirm={() => { onDelete(confirmId); setConfirmId(null); }}
                onCancel={() => setConfirmId(null)}
            />
        </>
    );
};

export default CategoryTable;
