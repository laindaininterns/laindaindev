import React from 'react';
import { TOKENS } from '../../data/marketplaceData';

export default function ChatLauncher({ isOpen, hasOpenedOnce, onClick }) {
  return (
    <div className="fixed bottom-6 right-6 z-[520]">
      <button
        type="button"
        onClick={onClick}
        aria-label={isOpen ? 'Close Laila AI Assistant' : 'Open Laila AI Assistant'}
        aria-expanded={isOpen}
        className="relative flex h-[56px] w-[56px] items-center justify-center rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: isOpen ? TOKENS.black : TOKENS.sage,
          color: isOpen ? TOKENS.surface : TOKENS.black,
        }}
      >
        {isOpen ? (
          // Close Icon
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // AI Assistant / Sparkle Robot Icon
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="4" />
            <circle cx="9" cy="16" r="1.2" fill="currentColor" />
            <circle cx="15" cy="16" r="1.2" fill="currentColor" />
            <path d="M12 3v8" />
            <path d="M8 3h8" />
            <path d="M7 11V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
          </svg>
        )}

        {/* Pulse badge for inviting first engagement (stops when opened once) */}
        {!hasOpenedOnce && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: TOKENS.error }}
            />
            <span
              className="relative inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
              style={{ backgroundColor: TOKENS.error }}
            >
              ?
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
