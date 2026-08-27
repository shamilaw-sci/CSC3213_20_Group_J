import { useState, useEffect } from 'react';

/**
 * Custom Hook: useAddressBook
 * Manages customer delivery addresses with multiple address support,
 * set default, add, edit, and delete operations.
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

        // Default initial addresses based on user's profile if available
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

        return [
            {
                id: 'addr-1',
                label: 'Home',
                recipientName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'John Silva',
                phone: user?.phone || '+94 77 123 4567',
                address: user?.address || '123 Main Street',
                city: user?.city || 'Colombo 03',
                district: user?.district || 'Colombo',
                province: 'Western Province',
                postalCode: '00300',
                latitude: 6.9271,
                longitude: 79.8612,
                isDefault: true
            },
            {
                id: 'addr-2',
                label: 'Work',
                recipientName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'John Silva',
                phone: user?.phone || '+94 71 987 6543',
                address: '45 Office Road, Level 4',
                city: 'Colombo 02',
                district: 'Colombo',
                province: 'Western Province',
                postalCode: '00200',
                latitude: 6.9218,
                longitude: 79.8562,
                isDefault: false
            }
        ];
    });

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

    const addAddress = (newAddr) => {
        const id = 'addr_' + Date.now();
        const addressToAdd = {
            ...newAddr,
            id,
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
        return addressToAdd;
    };

    const updateAddress = (id, updatedData) => {
        setAddresses(prev => {
            let nextList = prev.map(a => {
                if (a.id === id) {
                    return { ...a, ...updatedData };
                }
                if (updatedData.isDefault) {
                    return { ...a, isDefault: false };
                }
                return a;
            });
            return nextList;
        });
    };

    const deleteAddress = (id) => {
        setAddresses(prev => {
            const filtered = prev.filter(a => a.id !== id);
            // If the deleted address was default, set the first one as default
            if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
                filtered[0].isDefault = true;
            }
            return filtered;
        });
    };

    const setDefaultAddress = (id) => {
        setAddresses(prev =>
            prev.map(a => ({
                ...a,
                isDefault: a.id === id
            }))
        );
    };

    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

    return {
        addresses,
        defaultAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress
    };
};

export default useAddressBook;
