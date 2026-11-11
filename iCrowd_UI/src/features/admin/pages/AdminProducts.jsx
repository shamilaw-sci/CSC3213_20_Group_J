import React, { useState } from 'react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useAdminCategories } from '../hooks/useAdminCategories';
import ProductTable from '../components/ProductTable';
import ProductForm from '../components/ProductForm';

const SlidePanel = ({ isOpen, title, onClose, children }) => (
    <>
        {/* Backdrop */}
        {isOpen && (
            <div
                className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
        )}
        {/* Panel */}
        <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-40 bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
                {children}
            </div>
        </div>
    </>
);

const AdminProducts = () => {
    const [search, setSearch] = useState('');
    const { products, pagination, loading, error, handleCreate, handleUpdate, handleDelete, goToPage } = useAdminProducts(search);
    const { categories } = useAdminCategories();

    const [panelOpen, setPanelOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);


    const openCreate = () => { setEditingProduct(null); setFormError(null); setPanelOpen(true); };
    const openEdit = (product) => { setEditingProduct(product); setFormError(null); setPanelOpen(true); };
    const closePanel = () => { setPanelOpen(false); setEditingProduct(null); setFormError(null); };

    const handleSubmit = async (data) => {
        setFormLoading(true);
        setFormError(null);
        try {
            if (editingProduct) {
                await handleUpdate(editingProduct.id, data);
            } else {
                await handleCreate(data);
            }
            closePanel();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setFormLoading(false);
        }
    };

    const handleSoftDelete = async (id) => {
        try { await handleDelete(id); } catch (err) { console.error(err); }
    };

    const filteredProducts = products;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
                    <p className="text-sm text-gray-400 mt-1">{pagination.totalElements} products total</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-950 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or SKU…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 hover:border-gray-300 transition-colors"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">{error}</div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 p-1">
                <ProductTable
                    products={filteredProducts}
                    onEdit={openEdit}
                    onDelete={handleSoftDelete}
                    loading={loading}
                />
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 0}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {pagination.page + 1} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages - 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Slide-in Panel */}
            <SlidePanel
                isOpen={panelOpen}
                title={editingProduct ? 'Edit Product' : 'New Product'}
                onClose={closePanel}
            >
                {formError && (
                    <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{formError}</div>
                )}
                <ProductForm
                    product={editingProduct}
                    categories={categories}
                    onSubmit={handleSubmit}
                    onCancel={closePanel}
                    loading={formLoading}
                />
            </SlidePanel>
        </div>
    );
};

export default AdminProducts;
