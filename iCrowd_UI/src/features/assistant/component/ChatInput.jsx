import React, { useState } from 'react';

const SUGGESTIONS = [
  '🎧 Headsets',
  '🔋 PowerBanks',
  '🛡️ Phone Cases',
  '⚡ Fast Chargers',
  '🏷️ Best Deals',
  '🚚 Delivery Info',
  '🛡️ Warranty',
  '💳 Payment Options',
];

const ChatInput = ({ onSend, loading, dynamicSuggestions }) => {
  const [input, setInput] = useState('');

  const activeSuggestions = dynamicSuggestions && dynamicSuggestions.length > 0 
    ? dynamicSuggestions 
    : SUGGESTIONS;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
  };

  const handleSuggestionClick = (prompt) => {
    if (loading) return;
    const cleanPrompt = prompt.replace(/^[\p{Emoji}\s]+/u, '').trim();
    onSend(cleanPrompt);
  };

  return (
    <div className="p-3 border-t border-gray-100 bg-white space-y-2.5">
      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {activeSuggestions.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSuggestionClick(sug)}
            disabled={loading}
            className="text-[11px] font-medium whitespace-nowrap px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-800 border border-blue-200/60 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-xs"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for Headsets, PowerBanks, Delivery, Warranty..."
          disabled={loading}
          className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-full px-4 py-2.5 text-gray-800 placeholder-gray-400 text-xs sm:text-sm outline-none transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white shadow-md hover:shadow-lg transition-all transform active:scale-90 flex items-center justify-center flex-shrink-0 cursor-pointer"
          title="Send message"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
