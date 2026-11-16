import React from 'react';
import ProductRecommendationCard from './ProductRecommendationCard';

/**
 * Parses bold text (**text**) into <strong> tags for rich formatting.
 */
const renderFormattedText = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Split by ** for bold
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={lineIdx} className="block min-h-[1.1rem]">
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIdx} className="font-semibold text-gray-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={partIdx}>{part}</span>;
        })}
      </span>
    );
  });
};

/**
 * Chat message bubble item supporting user messages, assistant responses, and product cards.
 */
const ChatMessageItem = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-in fade-in duration-200`}>
      <div className={`flex items-start gap-2 max-w-[90%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center text-xs shadow-xs flex-shrink-0 mt-0.5">
            🤖
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs'
              : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-xs'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="space-y-1">
              {renderFormattedText(message.text)}
              {message.notice && <p role="status" className="pt-2 text-xs text-amber-800">{message.notice}</p>}
              {message.isGemini && (
                <div className="pt-1.5 border-t border-purple-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    ✨ Google Gemini AI
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      {message.timestamp && (
        <span className={`text-[10px] text-gray-400 px-2 ${isUser ? 'text-right' : 'text-left ml-9'}`}>
          {message.timestamp}
        </span>
      )}

      {/* Product Recommendations */}
      {message.products && message.products.length > 0 && (
        <div className="w-full max-w-[92%] sm:max-w-[88%] mt-1 ml-9 space-y-2">
          <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
            <span className="text-amber-500">✨</span> Top Recommendations:
          </p>
          <div className="flex flex-col gap-2">
            {message.products.map((prod) => (
              <ProductRecommendationCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageItem;
