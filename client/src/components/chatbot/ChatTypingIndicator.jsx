import React from 'react';
import { TOKENS } from '../../data/marketplaceData';

export default function ChatTypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 mb-3">
      {/* Bot Small Avatar */}
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-black shadow-xs"
        style={{ backgroundColor: TOKENS.sage }}
      >
        L
      </div>

      {/* Bubble with 3 pulsing dots */}
      <div
        className="flex items-center gap-1.5 rounded-[16px] rounded-bl-[4px] px-4 py-3"
        style={{ backgroundColor: TOKENS.sageTint }}
      >
        <span
          className="h-2 w-2 rounded-full animate-bounce"
          style={{ backgroundColor: TOKENS.sageDark, animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 rounded-full animate-bounce"
          style={{ backgroundColor: TOKENS.sageDark, animationDelay: '150ms' }}
        />
        <span
          className="h-2 w-2 rounded-full animate-bounce"
          style={{ backgroundColor: TOKENS.sageDark, animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
