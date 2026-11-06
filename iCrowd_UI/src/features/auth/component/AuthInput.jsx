import React from 'react';

/**
 * Dumb Component: AuthInput
 * Reusable form input with consistent styling, labels, and error indicators.
 */
const AuthInput = ({
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    disabled = false,
    error = null,
    className = ''
}) => {
    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label htmlFor={id || name} className="block text-sm font-semibold text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                id={id || name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
};

export default AuthInput;
