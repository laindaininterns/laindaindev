import React, { useState, useRef, useEffect } from 'react';
import { TOKENS } from '../../data/marketplaceData';
import rahiSpeaking from '../../assets/rahi/rahi-speaking.png';

export default function RahiPanel({
  isOpen,
  onClose,
  avatarState,
  messages,
  proposedNav,
  rahiError,
  isMuted,
  hasMicSupport,
  onStartListening,
  onStopListening,
  onSendMessage,
  onConfirmNav,
  onRejectNav,
  onToggleMute,
}) {
  const [inputText, setInputText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, avatarState, proposedNav, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!inputText.trim() || avatarState === 'processing') return;
    onSendMessage(inputText.trim());
    setInputText('');
  }

  return (
    <div
      role="dialog"
      aria-label="Rahi 3D Voice Assistant"
      className="fixed z-[520] bottom-24 left-4 sm:left-6 w-[calc(100vw-32px)] sm:w-[360px] h-[480px] max-h-[75vh] flex flex-col rounded-[22px] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      style={{ borderColor: TOKENS.border }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: TOKENS.offWhite, borderColor: TOKENS.border }}
      >
        <div className="flex items-center gap-2.5">
          <img src={rahiSpeaking} alt="Rahi Avatar" className="h-8 w-8 object-contain" />
          <div>
            <h3 className="text-[14px] font-bold text-black leading-tight flex items-center gap-1.5">
              Rahi Voice Assistant
              <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-[#EBF5E9] text-[#2E7D32] font-semibold">
                3D Interactive
              </span>
            </h3>
            <p className="text-[11px] text-[#5B5B58]">Voice Guide for LainDain</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mute voice output */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Rahi Voice' : 'Mute Rahi Voice'}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#5B5B58] hover:bg-black/5 transition-colors"
          >
            {isMuted ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Rahi"
            className="flex h-7 w-7 items-center justify-center rounded-full text-black hover:bg-black/5 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#111111] text-white rounded-br-xs'
                  : 'bg-[#F2F1EC] text-black border border-[#E8E7E1] rounded-bl-xs'
              }`}
            >
              {m.text}
            </div>

            {/* Quick Replies */}
            {m.role === 'assistant' && Array.isArray(m.quick_replies) && m.quick_replies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.quick_replies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(qr)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#EEF3F2] border border-[#A3C1BF] text-black hover:bg-[#A3C1BF] transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* FE-VA-B-04: Confirm-Before-Navigate Banner Card */}
        {proposedNav && (
          <div className="p-3 rounded-[16px] bg-[#F4F9F8] border border-[#A3C1BF] space-y-2 shadow-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-black">
              <svg className="h-4 w-4 text-[#2E7D32]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="12 8 8 12 12 16 12 8" />
              </svg>
              <span>Navigation Requested</span>
            </div>
            <p className="text-[12px] text-[#333]">
              Would you like me to take you to <strong>{proposedNav.label || proposedNav.target}</strong>?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onConfirmNav}
                className="flex-1 py-1.5 px-3 rounded-[10px] bg-[#85A6A3] text-black text-[12px] font-bold hover:bg-[#6D918E] transition-colors"
              >
                Yes, take me there
              </button>
              <button
                type="button"
                onClick={onRejectNav}
                className="py-1.5 px-3 rounded-[10px] bg-white border border-[#CCCCCC] text-[#555] text-[12px] font-medium hover:bg-gray-50 transition-colors"
              >
                No thanks
              </button>
            </div>
          </div>
        )}

        {avatarState === 'processing' && (
          <div className="flex items-center gap-2 text-[12px] text-[#5B5B58] italic py-1">
            <svg className="h-4 w-4 animate-spin text-[#85A6A3]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Rahi is processing...
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input / Mic Footer */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t bg-[#FAF9F6] flex-shrink-0"
        style={{ borderColor: TOKENS.border }}
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            maxLength={300}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={avatarState === 'listening' ? 'Listening to your voice...' : 'Talk to Rahi...'}
            className="w-full h-[40px] pl-3 pr-20 rounded-[12px] bg-white text-[13px] text-black outline-none border transition-all placeholder:text-[#8C8C88]"
            style={{ borderColor: TOKENS.border }}
          />

          <div className="absolute right-1 flex items-center gap-1">
            {/* Mic trigger button */}
            <button
              type="button"
              onClick={avatarState === 'listening' ? onStopListening : onStartListening}
              disabled={!hasMicSupport || avatarState === 'processing'}
              title={avatarState === 'listening' ? 'Stop mic' : 'Speak to Rahi'}
              className={`h-7 w-7 flex items-center justify-center rounded-[8px] transition-all disabled:opacity-40 ${
                avatarState === 'listening' ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-black'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputText.trim() || avatarState === 'processing'}
              aria-label="Send message to Rahi"
              className="h-7 w-7 flex items-center justify-center rounded-[8px] transition-all disabled:opacity-40"
              style={{
                backgroundColor: inputText.trim() ? TOKENS.sage : TOKENS.border,
                color: TOKENS.black,
              }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {rahiError && <p className="text-[10.5px] text-red-500 mt-1 font-medium">{rahiError}</p>}
      </form>
    </div>
  );
}
