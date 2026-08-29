import React from 'react';
import ProductRecommendationCard from './ProductRecommendationCard';

/**
 * Chat message bubble item supporting user messages, assistant responses, and product cards.
 */
const ChatMessageItem = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
      <div className={`flex items-end gap-2 max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Message Bubble */}
        <div
          className={`p-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
              : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-none shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>

      {/* Timestamp */}
      {message.timestamp && (
        <span className={`text-[10px] text-gray-400 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp}
        </span>
      )}

      {/* Product Recommendations */}
      {message.products && message.products.length > 0 && (
        <div className="w-full max-w-[92%] mt-2 space-y-2">
          <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
            <span>✨</span> Recommended for you:
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
