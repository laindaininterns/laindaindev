import React, { useState, useRef, useEffect } from 'react';
import { TOKENS } from '../../data/marketplaceData';
import ChatMessage from './ChatMessage';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatQuickReplies from './ChatQuickReplies';
import useChatVoice from './useChatVoice';

export default function ChatPanel({
  isOpen,
  messages,
  isLoading,
  onClose,
  onSendMessage,
  onClearHistory,
  onNavigateCategory,
  onNavigateProduct,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    isListening,
    isTranscribing,
    isSpeaking,
    isVoiceOutputEnabled,
    micError,
    hasMicSupport,
    startListening,
    stopListening,
    speakReply,
    toggleVoiceOutput,
  } = useChatVoice();

  // Auto-scroll to bottom when messages update or loading state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Speak assistant's latest message if voice output is enabled
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.text) {
      speakReply(lastMsg.text, lastMsg.language || 'en');
    }
  }, [messages, isOpen, speakReply]);

  // Focus input field when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle Escape key to close panel
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening((transcribedText) => {
        if (transcribedText) setInputText(transcribedText);
      });
    } else {
      startListening((transcribedText) => {
        if (transcribedText) {
          setInputText(transcribedText);
          onSendMessage(transcribedText);
        }
      });
    }
  };

  // Get last message quick replies if available
  const lastMessage = messages[messages.length - 1];
  const activeQuickReplies =
    lastMessage && lastMessage.role === 'assistant' && Array.isArray(lastMessage.quick_replies)
      ? lastMessage.quick_replies
      : [];

  return (
    <div
      role="dialog"
      aria-label="Laila AI Assistant Chat"
      aria-modal="true"
      className="fixed z-[520] bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] h-[540px] max-h-[80vh] sm:max-h-[560px] flex flex-col rounded-[22px] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      style={{ borderColor: TOKENS.border }}
    >
      {/* Accessibility Status Region */}
      <div className="sr-only" aria-live="polite">
        {isListening && 'Listening for your voice input...'}
        {isTranscribing && 'Transcribing your spoken audio...'}
        {isSpeaking && 'Laila is speaking reply...'}
        {micError && `Voice error: ${micError}`}
      </div>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b flex-shrink-0"
        style={{ backgroundColor: TOKENS.offWhite, borderColor: TOKENS.border }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold text-black shadow-xs"
            style={{ backgroundColor: TOKENS.sage }}
          >
            L
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[14px] font-semibold text-black leading-tight">Laila Assistant</h3>
              <span className="inline-flex items-center rounded-full bg-[#EBF5E9] px-1.5 py-0.5 text-[9.5px] font-medium text-[#2E7D32]">
                Verified B2B
              </span>
            </div>
            <p className="text-[11px] text-[#5B5B58]">LainDain AI Wholesale Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Speaker Voice Output Toggle */}
          <button
            type="button"
            onClick={toggleVoiceOutput}
            title={isVoiceOutputEnabled ? 'Mute Laila Spoken Voice' : 'Enable Laila Spoken Voice'}
            aria-label={isVoiceOutputEnabled ? 'Mute Laila Voice' : 'Enable Laila Voice'}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: isVoiceOutputEnabled ? TOKENS.sage : 'transparent',
              color: isVoiceOutputEnabled ? TOKENS.black : '#5B5B58',
            }}
          >
            {isVoiceOutputEnabled ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          {/* Clear History */}
          <button
            type="button"
            onClick={onClearHistory}
            title="Clear Chat History"
            aria-label="Clear Chat History"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#5B5B58] hover:bg-black/5 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Chat"
            className="flex h-7 w-7 items-center justify-center rounded-full text-black hover:bg-black/5 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onNavigateCategory={onNavigateCategory}
            onNavigateProduct={onNavigateProduct}
          />
        ))}

        {isLoading && <ChatTypingIndicator />}

        {/* Quick Replies Row */}
        {!isLoading && activeQuickReplies.length > 0 && (
          <ChatQuickReplies
            quickReplies={activeQuickReplies}
            onSelect={(reply) => onSendMessage(reply)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t bg-[#FAF9F6] flex-shrink-0"
        style={{ borderColor: TOKENS.border }}
      >
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            maxLength={500}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Ask Laila about wholesale products, MOQ...'}
            className="w-full h-[42px] pl-3.5 pr-20 rounded-[14px] bg-white text-[13px] text-black outline-none border transition-all placeholder:text-[#8C8C88]"
            style={{ borderColor: TOKENS.border }}
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleMicClick}
              disabled={!hasMicSupport || isTranscribing}
              title={
                !hasMicSupport
                  ? 'Microphone unavailable or permission denied'
                  : isListening
                  ? 'Stop listening'
                  : 'Speak message to Laila'
              }
              aria-label={isListening ? 'Stop listening' : 'Start mic input'}
              className={`h-8 w-8 flex items-center justify-center rounded-[10px] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening ? 'animate-pulse bg-red-500 text-white' : ''
              }`}
              style={{
                backgroundColor: isListening ? '#E53E3E' : isTranscribing ? TOKENS.border : 'transparent',
                color: isListening ? '#FFFFFF' : TOKENS.black,
              }}
            >
              {isTranscribing ? (
                <svg className="h-4 w-4 animate-spin text-black" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              aria-label="Send message"
              className="h-8 w-8 flex items-center justify-center rounded-[10px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: inputText.trim() && !isLoading ? TOKENS.sage : TOKENS.border,
                color: TOKENS.black,
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center px-1 mt-1.5 text-[10px] text-[#5B5B58]">
          <span>{micError ? <span className="text-red-500 font-medium">{micError}</span> : 'Grounded in verified wholesale suppliers'}</span>
          <span>{inputText.length}/500</span>
        </div>
      </form>
    </div>
  );
}
