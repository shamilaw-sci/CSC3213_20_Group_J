import MarketingPanel from '../components/MarketingPanel';
import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
    getAllPromoCodes,
    getPromoStats,
    createPromoCode,
    updatePromoCode,
    togglePromoCode,
    deletePromoCode,
} from '../api/adminPromoApi';
import ConfirmModal from '../components/ConfirmModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
    val != null ? `LKR ${parseFloat(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const STATUS_STYLES = {
    ACTIVE:    'bg-green-50  text-green-700  border-green-200',
    DISABLED:  'bg-gray-100  text-gray-500   border-gray-200',
    EXPIRED:   'bg-red-50    text-red-600    border-red-200',
    SCHEDULED: 'bg-amber-50  text-amber-700  border-amber-200',
};

const EMPTY_FORM = {
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountAmount: '',
    minimumOrderAmount: '',
    startDate: '',
    expiryDate: '',
    totalUsageLimit: '',
    perCustomerLimit: '',
    customerEligibility: 'ALL',
    eligibleCustomerEmails: '',
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
);

// ── Promo Form Panel ──────────────────────────────────────────────────────────

const PromoForm = ({ initial, onSave, onCancel, saving }) => {
    const [form, setForm] = useState(initial ?? EMPTY_FORM);
    const [errors, setErrors] = useState({});

    const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

    const validate = () => {
        const e = {};
        if (!form.code.trim()) e.code = 'Code is required.';
        if (!form.discountValue || isNaN(form.discountValue) || Number(form.discountValue) <= 0)
            e.discountValue = 'Enter a valid positive value.';
        if (form.discountType === 'PERCENTAGE' && Number(form.discountValue) > 100)
            e.discountValue = 'Percentage cannot exceed 100.';
        if (form.customerEligibility === 'SELECTED_CUSTOMERS' && !form.eligibleCustomerEmails.trim())
            e.eligibleCustomerEmails = 'At least one email is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            code: form.code.toUpperCase().trim(),
            discountType: form.discountType,
            discountValue: parseFloat(form.discountValue),
            maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null,
            minimumOrderAmount: form.minimumOrderAmount ? parseFloat(form.minimumOrderAmount) : null,
            startDate: form.startDate || null,
            expiryDate: form.expiryDate || null,
            totalUsageLimit: form.totalUsageLimit ? parseInt(form.totalUsageLimit) : null,
            perCustomerLimit: form.perCustomerLimit ? parseInt(form.perCustomerLimit) : null,
            customerEligibility: form.customerEligibility,
            eligibleCustomerEmails:
                form.customerEligibility === 'SELECTED_CUSTOMERS'
                    ? form.eligibleCustomerEmails.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)
                    : [],
        };
        onSave(payload);
    };

    const field = (label, key, type = 'text', placeholder = '', extra = null) => (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors ${errors[key] ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
            {extra}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            {/* Code & Type */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Code *</label>
                    <input
                        type="text"
                        value={form.code}
                        onChange={e => set('code', e.target.value.toUpperCase())}
                        placeholder="e.g. WELCOME20"
                        className={`w-full border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-black transition-colors ${errors.code ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Discount Type *</label>
                    <select
                        value={form.discountType}
                        onChange={e => set('discountType', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                    >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (LKR)</option>
                    </select>
                </div>
            </div>

            {/* Value & Cap */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {form.discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount (LKR)'} *
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discountValue}
                        onChange={e => set('discountValue', e.target.value)}
                        placeholder={form.discountType === 'PERCENTAGE' ? '15' : '500'}
                        className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors ${errors.discountValue ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.discountValue && <p className="text-xs text-red-500 mt-1">{errors.discountValue}</p>}
                </div>
                {form.discountType === 'PERCENTAGE' && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Max Discount (LKR)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.maxDiscountAmount}
                            onChange={e => set('maxDiscountAmount', e.target.value)}
                            placeholder="e.g. 2000 (optional)"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                        />
                    </div>
                )}
            </div>

            {/* Min Order */}
            {field('Minimum Order Amount (LKR)', 'minimumOrderAmount', 'number', 'e.g. 1000 (optional)')}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
                {field('Start Date (optional)', 'startDate', 'date')}
                {field('Expiry Date (optional)', 'expiryDate', 'date')}
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-3">
                {field('Total Usage Limit', 'totalUsageLimit', 'number', 'Unlimited if blank')}
                {field('Per Customer Limit', 'perCustomerLimit', 'number', 'Unlimited if blank')}
            </div>

            {/* Eligibility */}
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Eligibility</label>
                <select
                    value={form.customerEligibility}
                    onChange={e => set('customerEligibility', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                >
                    <option value="ALL">All Customers</option>
                    <option value="NEW_CUSTOMERS">New Customers Only</option>
                    <option value="SELECTED_CUSTOMERS">Selected Customers</option>
                </select>
            </div>

            {form.customerEligibility === 'SELECTED_CUSTOMERS' && (
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Eligible Emails <span className="text-gray-400 font-normal">(one per line or comma-separated)</span>
                    </label>
                    <textarea
                        rows={4}
                        value={form.eligibleCustomerEmails}
                        onChange={e => set('eligibleCustomerEmails', e.target.value)}
                        placeholder="customer@example.com&#10;another@example.com"
                        className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors resize-none ${errors.eligibleCustomerEmails ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.eligibleCustomerEmails && (
                        <p className="text-xs text-red-500 mt-1">{errors.eligibleCustomerEmails}</p>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all disabled:bg-gray-400 active:scale-[0.98]"
                >
                    {saving ? 'Saving…' : initial ? 'Update Code' : 'Create Code'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const AdminPromoCodes = () => {
    const [codes, setCodes] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');

    // Panel state
    const [panelOpen, setPanelOpen] = useState(false);
    const [editing, setEditing] = useState(null); // null = create mode, object = edit mode
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Expanded rows
    const [expanded, setExpanded] = useState(new Set());

    const load = useCallback(async () => {
        setLoading(true);
        setApiError('');
        try {
            const [c, s] = await Promise.all([getAllPromoCodes(), getPromoStats()]);
            setCodes(c);
            setStats(s);
        } catch {
            setApiError('Failed to load promo codes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setFormError(''); setPanelOpen(true); };
    const openEdit = (code) => {
        setEditing({
            ...EMPTY_FORM,
            id: code.id,
            code: code.code,
            discountType: code.discountType,
            discountValue: String(code.discountValue ?? ''),
            maxDiscountAmount: code.maxDiscountAmount != null ? String(code.maxDiscountAmount) : '',
            minimumOrderAmount: code.minimumOrderAmount != null ? String(code.minimumOrderAmount) : '',
            startDate: code.startDate ?? '',
            expiryDate: code.expiryDate ?? '',
            totalUsageLimit: code.totalUsageLimit != null ? String(code.totalUsageLimit) : '',
            perCustomerLimit: code.perCustomerLimit != null ? String(code.perCustomerLimit) : '',
            customerEligibility: code.customerEligibility ?? 'ALL',
            eligibleCustomerEmails: (code.eligibleCustomerEmails ?? []).join('\n'),
        });
        setFormError('');
        setPanelOpen(true);
    };
    const closePanel = () => { setPanelOpen(false); setEditing(null); };

    const handleSave = async (payload) => {
        setSaving(true);
        setFormError('');
        try {
            if (editing?.id) {
                await updatePromoCode(editing.id, payload);
            } else {
                await createPromoCode(payload);
            }
            closePanel();
            load();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to save promo code.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            const updated = await togglePromoCode(id);
            setCodes(prev => prev.map(c => c.id === id ? updated : c));
        } catch {
            setApiError('Failed to toggle promo code.');
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deletePromoCode(deleteTarget.id);
            setDeleteTarget(null);
            load();
        } catch {
            setApiError('Failed to delete promo code.');
        } finally {
            setDeleting(false);
        }
    };

    const toggleExpand = (id) =>
        setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Promo Codes</h1>
                    <p className="text-sm text-gray-400 mt-1">Create and manage discount codes for your customers.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-950 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
                >
                    <Plus size={16} /> New Code
                </button>
            </div>

            <MarketingPanel />

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Active Codes" value={stats.activeCodes} />
                    <StatCard label="Expired Codes" value={stats.expiredCodes} />
                    <StatCard label="Total Redemptions" value={stats.totalRedemptions} />
                    <StatCard label="Total Discount Given" value={formatCurrency(stats.totalDiscountGiven)} />
                </div>
            )}

            {/* API Error */}
            {apiError && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm">{apiError}</div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                        Loading…
                    </div>
                ) : codes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Tag size={32} className="mb-3 opacity-40" />
                        <p className="text-sm font-medium">No promo codes yet</p>
                        <p className="text-xs mt-1">Click "New Code" to create your first one.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    {['Code', 'Type & Value', 'Eligibility', 'Validity', 'Usage', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {codes.map(c => (
                                    <React.Fragment key={c.id}>
                                        <tr className="hover:bg-gray-50/60 transition-colors">
                                            {/* Code */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-gray-900 text-sm">{c.code}</span>
                                                    <button
                                                        onClick={() => toggleExpand(c.id)}
                                                        className="text-gray-300 hover:text-gray-600 transition-colors"
                                                        title="Show details"
                                                    >
                                                        {expanded.has(c.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Type & Value */}
                                            <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                                                {c.discountType === 'PERCENTAGE'
                                                    ? `${c.discountValue}%${c.maxDiscountAmount ? ` (max ${formatCurrency(c.maxDiscountAmount)})` : ''}`
                                                    : formatCurrency(c.discountValue)}
                                            </td>

                                            {/* Eligibility */}
                                            <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                                                {c.customerEligibility === 'ALL' && 'All Customers'}
                                                {c.customerEligibility === 'NEW_CUSTOMERS' && 'New Customers'}
                                                {c.customerEligibility === 'SELECTED_CUSTOMERS' && `Selected (${c.eligibleCustomerEmails?.length ?? 0})`}
                                            </td>

                                            {/* Validity */}
                                            <td className="px-5 py-3 text-gray-600 whitespace-nowrap text-xs">
                                                {c.expiryDate ? (
                                                    <>
                                                        {c.startDate ? `${c.startDate} → ` : ''}
                                                        {c.expiryDate}
                                                    </>
                                                ) : '∞ No expiry'}
                                            </td>

                                            {/* Usage */}
                                            <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                                                {c.usageCount}{c.totalUsageLimit != null ? ` / ${c.totalUsageLimit}` : ''}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3">
                                                <span className={`inline-block text-xs font-semibold border rounded-full px-2.5 py-0.5 ${STATUS_STYLES[c.status] ?? ''}`}>
                                                    {c.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1">
                                                    {/* Toggle */}
                                                    <button
                                                        onClick={() => handleToggle(c.id)}
                                                        title={c.active ? 'Disable' : 'Enable'}
                                                        className={`p-1.5 rounded-lg transition-colors ${c.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                                    >
                                                        {c.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                    </button>
                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => openEdit(c)}
                                                        title="Edit"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => setDeleteTarget(c)}
                                                        title="Delete"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded details row */}
                                        {expanded.has(c.id) && (
                                            <tr className="bg-gray-50/60">
                                                <td colSpan={7} className="px-5 py-3">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                                                        <div>
                                                            <span className="font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Min Order</span>
                                                            {c.minimumOrderAmount ? formatCurrency(c.minimumOrderAmount) : '—'}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Per Customer Limit</span>
                                                            {c.perCustomerLimit ?? '∞'}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Created</span>
                                                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                                                        </div>
                                                        {c.customerEligibility === 'SELECTED_CUSTOMERS' && (
                                                            <div className="col-span-2 md:col-span-1">
                                                                <span className="font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Eligible Emails</span>
                                                                <ul className="space-y-0.5">
                                                                    {(c.eligibleCustomerEmails ?? []).map(e => (
                                                                        <li key={e}>{e}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Slide-in Form Panel */}
            {panelOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={closePanel} />
                    {/* Panel */}
                    <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editing ? 'Edit Promo Code' : 'Create Promo Code'}
                            </h2>
                            <button onClick={closePanel} className="text-gray-400 hover:text-gray-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-6 py-5 flex-1">
                            {formError && (
                                <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                                    {formError}
                                </div>
                            )}
                            <PromoForm
                                initial={editing}
                                onSave={handleSave}
                                onCancel={closePanel}
                                saving={saving}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Promo Code"
                message={`Are you sure you want to permanently delete the code "${deleteTarget?.code}"? This action cannot be undone.`}
                confirmLabel={deleting ? 'Deleting…' : 'Delete'}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                danger
            />
        </div>
    );
};

export default AdminPromoCodes;
