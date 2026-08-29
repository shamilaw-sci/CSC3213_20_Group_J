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

  return (
    <div 
      className="fixed bottom-6 right-4 sm:right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 bg-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      style={{ height: '530px' }}
    >
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">AI Assistant</h3>
            <p className="text-[11px] text-blue-100 font-medium">Smart Phone & Gear Advisor</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            title="Clear conversation"
            className="text-white/80 hover:text-white p-1 rounded hover:bg-blue-700/50 transition-colors text-xs cursor-pointer"
          >
            🗑️
          </button>
          <button
            onClick={onClose}
            aria-label="Close Chat"
            className="text-white/80 hover:text-white p-1 rounded hover:bg-blue-700/50 transition-colors text-sm font-bold cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start">
            <div className="bg-white text-gray-500 border border-gray-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} loading={loading} />
    </div>
  );
};

export default ChatWindow;
