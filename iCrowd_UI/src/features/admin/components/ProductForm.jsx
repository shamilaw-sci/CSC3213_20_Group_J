import React, { useState } from 'react';

const emptyForm = {
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    price: '',
    availableStock: '',
    imageUrls: '',
    tags: '',
    isActive: true,
};

const ProductForm = ({ product, categories, onSubmit, onCancel, loading }) => {
    const [form, setForm] = useState(() => product ? {
        ...product, categoryId: product.category?.id || '', price: product.price ?? '',
        costPrice: product.costPrice ?? '', leadTimeDays: product.leadTimeDays ?? 7,
        imageUrls: (product.imageUrls || []).join('\n'), tags: (product.tags || []).join(', '),
        description: product.description || '', sku: product.sku || '',
    } : { ...emptyForm, costPrice: '', leadTimeDays: 7 });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.categoryId) e.categoryId = 'Category is required';
        if (!form.price || isNaN(form.price) || +form.price < 0) e.price = 'Valid price required';
        if (form.availableStock === '' || isNaN(form.availableStock) || +form.availableStock < 0) e.availableStock = 'Valid stock required';
        if (form.costPrice !== '' && (!Number.isFinite(+form.costPrice) || +form.costPrice < 0)) e.costPrice = 'Cost cannot be negative';
        if (!Number.isInteger(+form.leadTimeDays) || +form.leadTimeDays < 1 || +form.leadTimeDays > 365) e.leadTimeDays = 'Use 1 to 365 days';
        return e;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        const payload = {
            sku: form.sku.trim() || null,
            name: form.name.trim(),
            description: form.description.trim() || null,
            categoryId: parseInt(form.categoryId),
            price: parseFloat(form.price),
            costPrice: form.costPrice === '' ? null : Number(form.costPrice),
            leadTimeDays: Number(form.leadTimeDays),
            version: product?.version,
            availableStock: parseInt(form.availableStock),
            imageUrls: form.imageUrls ? form.imageUrls.split('\n').map(s => s.trim()).filter(Boolean) : [],
            tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
            isActive: form.isActive,
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            {/* SKU + Name */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">SKU</label>
                    <input
                        type="text"
                        name="sku"
                        value={form.sku}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                            errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors resize-none"
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Category <span className="text-red-400">*</span>
                </label>
                <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors ${
                        errors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    <option value="">Select category…</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label>Purchase cost (LKR)<input aria-label="Purchase cost (LKR)" type="number" min="0" step="0.01" name="costPrice" value={form.costPrice} onChange={handleChange} className="w-full border rounded-xl p-2"/><span>{errors.costPrice}</span></label>
              <label>Supplier lead time (days)<input aria-label="Supplier lead time (days)" type="number" min="1" max="365" name="leadTimeDays" value={form.leadTimeDays} onChange={handleChange} className="w-full border rounded-xl p-2"/><span>{errors.leadTimeDays}</span></label>
            </div>
            {/* Price + Stock */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Price (LKR) <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                            errors.price ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    />
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Stock <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="number"
                        name="availableStock"
                        value={form.availableStock}
                        onChange={handleChange}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                            errors.availableStock ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    />
                    {errors.availableStock && <p className="text-xs text-red-500 mt-1">{errors.availableStock}</p>}
                </div>
            </div>

            {/* Image URLs */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Image URLs</label>
                <textarea
                    name="imageUrls"
                    value={form.imageUrls}
                    onChange={handleChange}
                    rows={3}
                    placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors resize-none font-mono text-xs"
                />
                <p className="text-xs text-gray-400 mt-1">One URL per line</p>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tags</label>
                <input
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="electronics, featured, sale"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-gray-900"
                />
                <span className="text-sm font-medium text-gray-700">Active (visible in store)</span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-950 text-white text-sm font-semibold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving…' : product ? 'Save Changes' : 'Create Product'}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
