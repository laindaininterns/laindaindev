import React, { useState, useRef, useEffect } from 'react';
import useRahiVoice from './useRahiVoice';
import rahiIdle from '../../assets/rahi/rahi-idle.png';
import rahiListening from '../../assets/rahi/rahi-listening.png';
import rahiSpeaking from '../../assets/rahi/rahi-speaking.png';

export default function RahiWidget({ onNavigateCategory, onNavigateProduct, onNavigateAdmin }) {
  const {
    avatarState,
    latestReply,
    showSpeechBubble,
    proposedNav,
    rahiError,
    isMuted,
    hasMicSupport,
    toggleListening,
    confirmNavigation,
    rejectNavigation,
    closeSpeechBubble,
    setIsMuted,
  } = useRahiVoice();

  // Draggable position state (default to bottom-left corner)
  const [pos, setPos] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        x: 24,
        y: Math.max(100, window.innerHeight - 140),
      };
    }
    return { x: 24, y: 500 };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const hasMovedRef = useRef(false);

  // Handle window resize bounds clamping
  useEffect(() => {
    const handleResize = () => {
      setPos((currentPos) => ({
        x: Math.max(10, Math.min(currentPos.x, window.innerWidth - 90)),
        y: Math.max(10, Math.min(currentPos.y, window.innerHeight - 90)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e) => {
    // Only drag with left mouse click or touch
    if (e.button !== undefined && e.button !== 0) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: pos.x,
      posY: pos.y,
    };

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = currentX - dragStartRef.current.startX;
      const deltaY = currentY - dragStartRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        hasMovedRef.current = true;
      }

      const newX = Math.max(10, Math.min(dragStartRef.current.posX + deltaX, window.innerWidth - 90));
      const newY = Math.max(10, Math.min(dragStartRef.current.posY + deltaY, window.innerHeight - 90));

      setPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (hasMovedRef.current) return; // Ignore drag end click
    toggleListening();
  };

  const handleConfirmNav = () => {
    confirmNavigation((nav) => {
      if (!nav) return;
      if (nav.type === 'category' && typeof onNavigateCategory === 'function') {
        onNavigateCategory(nav.target);
      } else if (nav.type === 'product' && typeof onNavigateProduct === 'function') {
        onNavigateProduct(nav.target);
      } else if (nav.target.includes('/admin') && typeof onNavigateAdmin === 'function') {
        onNavigateAdmin();
      }
    });
  };

  // Determine avatar asset & visual effects based on state
  let imageSrc = rahiIdle;
  let statusPill = null;

  if (avatarState === 'listening') {
    imageSrc = rahiListening;
    statusPill = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-bold shadow-lg animate-pulse">
        <span className="h-2 w-2 rounded-full bg-white animate-ping" />
        Listening...
      </div>
    );
  } else if (avatarState === 'processing') {
    imageSrc = rahiSpeaking;
    statusPill = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-lg">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Thinking...
      </div>
    );
  } else if (avatarState === 'speaking') {
    imageSrc = rahiSpeaking;
    statusPill = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2E7D32] text-white text-[11px] font-bold shadow-lg animate-bounce">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07" />
        </svg>
        Rahi Speaking...
      </div>
    );
  }

  // Position bubble speech card above or below depending on vertical position
  const showCardAbove = pos.y > 220;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 510,
        touchAction: 'none',
      }}
      className="group select-none flex flex-col items-center cursor-grab active:cursor-grabbing font-sans"
    >
      {/* Floating Status Pill */}
      {statusPill && (
        <div
          className={`absolute ${
            showCardAbove ? '-top-9' : '-bottom-9'
          } z-20 transition-all duration-200 pointer-events-none`}
        >
          {statusPill}
        </div>
      )}

      {/* Floating Confirm-Before-Navigate Action Card */}
      {proposedNav && (
        <div
          className={`absolute ${
            showCardAbove ? 'bottom-24' : 'top-24'
          } left-1/2 -translate-x-1/2 w-[280px] p-3.5 rounded-[18px] bg-white border-2 border-[#85A6A3] shadow-[0_12px_32px_rgba(0,0,0,0.22)] z-30 animate-in fade-in zoom-in-95 duration-200`}
        >
          <div className="flex items-center gap-2 text-[12px] font-bold text-black mb-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EBF5E9] text-[#2E7D32] text-[10px]">
              ➔
            </span>
            Navigation Requested
          </div>
          <p className="text-[12px] text-[#333] leading-snug mb-3">
            Would you like me to take you to <strong>{proposedNav.label || proposedNav.target}</strong>?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmNav}
              className="flex-1 py-1.5 px-3 rounded-[10px] bg-[#85A6A3] text-black text-[12px] font-bold hover:bg-[#6D918E] active:scale-95 transition-all"
            >
              Yes, take me
            </button>
            <button
              type="button"
              onClick={rejectNavigation}
              className="py-1.5 px-3 rounded-[10px] bg-[#F2F1EC] text-[#555] text-[12px] font-medium hover:bg-gray-200 active:scale-95 transition-all"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Floating Spoken Text Speech Bubble */}
      {showSpeechBubble && latestReply && !proposedNav && (
        <div
          className={`absolute ${
            showCardAbove ? 'bottom-24' : 'top-24'
          } left-1/2 -translate-x-1/2 w-[260px] p-3 rounded-[16px] bg-[#FAF9F6] border border-[#A3C1BF] shadow-[0_10px_28px_rgba(0,0,0,0.16)] z-20 animate-in fade-in duration-200`}
        >
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#85A6A3]">Rahi Voice</span>
            <button
              type="button"
              onClick={closeSpeechBubble}
              className="text-[#888] hover:text-black text-[12px] leading-none"
            >
              ✕
            </button>
          </div>
          <p className="text-[12.5px] text-black leading-relaxed">{latestReply}</p>
        </div>
      )}

      {/* Rahi Error Toast */}
      {rahiError && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-semibold shadow-lg">
          {rahiError}
        </div>
      )}

      {/* 3D Miniature Rahi Avatar FAB (Draggable & Clickable) */}
      <div
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onClick={handleAvatarClick}
        title="Rahi 3D Voice Assistant — Drag to reposition, Click to talk"
        role="button"
        tabIndex={0}
        aria-label="Rahi 3D Voice Assistant"
        className="relative flex items-center justify-center h-16 w-16 rounded-full bg-transparent hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none"
      >
        {/* Pulse effect when listening */}
        {avatarState === 'listening' && (
          <>
            <span className="absolute -inset-2 rounded-full bg-red-400 opacity-60 animate-ping pointer-events-none" />
            <span className="absolute -inset-4 rounded-full border-2 border-red-500 opacity-80 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Pulse effect when speaking */}
        {avatarState === 'speaking' && (
          <span className="absolute -inset-3 rounded-full bg-[#85A6A3] opacity-40 animate-pulse pointer-events-none" />
        )}

        {/* Transparent background 3D Rahi image */}
        <img
          src={imageSrc}
          alt="Rahi 3D Voice Assistant Avatar"
          className="h-16 w-16 object-contain pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
        />

        {/* Small Drag handle hint indicator */}
        <span className="absolute -bottom-1 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
          Drag / Talk
        </span>
      </div>
    </div>
  );
}
