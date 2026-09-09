import { useState, useEffect, useCallback } from 'react';
import { getAllUsers, promoteUser, demoteUser, deleteUser } from '../api/adminUserApi';

export const useAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handlePromote = async (id) => {
        await promoteUser(id);
        await fetchUsers();
    };

    const handleDemote = async (id) => {
        await demoteUser(id);
        await fetchUsers();
    };

    const handleDelete = async (id) => {
        await deleteUser(id);
        await fetchUsers();
    };

    return {
        users,
        loading,
        error,
        handlePromote,
        handleDemote,
        handleDelete,
        refresh: fetchUsers,
    };
};
