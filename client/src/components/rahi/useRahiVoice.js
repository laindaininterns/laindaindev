import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for Rahi 3D Voice Assistant
 * Manages voice states: idle -> listening -> processing -> speaking -> idle
 * Handles microphone recording, STT, Rahi LLM reasoning, TTS playback, and proposed navigation confirmation.
 */
export default function useRahiVoice() {
  const [avatarState, setAvatarState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Salam! I am Rahi, your 3D voice guide for LainDain. Tap the mic to speak to me!',
      language: 'en',
    },
  ]);
  const [proposedNav, setProposedNav] = useState(null);
  const [rahiError, setRahiError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentAudioRef = useRef(null);

  const hasMicSupport = typeof window !== 'undefined' && Boolean(navigator?.mediaDevices?.getUserMedia && window.MediaRecorder);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakRahiReply = useCallback(async (text, language = 'en') => {
    if (isMuted || !text) {
      setAvatarState('idle');
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setAvatarState('speaking');

    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('audio/mpeg')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;

        audio.onended = () => setAvatarState('idle');
        audio.onerror = () => setAvatarState('idle');
        await audio.play();
      } else {
        const data = await response.json();
        if (data.fallback && typeof window !== 'undefined' && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(data.text || text);
          utterance.lang = language.startsWith('ur') ? 'ur-PK' : 'en-US';
          utterance.onend = () => setAvatarState('idle');
          utterance.onerror = () => setAvatarState('idle');
          window.speechSynthesis.speak(utterance);
        } else {
          setAvatarState('idle');
        }
      }
    } catch (err) {
      console.error('Error playing Rahi TTS audio:', err);
      setAvatarState('idle');
    }
  }, [isMuted]);

  const sendRahiMessage = useCallback(async (userText) => {
    if (!userText || !userText.trim()) return;

    setRahiError(null);
    setAvatarState('processing');

    const userMsg = { id: `u_${Date.now()}`, role: 'user', text: userText.trim() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const historyTurns = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch('/api/rahi/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText.trim(),
          history: historyTurns,
          currentPageContext: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          language: data.language || 'en',
          quick_replies: data.quick_replies || [],
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (data.proposed_navigation) {
          setProposedNav(data.proposed_navigation);
        } else {
          setProposedNav(null);
        }

        // Trigger TTS playback
        speakRahiReply(data.reply, data.language || 'en');
      } else {
        setRahiError(data.message || 'Failed to connect to Rahi assistant.');
        setAvatarState('idle');
      }
    } catch (err) {
      console.error('Error sending message to Rahi:', err);
      setRahiError('Network error reaching Rahi service.');
      setAvatarState('idle');
    }
  }, [messages, speakRahiReply]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  const startListening = useCallback(async () => {
    setRahiError(null);
    setIsOpen(true);

    if (!hasMicSupport) {
      setRahiError('Microphone not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Silence detection (2s)
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let silenceStart = Date.now();

          const checkSilence = () => {
            if (mediaRecorder.state === 'inactive') return;
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((a, b) => a + b, 0);
            const avg = sum / dataArray.length;

            if (avg < 10) {
              if (Date.now() - silenceStart > 2000) {
                stopListening();
                return;
              }
            } else {
              silenceStart = Date.now();
            }
            silenceTimerRef.current = setTimeout(checkSilence, 200);
          };
          silenceTimerRef.current = setTimeout(checkSilence, 500);
        }
      } catch (ae) {
        console.warn('Rahi silence detector omitted:', ae);
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (audioBlob.size === 0) {
          setAvatarState('idle');
          return;
        }

        setAvatarState('processing');

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'rahi_speech.webm');

          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (data.success && data.text) {
            sendRahiMessage(data.text);
          } else {
            setRahiError(data.message || 'Speech transcription failed.');
            setAvatarState('idle');
          }
        } catch (err) {
          console.error('Rahi transcription error:', err);
          setRahiError('Transcription network error.');
          setAvatarState('idle');
        }
      };

      mediaRecorder.start();
      setAvatarState('listening');
    } catch (err) {
      console.error('Rahi mic access error:', err);
      setRahiError('Microphone access denied or unavailable.');
      setAvatarState('idle');
    }
  }, [hasMicSupport, sendRahiMessage, stopListening]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const confirmNavigation = useCallback((onNavigate) => {
    if (proposedNav && typeof onNavigate === 'function') {
      onNavigate(proposedNav);
    }
    setProposedNav(null);
  }, [proposedNav]);

  const rejectNavigation = useCallback(() => {
    setProposedNav(null);
  }, []);

  return {
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
  };
}
