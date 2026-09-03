import React from 'react';
import { Link } from 'react-router-dom';
import { useLoginForm } from '../hooks/useLoginForm';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import AuthAlert from './AuthAlert';

/**
 * Presentational & Container Component: LoginForm
 * Connects useLoginForm hook with reusable UI dumb components.
 */
const LoginForm = () => {
    const { credentials, loading, error, handleChange, handleSubmit } = useLoginForm();

    return (
        <div className="w-full max-w-md mx-auto bg-white border border-gray-200 p-8 md:p-10 rounded-2xl shadow-xl">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
                <p className="text-gray-500 text-sm mt-1">Sign in to manage your account and orders</p>
            </div>

            <AuthAlert type="error" message={error} />

            <form onSubmit={handleSubmit} className="space-y-5">
                <AuthInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="name@example.com"
                    required
                    value={credentials.email}
                    onChange={handleChange}
                />

                <AuthInput
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="Enter your password"
                    required
                    value={credentials.password}
                    onChange={handleChange}
                />

                <div className="pt-2">
                    <AuthButton
                        type="submit"
                        loading={loading}
                        loadingText="Signing In..."
                    >
                        Sign In
                    </AuthButton>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:text-black transition-colors font-semibold">
                    Create Customer Account
                </Link>
            </div>
        </div>
    );
};

export default LoginForm;
