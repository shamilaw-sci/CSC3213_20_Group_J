import { useState, useEffect, useCallback } from 'react';
import {
    fetchUserAddresses,
    createUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultUserAddress
} from '../api/userApi';

/**
 * Custom Hook: useAddressBook
 * Manages customer delivery addresses with backend integration,
 * multiple address support, set default, add, edit, and delete operations.
 */
export const useAddressBook = (user) => {
    const storageKey = user ? `user_addresses_${user.id || user.email}` : 'user_addresses_default';

    const [addresses, setAddresses] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load saved addresses", e);
        }

        if (user && (user.address || user.city)) {
            return [
                {
                    id: 'addr-default',
                    label: 'Home',
                    recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer',
                    phone: user.phone || '+94 77 123 4567',
                    address: user.address || '123 Galle Road',
                    city: user.city || 'Colombo 03',
                    district: user.district || 'Colombo',
                    province: 'Western Province',
                    postalCode: '00300',
                    latitude: 6.9034,
                    longitude: 79.8546,
                    isDefault: true
                }
            ];
        }

        return [];
    });

    const [loading, setLoading] = useState(false);

    const loadAddresses = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        try {
            const backendAddresses = await fetchUserAddresses();
            if (Array.isArray(backendAddresses)) {
                setAddresses(backendAddresses);
                localStorage.setItem(storageKey, JSON.stringify(backendAddresses));
            }
        } catch (err) {
            console.warn("Could not fetch addresses from backend, using local state:", err?.message);
        } finally {
            setLoading(false);
        }
    }, [storageKey]);

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

    // Save to localStorage whenever addresses change
    useEffect(() => {
        if (addresses.length > 0) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(addresses));
            } catch (e) {
                console.error("Failed to save addresses", e);
            }
        }
    }, [addresses, storageKey]);

    const addAddress = async (newAddr) => {
        // Optimistic UI update
        const tempId = 'temp_' + Date.now();
        const addressToAdd = {
            ...newAddr,
            id: tempId,
            isDefault: addresses.length === 0 || newAddr.isDefault
        };

        setAddresses(prev => {
            if (addressToAdd.isDefault) {
                return [
                    addressToAdd,
                    ...prev.map(a => ({ ...a, isDefault: false }))
                ];
            }
            return [...prev, addressToAdd];
        });

        try {
            const res = await createUserAddress(newAddr);
            const saved = res.address || res;
            if (saved && saved.id) {
                setAddresses(prev => prev.map(a => a.id === tempId ? saved : a));
                return saved;
            }
        } catch (err) {
            console.warn("Backend add address failed, kept in local state:", err?.message);
        }
        return addressToAdd;
    };

    const updateAddress = async (id, updatedData) => {
        setAddresses(prev => {
            return prev.map(a => {
                if (a.id === id) {
                    return { ...a, ...updatedData };
                }
                if (updatedData.isDefault) {
                    return { ...a, isDefault: false };
                }
                return a;
            });
        });

        // Only call backend if id is a valid backend ID (numeric or long)
        if (id && !String(id).startsWith('temp_') && !String(id).startsWith('addr-')) {
            try {
                const res = await updateUserAddress(id, updatedData);
                const updated = res.address || res;
                if (updated) {
                    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
                }
            } catch (err) {
                console.warn("Backend update address failed:", err?.message);
            }
        }
    };

    const deleteAddress = async (id) => {
        setAddresses(prev => {
            const filtered = prev.filter(a => a.id !== id);
            if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
                filtered[0].isDefault = true;
            }
            return filtered;
        });

        if (id && !String(id).startsWith('temp_') && !String(id).startsWith('addr-')) {
            try {
                await deleteUserAddress(id);
            } catch (err) {
                console.warn("Backend delete address failed:", err?.message);
            }
        }
    };

    const setDefaultAddress = async (id) => {
        setAddresses(prev =>
            prev.map(a => ({
                ...a,
                isDefault: a.id === id
            }))
        );

        if (id && !String(id).startsWith('temp_') && !String(id).startsWith('addr-')) {
            try {
                await setDefaultUserAddress(id);
            } catch (err) {
                console.warn("Backend set default address failed:", err?.message);
            }
        }
    };

    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

    return {
        addresses,
        defaultAddress,
        loading,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        refreshAddresses: loadAddresses
    };
};

export default useAddressBook;
