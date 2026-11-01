import { useState, useEffect, useCallback } from 'react';
import { getAllUsers, promoteUser, demoteUser, deactivateUser, reactivateUser } from '../api/adminUserApi';

export const useAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalPages: 0, totalElements: 0 });
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async (page = 0, searchTerm = search, role = roleFilter) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllUsers(page, pagination.size, searchTerm, role);
            setUsers(data.content || []);
            setPagination(prev => ({
                ...prev,
                page: data.number,
                totalPages: data.totalPages,
                totalElements: data.totalElements,
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [pagination.size, search, roleFilter]);

    useEffect(() => {
        fetchUsers(0);
    }, []);

    const handleSearch = (term) => {
        setSearch(term);
        fetchUsers(0, term, roleFilter);
    };

    const handleRoleFilter = (role) => {
        setRoleFilter(role);
        fetchUsers(0, search, role);
    };

    const handlePromote = async (id, password) => {
        await promoteUser(id, password);
        await fetchUsers(pagination.page);
    };

    const handleDemote = async (id) => {
        await demoteUser(id);
        await fetchUsers(pagination.page);
    };

    const handleDelete = async (id) => {
        await deactivateUser(id);
        await fetchUsers(pagination.page);
    };

    const handleReactivate = async (id) => {
        await reactivateUser(id);
        await fetchUsers(pagination.page);
    };

    const goToPage = (page) => fetchUsers(page);

    return {
        users,
        pagination,
        loading,
        error,
        search,
        roleFilter,
        handleSearch,
        handleRoleFilter,
        handlePromote,
        handleDemote,
        handleDelete,
        handleReactivate,
        goToPage,
        refresh: () => fetchUsers(pagination.page),
    };
};
