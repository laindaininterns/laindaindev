import React from 'react';
import { TOKENS } from '../../data/marketplaceData';

export default function ChatQuickReplies({ quickReplies = [], onSelect }) {
  if (!Array.isArray(quickReplies) || quickReplies.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 py-2 px-1">
      {quickReplies.map((replyText, idx) => (
        <button
          key={`qr-${idx}`}
          type="button"
          onClick={() => onSelect && onSelect(replyText)}
          className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-all active:scale-95 shadow-2xs border"
          style={{
            borderColor: TOKENS.border,
            backgroundColor: TOKENS.surface,
            color: TOKENS.black,
          }}
        >
          {replyText}
        </button>
      ))}
    </div>
  );
}
