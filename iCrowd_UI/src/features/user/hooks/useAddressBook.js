import { useState, useEffect, useCallback, useRef } from 'react';
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
 * multiple address support, default address management, atomic rollback on failure,
 * and security cleanup on logout/account switch.
 */
export const useAddressBook = (user) => {
    const userIdentifier = user ? (user.id || user.email) : null;
    const storageKey = userIdentifier ? `user_addresses_${userIdentifier}` : null;
    const prevUserRef = useRef(userIdentifier);

    const [addresses, setAddresses] = useState(() => {
        if (!userIdentifier || !storageKey) return [];
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load saved addresses", e);
        }
        return [];
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Reset state and wipe storage when user logs out or switches accounts
    useEffect(() => {
        if (prevUserRef.current !== userIdentifier) {
            if (!userIdentifier) {
                setAddresses([]);
                if (storageKey) {
                    try {
                        localStorage.removeItem(storageKey);
                    } catch (e) {
                        // ignore storage errors
                    }
                }
            } else {
                setAddresses([]);
            }
            prevUserRef.current = userIdentifier;
            setError(null);
        }
    }, [userIdentifier, storageKey]);

    const loadAddresses = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token || !userIdentifier) {
            setAddresses([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const backendAddresses = await fetchUserAddresses();
            if (Array.isArray(backendAddresses)) {
                setAddresses(backendAddresses);
                if (storageKey) {
                    localStorage.setItem(storageKey, JSON.stringify(backendAddresses));
                }
            }
        } catch (err) {
            console.warn("Could not fetch addresses from backend:", err?.message);
        } finally {
            setLoading(false);
        }
    }, [userIdentifier, storageKey]);

    useEffect(() => {
        if (userIdentifier) {
            loadAddresses();
        }
    }, [userIdentifier, loadAddresses]);

    // Save to localStorage whenever addresses change and user is logged in
    useEffect(() => {
        if (!userIdentifier || !storageKey) return;
        try {
            if (addresses.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(addresses));
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch (e) {
            console.error("Failed to persist addresses", e);
        }
    }, [addresses, userIdentifier, storageKey]);

    const addAddress = async (newAddr) => {
        setError(null);
        const previousSnapshot = [...addresses];
        const tempId = 'temp_' + Date.now();
        const addressToAdd = {
            ...newAddr,
            id: tempId,
            isDefault: addresses.length === 0 || newAddr.isDefault
        };

        // Optimistic UI update
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
            throw new Error("Invalid address received from server");
        } catch (err) {
            // Roll back optimistic changes immediately
            setAddresses(previousSnapshot);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save address';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    };

    const updateAddress = async (id, updatedData) => {
        setError(null);
        const previousSnapshot = [...addresses];

        // Optimistic UI update
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

        if (id && !String(id).startsWith('temp_') && !String(id).startsWith('addr-')) {
            try {
                const res = await updateUserAddress(id, updatedData);
                const updated = res.address || res;
                if (updated) {
                    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
                    return updated;
                }
                throw new Error("Invalid address update response");
            } catch (err) {
                // Roll back optimistic changes
                setAddresses(previousSnapshot);
                const errorMsg = err.response?.data?.message || err.message || 'Failed to update address';
                setError(errorMsg);
                throw new Error(errorMsg);
            }
        }
    };

    const deleteAddress = async (id) => {
        setError(null);
        const previousSnapshot = [...addresses];

        // Optimistic UI update
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
                // Roll back optimistic changes
                setAddresses(previousSnapshot);
                const errorMsg = err.response?.data?.message || err.message || 'Failed to delete address';
                setError(errorMsg);
                throw new Error(errorMsg);
            }
        }
    };

    const setDefaultAddress = async (id) => {
        setError(null);
        const previousSnapshot = [...addresses];

        // Optimistic UI update
        setAddresses(prev =>
            prev.map(a => ({
                ...a,
                isDefault: a.id === id
            }))
        );

        if (id && !String(id).startsWith('temp_') && !String(id).startsWith('addr-')) {
            try {
                const res = await setDefaultUserAddress(id);
                const updated = res.address || res;
                if (updated) {
                    setAddresses(prev => prev.map(a => ({
                        ...a,
                        isDefault: a.id === id
                    })));
                }
            } catch (err) {
                // Roll back optimistic changes
                setAddresses(previousSnapshot);
                const errorMsg = err.response?.data?.message || err.message || 'Failed to set default address';
                setError(errorMsg);
                throw new Error(errorMsg);
            }
        }
    };

    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

    return {
        addresses,
        defaultAddress,
        loading,
        error,
        clearError: () => setError(null),
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        refreshAddresses: loadAddresses
    };
};

export default useAddressBook;
