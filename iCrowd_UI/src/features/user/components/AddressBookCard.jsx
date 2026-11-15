import React from 'react';

/**
 * AddressBookCard Component
 * Summary card for Address Book on the Manage My Account dashboard.
 */
const AddressBookCard = ({
    addresses = [],
    defaultAddress,
    onAddClick,
    onEditAddress,
    onManageAllClick
}) => {
    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">Address Book</span>
                        <span className="text-gray-300">|</span>
                        <button
                            type="button"
                            onClick={onManageAllClick}
                            className="text-xs font-semibold text-gray-600 hover:text-black transition-colors"
                        >
                            View All ({addresses.length})
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onAddClick}
                        className="text-xs font-bold text-black hover:underline uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                    >
                        <span>+</span> ADD
                    </button>
                </div>

                {/* Content */}
                {addresses.length === 0 ? (
                    <div className="py-8 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">No delivery address saved yet.</p>
                        <button
                            onClick={onAddClick}
                            className="text-xs font-semibold text-white bg-black px-4 py-1.5 rounded-lg shadow-sm hover:bg-gray-800"
                        >
                            Add Address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Default Delivery Address */}
                        {defaultAddress && (
                            <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-3.5 relative">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-900">
                                            {defaultAddress.recipientName}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded">
                                            {defaultAddress.label || 'Home'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                                        DEFAULT DELIVERY ADDRESS
                                    </span>
                                </div>

                                <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                                    {defaultAddress.address}, {defaultAddress.city}, {defaultAddress.district}
                                    {defaultAddress.postalCode && ` - ${defaultAddress.postalCode}`}
                                </p>

                                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-200/40">
                                    <span>Phone: <strong className="text-gray-700">{defaultAddress.phone}</strong></span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onEditAddress(defaultAddress)}
                                            className="text-gray-700 hover:text-black font-semibold"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other Addresses Preview */}
                        {addresses.filter(a => !a.isDefault).slice(0, 1).map((addr) => (
                            <div key={addr.id} className="border border-gray-100 rounded-xl p-3 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-800">{addr.recipientName} ({addr.label})</span>
                                    <button
                                        type="button"
                                        onClick={() => onEditAddress(addr)}
                                        className="text-[11px] font-semibold text-gray-500 hover:text-black"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <p className="text-gray-500 truncate">{addr.address}, {addr.city}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom link */}
            <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">{addresses.length} saved location(s)</span>
                <button
                    type="button"
                    onClick={onManageAllClick}
                    className="text-xs font-semibold text-black hover:underline"
                >
                    Manage Address Book &rarr;
                </button>
            </div>
        </div>
    );
};

export default AddressBookCard;
