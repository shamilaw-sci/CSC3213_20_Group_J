import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getAllProductsAdmin,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../api/productAdminApi';

export const useAdminProducts = (keyword = '') => {
    const requestId = useRef(0);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalPages: 0, totalElements: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProducts = useCallback(async (page = 0) => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const data = await getAllProductsAdmin(page, pagination.size, keyword);
            if (id !== requestId.current) return;
            setProducts(data.content || []);
            setPagination(prev => ({
                ...prev,
                page: data.number,
                totalPages: data.totalPages,
                totalElements: data.totalElements,
            }));
        } catch (err) {
            if (id === requestId.current) setError(err.response?.data?.message || 'Failed to load products');
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [pagination.size, keyword]);

    useEffect(() => {
        fetchProducts(0);
    }, [fetchProducts]);

    const handleCreate = async (productData) => {
        const created = await createProduct(productData);
        await fetchProducts(pagination.page);
        return created;
    };

    const handleUpdate = async (id, productData) => {
        const updated = await updateProduct(id, productData);
        await fetchProducts(pagination.page);
        return updated;
    };

    const handleDelete = async (id) => {
        await deleteProduct(id);
        await fetchProducts(pagination.page);
    };

    const goToPage = (page) => fetchProducts(page);

    return {
        products,
        pagination,
        loading,
        error,
        handleCreate,
        handleUpdate,
        handleDelete,
        goToPage,
        refresh: () => fetchProducts(pagination.page),
    };
};
