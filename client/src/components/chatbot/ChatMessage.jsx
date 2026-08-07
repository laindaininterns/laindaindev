import React from 'react';
import { TOKENS } from '../../data/marketplaceData';

export default function ChatMessage({ message, onNavigateCategory, onNavigateProduct }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-2 mb-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-black shadow-xs mb-1"
          style={{ backgroundColor: TOKENS.sage }}
        >
          L
        </div>
      )}

      <div className={`max-w-[82%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Main Message Bubble */}
        <div
          className={`rounded-[18px] px-4 py-2.5 text-[13.5px] leading-relaxed break-words whitespace-pre-wrap ${
            isUser
              ? 'rounded-br-[4px] text-white'
              : 'rounded-bl-[4px] text-black shadow-xs'
          }`}
          style={{
            backgroundColor: isUser ? TOKENS.black : TOKENS.sageTint,
          }}
        >
          {/* SAFE PLAIN TEXT RENDERING ONLY - NO dangerouslySetInnerHTML */}
          {message.content}
        </div>

        {/* Action Pills for Suggested Navigation */}
        {!isUser && Array.isArray(message.suggested_actions) && message.suggested_actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.suggested_actions.map((action, idx) => {
              if (action.type === 'navigate_category' && action.category) {
                return (
                  <button
                    key={`act-${idx}`}
                    type="button"
                    onClick={() => onNavigateCategory && onNavigateCategory(action.category)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-medium border border-[#85A6A3] text-black bg-white hover:bg-[#EEF3F2] transition-colors shadow-2xs"
                  >
                    <span>📂 View Category:</span>
                    <span className="font-semibold">{action.category}</span>
                    <span>→</span>
                  </button>
                );
              }
              if (action.type === 'navigate_product' && action.productId) {
                return (
                  <button
                    key={`act-${idx}`}
                    type="button"
                    onClick={() => onNavigateProduct && onNavigateProduct(action.productId)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-medium border border-[#85A6A3] text-black bg-white hover:bg-[#EEF3F2] transition-colors shadow-2xs"
                  >
                    <span>🏷️ View Product #{action.productId}</span>
                    <span>→</span>
                  </button>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <span className="mt-1 px-1 text-[10px] text-[#5B5B58] opacity-75">
            {message.timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
