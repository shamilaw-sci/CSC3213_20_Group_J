import React from 'react';
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
}) => {
  if (!isOpen) return null;

  // Find dynamic suggestions from the latest bot message if available
  const lastBotMsg = [...messages].reverse().find((m) => m.sender === 'bot' && m.suggestions);
  const dynamicSuggestions = lastBotMsg?.suggestions || null;

  return (
    <div 
      className="fixed bottom-5 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] rounded-3xl shadow-2xl border border-gray-200/80 bg-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
      style={{ height: '560px', maxHeight: '85vh' }}
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
              <span className="text-[10px] bg-white/20 text-white font-medium px-1.5 py-0.2 rounded-full backdrop-blur-xs">
                Online
              </span>
            </div>
            <p className="text-[11px] text-blue-100 font-normal">Accessories & Store Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
