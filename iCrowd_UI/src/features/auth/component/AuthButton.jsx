import React from 'react';

/**
 * Dumb Component: AuthButton
 * Reusable submit/action button with loading spinners and styled states.
 */
const AuthButton = ({
    type = 'submit',
    loading = false,
    loadingText = 'Please wait...',
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    className = ''
}) => {
    const baseStyles = "w-full font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-base shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";
    
    const variantStyles = {
        primary: "bg-primary hover:bg-primary/90 text-white shadow-primary/20 hover:shadow-primary/30 active:scale-[0.99]",
        secondary: "bg-gray-800 hover:bg-gray-700 text-white shadow-gray-800/20 active:scale-[0.99]",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${className}`}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span>{loading ? loadingText : children}</span>
        </button>
    );
};

export default AuthButton;
