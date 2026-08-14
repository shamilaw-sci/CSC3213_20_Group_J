import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        district: '',
        city: '',
        role: 'USER'
    });
    const [successMessage, setSuccessMessage] = useState('');
    const { register, loading, error } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        try {
            await register(formData);
            setSuccessMessage('Registration successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            // Error is handled in useAuth
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white border border-gray-300 p-8 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-black text-gray-900 mb-6 text-center tracking-tight">Create Account</h2>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl mb-6 text-sm">
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">First Name</label>
                        <input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">Last Name</label>
                        <input id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input id="email" type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                        <input id="password" type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">Phone Number</label>
                        <input id="phone" name="phone" required value={formData.phone} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="district">District</label>
                        <input id="district" name="district" required value={formData.district} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="city">City</label>
                        <input id="city" name="city" required value={formData.city} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">Address</label>
                        <input id="address" name="address" required value={formData.address} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">Account Type</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full bg-surface border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                            <option value="USER">Customer</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 text-lg mt-4"
                >
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>

            <p className="mt-6 text-center text-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-black transition-colors font-medium">
                    Sign in here
                </Link>
            </p>
        </div>
    );
};

export default RegisterForm;
