import React, { useState } from 'react';

const SUGGESTIONS = [
  '📱 iPhone 15 Pro',
  '📱 Samsung S24 Ultra',
  '📸 Best Camera Phones',
  '🎮 Gaming Phones',
  '💰 Under Rs 150k',
  '⚡ 140W Chargers',
  '🛡️ Phone Cases',
];

const ChatInput = ({ onSend, loading }) => {
  const [input, setInput] = useState('');

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
    <div className="p-3 border-t border-gray-200 bg-white space-y-2">
      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SUGGESTIONS.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSuggestionClick(sug)}
            disabled={loading}
            className="text-[11px] font-medium whitespace-nowrap px-3 py-1 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 text-gray-700 transition-all disabled:opacity-50 flex-shrink-0 cursor-pointer"
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
          placeholder="Ask for iPhone, Samsung, Budget, or Accessories..."
          disabled={loading}
          className="flex-1 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-full px-4 py-2.5 text-gray-900 placeholder-gray-400 text-sm outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white shadow-md transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
