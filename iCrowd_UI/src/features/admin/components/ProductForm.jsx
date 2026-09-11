import React, { useState, useEffect } from 'react';

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
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product) {
            setForm({
                sku: product.sku || '',
                name: product.name || '',
                description: product.description || '',
                categoryId: product.category?.id || '',
                price: product.price || '',
                availableStock: product.availableStock ?? '',
                imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls.join('\n') : '',
                tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
                isActive: product.isActive ?? true,
            });
        } else {
            setForm(emptyForm);
        }
        setErrors({});
    }, [product]);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.categoryId) e.categoryId = 'Category is required';
        if (!form.price || isNaN(form.price) || +form.price < 0) e.price = 'Valid price required';
        if (form.availableStock === '' || isNaN(form.availableStock) || +form.availableStock < 0) e.availableStock = 'Valid stock required';
        return e;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
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
            availableStock: parseInt(form.availableStock),
            imageUrls: form.imageUrls ? form.imageUrls.split('\n').map(s => s.trim()).filter(Boolean) : [],
            tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
            isActive: form.isActive,
        };
        onSubmit(payload);
    };

    const Field = ({ label, name, type = 'text', required, children, hint }) => (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children || (
                <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                        errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                />
            )}
            {hint && !errors[name] && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
            {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Field label="SKU" name="sku" />
                <Field label="Name" name="name" required />
            </div>

            <Field label="Description" name="description">
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors resize-none"
                />
            </Field>

            <Field label="Category" name="categoryId" required>
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
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Price (LKR)" name="price" type="number" required />
                <Field label="Stock" name="availableStock" type="number" required />
            </div>

            <Field label="Image URLs" name="imageUrls" hint="One URL per line">
                <textarea
                    name="imageUrls"
                    value={form.imageUrls}
                    onChange={handleChange}
                    rows={3}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors resize-none font-mono text-xs"
                />
                <p className="text-xs text-gray-400 mt-1">One URL per line</p>
            </Field>

            <Field label="Tags" name="tags" hint="Comma-separated e.g. electronics, sale">
                <input
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="electronics, featured, sale"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            </Field>

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
