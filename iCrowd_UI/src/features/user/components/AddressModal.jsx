import React, { useState, useEffect } from 'react';
import InteractiveMapPicker from './InteractiveMapPicker';

/**
 * AddressModal Component
 * Form modal for adding or editing a delivery address with interactive map picker,
 * comprehensive validation (phone, field lengths, coordinates),
 * and clear error display upon backend failure.
 */
const AddressModal = ({
    isOpen,
    onClose,
    onSave,
    addressToEdit = null
}) => {
    const [formData, setFormData] = useState({
        label: 'Home',
        recipientName: '',
        phone: '',
        address: '',
        city: '',
        district: 'Colombo',
        province: 'Western Province',
        postalCode: '',
        latitude: 6.9271,
        longitude: 79.8612,
        isDefault: false
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        if (addressToEdit) {
            setFormData({
                label: addressToEdit.label || 'Home',
                recipientName: addressToEdit.recipientName || '',
                phone: addressToEdit.phone || '',
                address: addressToEdit.address || '',
                city: addressToEdit.city || '',
                district: addressToEdit.district || 'Colombo',
                province: addressToEdit.province || 'Western Province',
                postalCode: addressToEdit.postalCode || '',
                latitude: addressToEdit.latitude || 6.9271,
                longitude: addressToEdit.longitude || 79.8612,
                isDefault: !!addressToEdit.isDefault
            });
        } else {
            setFormData({
                label: 'Home',
                recipientName: '',
                phone: '',
                address: '',
                city: '',
                district: 'Colombo',
                province: 'Western Province',
                postalCode: '',
                latitude: 6.9271,
                longitude: 79.8612,
                isDefault: false
            });
        }
        setErrors({});
        setSubmitError(null);
        setSubmitting(false);
    }, [addressToEdit, isOpen]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};

        // Recipient Name validation
        const trimmedName = formData.recipientName.trim();
        if (!trimmedName) {
            newErrors.recipientName = 'Recipient name is required';
        } else if (trimmedName.length > 100) {
            newErrors.recipientName = 'Recipient name must not exceed 100 characters';
        }

        // Phone validation
        const cleanPhone = formData.phone.trim().replace(/[\s-]/g, '');
        if (!cleanPhone) {
            newErrors.phone = 'Mobile number is required';
        } else if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
            newErrors.phone = 'Invalid phone number. Must contain 7 to 15 digits (e.g. +94771234567)';
        }

        // Address validation
        const trimmedAddress = formData.address.trim();
        if (!trimmedAddress) {
            newErrors.address = 'Street address is required';
        } else if (trimmedAddress.length > 255) {
            newErrors.address = 'Street address must not exceed 255 characters';
        }

        // City validation
        const trimmedCity = formData.city.trim();
        if (!trimmedCity) {
            newErrors.city = 'City is required';
        } else if (trimmedCity.length > 100) {
            newErrors.city = 'City must not exceed 100 characters';
        }

        // Postal code validation (optional but format check)
        if (formData.postalCode && formData.postalCode.trim()) {
            if (formData.postalCode.trim().length > 20) {
                newErrors.postalCode = 'Postal code must not exceed 20 characters';
            } else if (!/^[0-9A-Za-z -]{0,20}$/.test(formData.postalCode.trim())) {
                newErrors.postalCode = 'Invalid postal code format';
            }
        }

        // Coordinates validation
        if (formData.latitude != null) {
            const lat = Number(formData.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                newErrors.coordinates = 'Latitude must be between -90 and 90';
            }
        }
        if (formData.longitude != null) {
            const lng = Number(formData.longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                newErrors.coordinates = 'Longitude must be between -180 and 180';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        if (submitError) setSubmitError(null);
    };

    const handleCoordinatesChange = (lat, lng) => {
        setFormData(prev => ({
            ...prev,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
        }));
        if (errors.coordinates) {
            setErrors(prev => ({ ...prev, coordinates: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        if (!validate()) return;

        setSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setSubmitError(err.response?.data?.message || err.message || 'Failed to save address. Please check your details.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {addressToEdit ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                    {/* Error Banner */}
                    {submitError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{submitError}</span>
                        </div>
                    )}

                    {/* Label & Recipient Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Address Label <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                            </label>
                            <div className="flex gap-2">
                                {['Home', 'Work', 'Office', 'Other'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, label: type }))}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                            formData.label === type
                                                ? 'bg-black text-white border-black shadow-sm'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Recipient Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="recipientName"
                                maxLength={100}
                                value={formData.recipientName}
                                onChange={handleChange}
                                placeholder="e.g. John Silva"
                                className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                                    errors.recipientName ? 'border-red-400 bg-red-50/40' : 'border-gray-300 bg-white'
                                }`}
                            />
                            {errors.recipientName && (
                                <p className="text-red-500 text-xs mt-1">{errors.recipientName}</p>
                            )}
                        </div>
                    </div>

                    {/* Mobile & Street Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="phone"
                                maxLength={20}
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. +94 77 123 4567"
                                className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                                    errors.phone ? 'border-red-400 bg-red-50/40' : 'border-gray-300 bg-white'
                                }`}
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Street Address / Line 1 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="address"
                                maxLength={255}
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="e.g. 123 Main Street"
                                className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                                    errors.address ? 'border-red-400 bg-red-50/40' : 'border-gray-300 bg-white'
                                }`}
                            />
                            {errors.address && (
                                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                            )}
                        </div>
                    </div>

                    {/* City, District, Province, Postal Code */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                City <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="city"
                                maxLength={100}
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="e.g. Colombo"
                                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                                    errors.city ? 'border-red-400 bg-red-50/40' : 'border-gray-300 bg-white'
                                }`}
                            />
                            {errors.city && (
                                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                District
                            </label>
                            <select
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="Colombo">Colombo</option>
                                <option value="Gampaha">Gampaha</option>
                                <option value="Kalutara">Kalutara</option>
                                <option value="Kandy">Kandy</option>
                                <option value="Galle">Galle</option>
                                <option value="Matara">Matara</option>
                                <option value="Kurunegala">Kurunegala</option>
                                <option value="Jaffna">Jaffna</option>
                                <option value="Anuradhapura">Anuradhapura</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Province
                            </label>
                            <select
                                name="province"
                                value={formData.province}
                                onChange={handleChange}
                                className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="Western Province">Western</option>
                                <option value="Central Province">Central</option>
                                <option value="Southern Province">Southern</option>
                                <option value="North Western">North Western</option>
                                <option value="Northern Province">Northern</option>
                                <option value="Eastern Province">Eastern</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Postal Code
                            </label>
                            <input
                                type="text"
                                name="postalCode"
                                maxLength={20}
                                value={formData.postalCode}
                                onChange={handleChange}
                                placeholder="00300"
                                className={`w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black ${
                                    errors.postalCode ? 'border-red-400 bg-red-50/40' : 'border-gray-300'
                                }`}
                            />
                            {errors.postalCode && (
                                <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>
                            )}
                        </div>
                    </div>

                    {/* Interactive Map Picker */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Pin Delivery Location on Map
                        </label>
                        <InteractiveMapPicker
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            onChange={handleCoordinatesChange}
                        />
                        {errors.coordinates && (
                            <p className="text-red-500 text-xs mt-1">{errors.coordinates}</p>
                        )}
                    </div>

                    {/* Default Address Checkbox */}
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isDefaultCheckbox"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={handleChange}
                            className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black cursor-pointer"
                        />
                        <label htmlFor="isDefaultCheckbox" className="text-xs font-medium text-gray-700 cursor-pointer">
                            Set as default delivery address
                        </label>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {submitting ? 'Saving Address...' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;
