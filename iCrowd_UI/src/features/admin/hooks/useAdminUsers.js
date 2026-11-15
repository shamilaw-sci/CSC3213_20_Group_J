import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../../products/hooks/useDebounce';
import { getAllUsers, promoteUser, demoteUser, deactivateUser, reactivateUser } from '../api/adminUserApi';

export const useAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalPages: 0, totalElements: 0 });
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedSearch = useDebounce(search,300);
    const requestId = useRef(0);
    const fetchUsers = useCallback(async (page = 0, searchTerm = debouncedSearch, role = roleFilter) => {
        const id=++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const data = await getAllUsers(page, pagination.size, searchTerm, role);
            if(id!==requestId.current) return;
            setUsers(data.content || []);
            setPagination(prev => ({
                ...prev,
                page: data.number,
                totalPages: data.totalPages,
                totalElements: data.totalElements,
            }));
        } catch (err) {
            if(id===requestId.current) setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            if(id===requestId.current) setLoading(false);
        }
    }, [pagination.size, debouncedSearch, roleFilter]);

    useEffect(() => {
        fetchUsers(0);
    }, [fetchUsers]);

    const handleSearch = (term) => {
        setSearch(term);

    };

    const handleRoleFilter = (role) => {
        setRoleFilter(role);

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
