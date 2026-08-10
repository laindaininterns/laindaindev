import { useState, useEffect, useCallback } from 'react';
import posthog, { isPostHogEnabled } from '../../posthog';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://laindaindev.onrender.com/api';

const INITIAL_WELCOME = {
  id: 'welcome-1',
  role: 'assistant',
  content: 'Hello! I am Laila, your LainDain B2B wholesale assistant. How can I help you find verified manufacturers, products, or wholesale pricing today?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  quick_replies: ['Browse Categories', 'What is MOQ?', 'Clothing & Apparel'],
};

export function useChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(() => {
    return sessionStorage.getItem('laila_opened_once') === 'true';
  });
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('laila_chat_messages');
      return saved ? JSON.parse(saved) : [INITIAL_WELCOME];
    } catch (e) {
      return [INITIAL_WELCOME];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('laila_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat state in sessionStorage:', e);
    }
  }, [messages]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && !hasOpenedOnce) {
        setHasOpenedOnce(true);
        sessionStorage.setItem('laila_opened_once', 'true');
      }
      return next;
    });
  }, [hasOpenedOnce]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(
    async (textInput) => {
      const text = String(textInput || '').trim();
      if (!text || isLoading) return;

      setError(null);
      if (isPostHogEnabled) {
        posthog.capture('chat_message_sent', {
          message_length: text.length,
        });
      }
      const userMsgId = `user-${Date.now()}`;
      const userMessage = {
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Optimistically append user message
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Build conversation history (last 6 turns)
      const currentHistory = [...messages, userMessage]
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: currentHistory,
            locale: 'en',
          }),
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || 'Failed to reach Laila Assistant.');
        }

        const botData = json.data || {};
        const botMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: botData.reply || 'I am here to help with LainDain wholesale marketplace questions!',
          language: botData.language || 'en',
          suggested_actions: botData.suggested_actions || [],
          quick_replies: botData.quick_replies || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (err) {
        console.warn('Chatbot request error:', err.message);

        // Safe client-side fallback message
        const fallbackMessage = {
          id: `bot-fallback-${Date.now()}`,
          role: 'assistant',
          content: 'I can only help with LainDain — our categories, products, and how wholesale ordering works. Ask me anything about that!',
          language: 'en',
          suggested_actions: [],
          quick_replies: ['Browse Categories', 'What is MOQ?'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, fallbackMessage]);
        setError('Network response delayed. Showed fallback answer.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const clearHistory = useCallback(() => {
    setMessages([INITIAL_WELCOME]);
    sessionStorage.removeItem('laila_chat_messages');
  }, []);

  return {
    isOpen,
    hasOpenedOnce,
    messages,
    isLoading,
    error,
    toggleOpen,
    closeChat,
    sendMessage,
    clearHistory,
  };
}
