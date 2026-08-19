import React from 'react';

/**
 * Dumb Component: AuthAlert
 * Reusable alert banner for errors, success messages, and notices.
 */
const AuthAlert = ({ type = 'error', message }) => {
    if (!message) return null;

    const styles = {
        error: "bg-red-50 border-red-200 text-red-700",
        success: "bg-green-50 border-green-200 text-green-700",
        info: "bg-blue-50 border-blue-200 text-blue-700"
    };

    const icons = {
        error: (
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        success: (
            <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    };

    return (
        <div className={`border rounded-xl px-4 py-3 text-sm flex items-start space-x-3 mb-6 transition-all duration-200 ${styles[type] || styles.error}`}>
            {icons[type]}
            <div className="font-medium leading-relaxed">{message}</div>
        </div>
    );
};

export default AuthAlert;
