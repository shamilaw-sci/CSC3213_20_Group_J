import { useState, useEffect, useCallback } from 'react';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../api/categoryAdminApi';

export const useAdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllCategories();
            setCategories(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleCreate = async (categoryData) => {
        const created = await createCategory(categoryData);
        await fetchCategories();
        return created;
    };

    const handleUpdate = async (id, categoryData) => {
        const updated = await updateCategory(id, categoryData);
        await fetchCategories();
        return updated;
    };

    const handleDelete = async (id) => {
        await deleteCategory(id);
        await fetchCategories();
    };

    return {
        categories,
        loading,
        error,
        handleCreate,
        handleUpdate,
        handleDelete,
        refresh: fetchCategories,
    };
};
