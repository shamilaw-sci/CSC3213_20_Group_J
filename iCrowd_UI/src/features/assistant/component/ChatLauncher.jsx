import React from 'react';

/**
 * Floating button to open/toggle the AI Assistant chat window.
 */
const ChatLauncher = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Mini Tooltip Badge */}
      <div 
        onClick={onClick}
        className="hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-blue-200/80 shadow-lg px-3.5 py-2 rounded-full cursor-pointer hover:border-blue-400 transition-all transform hover:-translate-x-1 group"
      >
        <span className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Need Help? Ask AI
        </span>
        <span className="text-xs">✨</span>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onClick}
        aria-label="Open AI Assistant"
        className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-108 active:scale-95 flex items-center justify-center cursor-pointer group relative"
      >
        {/* Pulse ping */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
        </span>

        {/* Bot Icon */}
        <svg
          className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    </div>
  );
};

export default ChatLauncher;
