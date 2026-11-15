import React, { useState } from 'react';
import ChatMessageItem from './ChatMessageItem';
import ChatInput from './ChatInput';

const ChatWindow = ({
  isOpen,
  onClose,
  messages = [],
  loading = false,
  onSend,
  onClear,
  messagesEndRef,
  geminiApiKey = '',
  onSaveGeminiKey,
  isGeminiActive = false,
  showSettings = false,
  setShowSettings,
}) => {
  const [localKey, setLocalKey] = useState(geminiApiKey || '');

  if (!isOpen) return null;

  // Find dynamic suggestions from the latest bot message if available
  const lastBotMsg = [...messages].reverse().find((m) => m.sender === 'bot' && m.suggestions);
  const dynamicSuggestions = lastBotMsg?.suggestions || null;

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (onSaveGeminiKey) {
      onSaveGeminiKey(localKey);
    }
    if (setShowSettings) {
      setShowSettings(false);
    }
  };

  const handleClearKey = () => {
    setLocalKey('');
    if (onSaveGeminiKey) {
      onSaveGeminiKey('');
    }
  };

  return (
    <div 
      className="fixed bottom-5 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] rounded-3xl shadow-2xl border border-gray-200/80 bg-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
      style={{ height: '580px', maxHeight: '88vh' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center shadow-md relative">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-lg shadow-inner">
              🤖
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-600 rounded-full animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm leading-tight text-white">iCrowd AI Assistant</h3>
              {isGeminiActive && geminiApiKey ? (
                <span className="text-[10px] bg-purple-400/30 text-purple-100 font-semibold px-2 py-0.5 rounded-full border border-purple-300/40 backdrop-blur-xs flex items-center gap-1">
                  ✨ Gemini
                </span>
              ) : (
                <span className="text-[10px] bg-white/20 text-white font-medium px-1.5 py-0.2 rounded-full backdrop-blur-xs">
                  Online
                </span>
              )}
            </div>
            <p className="text-[11px] text-blue-100 font-normal">Smartphones & Store Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Gemini AI Settings Toggle Button */}
          <button
            onClick={() => setShowSettings && setShowSettings(!showSettings)}
            title="Google Gemini AI Settings"
            className={`p-1.5 rounded-lg transition-all text-xs cursor-pointer active:scale-95 flex items-center gap-1 ${
              showSettings || (isGeminiActive && geminiApiKey)
                ? 'bg-white/25 text-amber-300 shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}
          >
            <span className="text-sm">✨</span>
            <span className="hidden sm:inline text-[10px] font-semibold">AI Tool</span>
          </button>

          <button
            onClick={onClear}
            title="Clear chat"
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition-all text-xs cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onClose}
            aria-label="Close Chat"
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition-all text-sm font-bold cursor-pointer active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* External AI Settings Panel (Slide-down) */}
      {showSettings && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border-b border-indigo-100 p-3.5 space-y-2.5 animate-in slide-in-from-top-3 duration-200 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">✨</span>
              <h4 className="font-bold text-xs text-indigo-950">Google Gemini AI Engine (External AI)</h4>
            </div>
            <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full font-medium">
              Gemini 1.5 Flash
            </span>
          </div>

          <p className="text-[11px] text-gray-600 leading-relaxed">
            Google AI Studio මගින් නොමිලේ ලබාගත හැකි <strong>Gemini API Key</strong> එක ඇතුළත් කර Chatbot එකට සජීවී AI බුද්ධිය එක්කර ගන්න.
          </p>

          <form onSubmit={handleSaveKey} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <input
                type="password"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="AIzaSy... (Paste Gemini API Key)"
                className="flex-1 bg-white border border-indigo-200 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none shadow-xs font-mono"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
              >
                Save
              </button>
              {geminiApiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700 font-medium px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  title="Remove Key"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline font-medium inline-flex items-center gap-1"
              >
                🔑 Get Free API Key at Google AI Studio ↗
              </a>
              <span className="text-gray-500 text-[10px]">
                {geminiApiKey ? '✅ Key Saved' : '⚪ Using Smart Local Engine'}
              </span>
            </div>
          </form>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50/60 flex flex-col gap-3.5">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs shadow-xs flex-shrink-0">
              🤖
            </div>
            <div className="bg-white text-gray-500 border border-gray-200/90 rounded-2xl rounded-tl-xs p-3 shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input row & quick suggestion pills */}
      <ChatInput 
        onSend={onSend} 
        loading={loading} 
        dynamicSuggestions={dynamicSuggestions} 
      />
    </div>
  );
};

export default ChatWindow;
