import React from 'react';
import { Link } from 'react-router-dom';
import { useRegisterForm } from '../hooks/useRegisterForm';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import AuthAlert from './AuthAlert';

/**
 * Presentational & Container Component: RegisterForm
 * For Public Customer Registration only. (Role selection is removed/restricted).
 */
const RegisterForm = () => {
    const {
        formData,
        loading,
        error,
        successMessage,
        handleChange,
        handleSubmit
    } = useRegisterForm();

    return (
        <div className="w-full max-w-2xl mx-auto bg-white border border-gray-200 p-8 md:p-10 rounded-2xl shadow-xl">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Customer Account</h2>
                <p className="text-gray-500 text-sm mt-1">Join iCrowd to browse and purchase exclusive products</p>
            </div>

            <AuthAlert type="error" message={error} />
            <AuthAlert type="success" message={successMessage} />

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <AuthInput
                        id="firstName"
                        name="firstName"
                        label="First Name"
                        placeholder="John"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        placeholder="Doe"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="email"
                        name="email"
                        type="email"
                        label="Email Address"
                        placeholder="john.doe@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="password"
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="Minimum 6 characters"
                        required
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="phone"
                        name="phone"
                        type="tel"
                        label="Phone Number"
                        placeholder="+94 7X XXX XXXX"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="district"
                        name="district"
                        label="District"
                        placeholder="e.g. Colombo"
                        required
                        value={formData.district}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="city"
                        name="city"
                        label="City"
                        placeholder="e.g. Nugegoda"
                        required
                        value={formData.city}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="address"
                        name="address"
                        label="Street Address"
                        placeholder="123, Main Street"
                        required
                        value={formData.address}
                        onChange={handleChange}
                    />
                </div>

                <div className="pt-4">
                    <AuthButton
                        type="submit"
                        loading={loading}
                        loadingText="Creating Account..."
                    >
                        Register as Customer
                    </AuthButton>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-black transition-colors font-semibold">
                    Sign in here
                </Link>
            </div>
        </div>
    );
};

export default RegisterForm;
