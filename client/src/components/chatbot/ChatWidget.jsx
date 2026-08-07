import React from 'react';
import { useChatbot } from './useChatbot';
import ChatLauncher from './ChatLauncher';
import ChatPanel from './ChatPanel';

export default function ChatWidget({ onNavigateCategory, onNavigateProduct }) {
  const {
    isOpen,
    hasOpenedOnce,
    messages,
    isLoading,
    toggleOpen,
    closeChat,
    sendMessage,
    clearHistory,
  } = useChatbot();

  return (
    <>
      <ChatLauncher
        isOpen={isOpen}
        hasOpenedOnce={hasOpenedOnce}
        onClick={toggleOpen}
      />
      <ChatPanel
        isOpen={isOpen}
        messages={messages}
        isLoading={isLoading}
        onClose={closeChat}
        onSendMessage={sendMessage}
        onClearHistory={clearHistory}
        onNavigateCategory={onNavigateCategory}
        onNavigateProduct={onNavigateProduct}
      />
    </>
  );
}
