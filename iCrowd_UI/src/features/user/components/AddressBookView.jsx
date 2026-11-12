import React, { useState } from 'react';

/**
 * AddressBookView Component
 * Dedicated full view for managing all customer delivery addresses,
 * with clear error handling and rollback status reporting.
 */
const AddressBookView = ({
    addresses,
    error: propError,
    onAddClick,
    onEditAddress,
    onDeleteAddress,
    onSetDefault
}) => {
    const [actionError, setActionError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const handleSetDefault = async (id) => {
        setActionError(null);
        setBusyId(id);
        try {
            await onSetDefault(id);
        } catch (err) {
            setActionError(err.message || 'Failed to update default address.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (id) => {
        setActionError(null);
        setBusyId(id);
        try {
            await onDeleteAddress(id);
        } catch (err) {
            setActionError(err.message || 'Failed to delete address.');
        } finally {
            setBusyId(null);
        }
    };

    const displayError = actionError || propError;

    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Address Book</h3>
                    <p className="text-xs text-gray-500">Manage your delivery and billing locations</p>
                </div>
                <button
                    type="button"
                    onClick={onAddClick}
                    className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    + Add New Address
                </button>
            </div>

            {/* Error Notification */}
            {displayError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{displayError}</span>
                    </div>
                    {actionError && (
                        <button
                            type="button"
                            onClick={() => setActionError(null)}
                            className="text-red-500 hover:text-red-800 font-bold ml-2 cursor-pointer"
                        >
                            &times;
                        </button>
                    )}
                </div>
            )}

            {/* Address List */}
            {addresses.length === 0 ? (
                <div className="py-12 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">No addresses saved yet</p>
                    <p className="text-xs text-gray-500 mb-4">Add your shipping address for quicker checkout.</p>
                    <button
                        onClick={onAddClick}
                        className="text-xs font-semibold bg-black text-white px-4 py-2 rounded-xl cursor-pointer"
                    >
                        Add Address
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div
                            key={addr.id}
                            className={`border rounded-2xl p-5 flex flex-col justify-between transition-all relative ${
                                addr.isDefault
                                    ? 'border-black bg-gray-50/40 shadow-sm ring-1 ring-black'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-gray-900">{addr.recipientName}</span>
                                        <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                                            {addr.label || 'Home'}
                                        </span>
                                    </div>
                                    {addr.isDefault && (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                            DEFAULT
                                        </span>
                                    )}
                                </div>

                                <div className="text-xs text-gray-600 space-y-1 my-3">
                                    <p className="font-medium text-gray-800">{addr.address}</p>
                                    <p>{addr.city}, {addr.district} {addr.postalCode ? `- ${addr.postalCode}` : ''}</p>
                                    <p>{addr.province || 'Sri Lanka'}</p>
                                    <p className="text-gray-500 pt-1">
                                        Phone: <span className="font-semibold text-gray-700">{addr.phone}</span>
                                    </p>
                                    {addr.latitude && addr.longitude && (
                                        <p className="text-[11px] font-mono text-gray-400 pt-1 flex items-center gap-1">
                                            <span>📍</span> {parseFloat(addr.latitude).toFixed(4)}, {parseFloat(addr.longitude).toFixed(4)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                {!addr.isDefault ? (
                                    <button
                                        type="button"
                                        disabled={busyId === addr.id}
                                        onClick={() => handleSetDefault(addr.id)}
                                        className="text-gray-600 hover:text-black font-medium hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                        {busyId === addr.id ? 'Setting...' : 'Set as default'}
                                    </button>
                                ) : (
                                    <span className="text-emerald-600 font-medium text-[11px]">Primary delivery address</span>
                                )}

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        disabled={busyId === addr.id}
                                        onClick={() => onEditAddress(addr)}
                                        className="font-semibold text-gray-700 hover:text-black hover:underline cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busyId === addr.id}
                                        onClick={() => handleDelete(addr.id)}
                                        className="font-semibold text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                        {busyId === addr.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddressBookView;