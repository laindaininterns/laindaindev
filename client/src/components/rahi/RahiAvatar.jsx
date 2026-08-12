import React from 'react';
import rahiIdle from '../../assets/rahi/rahi-idle.png';
import rahiListening from '../../assets/rahi/rahi-listening.png';
import rahiSpeaking from '../../assets/rahi/rahi-speaking.png';

/**
 * Rahi Avatar FAB component
 * Displays high-fidelity 3D miniature Rahi character based on state: idle | listening | processing | speaking
 */
export default function RahiAvatar({ avatarState = 'idle', onClick, isOpen }) {
  let imageSrc = rahiIdle;
  let statusBadgeText = 'Rahi Voice Guide';
  let badgeColor = 'bg-[#85A6A3] text-black';

  if (avatarState === 'listening') {
    imageSrc = rahiListening;
    statusBadgeText = 'Listening...';
    badgeColor = 'bg-red-500 text-white animate-pulse';
  } else if (avatarState === 'processing') {
    imageSrc = rahiSpeaking;
    statusBadgeText = 'Thinking...';
    badgeColor = 'bg-amber-500 text-white';
  } else if (avatarState === 'speaking') {
    imageSrc = rahiSpeaking;
    statusBadgeText = 'Speaking...';
    badgeColor = 'bg-[#2E7D32] text-white animate-bounce';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Rahi 3D Voice Assistant Guide"
      aria-label="Toggle Rahi 3D Voice Assistant"
      className="relative group flex items-center justify-center h-14 w-14 rounded-full bg-[#F9F9F6] border-2 border-[#85A6A3] shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none"
    >
      {/* Pulse effect when listening */}
      {avatarState === 'listening' && (
        <span className="absolute -inset-1 rounded-full bg-red-400 opacity-75 animate-ping pointer-events-none" />
      )}

      {/* Pulse effect when speaking */}
      {avatarState === 'speaking' && (
        <span className="absolute -inset-1 rounded-full bg-[#85A6A3] opacity-50 animate-pulse pointer-events-none" />
      )}

      {/* 3D Miniature Rahi Image */}
      <img
        src={imageSrc}
        alt="Rahi 3D Voice Assistant Avatar"
        className="h-11 w-11 object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-110"
      />

      {/* Mini status indicator badge */}
      <span
        className={`absolute -top-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider ${badgeColor}`}
      >
        {avatarState === 'listening' ? 'MIC' : avatarState === 'speaking' ? 'VOICE' : 'RAHI'}
      </span>
    </button>
  );
}
