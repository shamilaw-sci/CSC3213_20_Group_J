import React, { useState } from 'react';
import { useAdminCategories } from '../hooks/useAdminCategories';
import CategoryTable from '../components/CategoryTable';
import CategoryForm from '../components/CategoryForm';

const Modal = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
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
                <div className="px-6 py-6">{children}</div>
            </div>
        </div>
    );
};

const AdminCategories = () => {
    const { categories, loading, error, handleCreate, handleUpdate, handleDelete } = useAdminCategories();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    const openCreate = () => { setEditingCategory(null); setFormError(null); setModalOpen(true); };
    const openEdit = (cat) => { setEditingCategory(cat); setFormError(null); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingCategory(null); setFormError(null); };

    const handleSubmit = async (data) => {
        setFormLoading(true);
        setFormError(null);
        try {
            if (editingCategory) {
                await handleUpdate(editingCategory.id, data);
            } else {
                await handleCreate(data);
            }
            closeModal();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save category');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await handleDelete(id);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete category');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categories</h1>
                    <p className="text-sm text-gray-400 mt-1">{categories.length} categories</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-950 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">{error}</div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-1">
                <CategoryTable
                    categories={categories}
                    onEdit={openEdit}
                    onDelete={handleDeleteCategory}
                    loading={loading}
                />
            </div>

            <Modal
                isOpen={modalOpen}
                title={editingCategory ? 'Edit Category' : 'New Category'}
                onClose={closeModal}
            >
                {formError && (
                    <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{formError}</div>
                )}
                <CategoryForm
                    category={editingCategory}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                    loading={formLoading}
                />
            </Modal>
        </div>
    );
};

export default AdminCategories;
