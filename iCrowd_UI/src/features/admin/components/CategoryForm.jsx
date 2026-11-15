import React, { useState } from 'react';

const CategoryForm = ({ category, onSubmit, onCancel, loading }) => {
    const [form, setForm] = useState(() => ({ name: category?.name || '', description: category?.description || '' }));
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.name.trim()) errs.name = 'Category name is required';
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSubmit({ name: form.name.trim(), description: form.description.trim() || null });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Name <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Electronics"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Optional short description…"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-colors resize-none"
                />
            </div>

            <div className="flex gap-3 pt-1">
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-950 text-white text-sm font-semibold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'Saving…' : category ? 'Save Changes' : 'Create Category'}
                </button>
            </div>
        </form>
    );
};

export default CategoryForm;
