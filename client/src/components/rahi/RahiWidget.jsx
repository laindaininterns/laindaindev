import React from 'react';
import RahiAvatar from './RahiAvatar';
import RahiPanel from './RahiPanel';
import useRahiVoice from './useRahiVoice';

export default function RahiWidget({ onNavigateCategory, onNavigateProduct, onNavigateAdmin }) {
  const {
    avatarState,
    isOpen,
    messages,
    proposedNav,
    rahiError,
    isMuted,
    hasMicSupport,
    toggleOpen,
    startListening,
    stopListening,
    sendRahiMessage,
    confirmNavigation,
    rejectNavigation,
    setIsMuted,
  } = useRahiVoice();

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

  return (
    <div className="fixed z-[510] bottom-6 left-4 sm:left-6 flex flex-col items-start font-sans">
      <RahiPanel
        isOpen={isOpen}
        onClose={toggleOpen}
        avatarState={avatarState}
        messages={messages}
        proposedNav={proposedNav}
        rahiError={rahiError}
        isMuted={isMuted}
        hasMicSupport={hasMicSupport}
        onStartListening={startListening}
        onStopListening={stopListening}
        onSendMessage={sendRahiMessage}
        onConfirmNav={handleConfirmNav}
        onRejectNav={rejectNavigation}
        onToggleMute={() => setIsMuted(!isMuted)}
      />

      <RahiAvatar
        avatarState={avatarState}
        onClick={toggleOpen}
        isOpen={isOpen}
      />
    </div>
  );
}
