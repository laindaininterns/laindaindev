import { useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../services/api';

/**
 * Custom hook for Rahi 3D Interactive Voice Assistant
 * Continuous voice session state machine: idle -> listening -> processing -> speaking -> (auto) listening
 * Handles mic recording, Whisper STT, Rahi LLM reasoning, TTS audio playback, continuous mode, and proposed navigation confirmation.
 */
export default function useRahiVoice() {
  const [avatarState, setAvatarState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [latestReply, setLatestReply] = useState('Salam! I am Rahi, your 3D voice guide. Tap me anytime to start continuous voice mode!');
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [proposedNav, setProposedNav] = useState(null);
  const [rahiError, setRahiError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const isSessionActiveRef = useRef(false);
  const proposedNavRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentAudioRef = useRef(null);

  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    proposedNavRef.current = proposedNav;
  }, [proposedNav]);

  const hasMicSupport = typeof window !== 'undefined' && Boolean(navigator?.mediaDevices?.getUserMedia && window.MediaRecorder);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isSessionActiveRef.current = false;
      stopListening();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopListening]);

  const startListening = useCallback(async () => {
    setRahiError(null);
    setShowSpeechBubble(false);

    if (!hasMicSupport) {
      setRahiError('Microphone not supported in this browser.');
      setIsSessionActive(false);
      setAvatarState('idle');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Silence detection (2.5s)
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
              if (Date.now() - silenceStart > 2500) {
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
          if (isSessionActiveRef.current) {
            setTimeout(() => {
              if (isSessionActiveRef.current) startListening();
            }, 600);
          }
          return;
        }

        setAvatarState('processing');

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'rahi_speech.webm');

          const res = await fetch(`${API_BASE_URL}/voice/transcribe`, {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (data.success && data.text) {
            sendRahiMessage(data.text);
          } else {
            setRahiError(data.message || 'Speech transcription failed.');
            setAvatarState('idle');
            if (isSessionActiveRef.current) {
              setTimeout(() => {
                if (isSessionActiveRef.current) startListening();
              }, 1000);
            }
          }
        } catch (err) {
          console.error('Rahi transcription error:', err);
          setRahiError('Transcription network error.');
          setAvatarState('idle');
          if (isSessionActiveRef.current) {
            setTimeout(() => {
              if (isSessionActiveRef.current) startListening();
            }, 1000);
          }
        }
      };

      mediaRecorder.start();
      setAvatarState('listening');
    } catch (err) {
      console.error('Rahi mic access error:', err);
      setRahiError('Microphone access denied or unavailable.');
      setIsSessionActive(false);
      setAvatarState('idle');
    }
  }, [hasMicSupport, stopListening]);

  const speakRahiReply = useCallback(async (text, language = 'en') => {
    setLatestReply(text);
    setShowSpeechBubble(true);

    const onSpeechFinished = () => {
      setAvatarState('idle');
      // If continuous session is active, automatically listen for user's next turn!
      if (isSessionActiveRef.current) {
        setTimeout(() => {
          if (isSessionActiveRef.current) {
            startListening();
          }
        }, 600);
      }
    };

    if (isMuted || !text) {
      onSpeechFinished();
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

    const speakViaBrowserTTS = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();

          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language.startsWith('ur') ? 'ur-PK' : 'en-US';
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const preferredVoice = voices.find(
              (v) =>
                (language.startsWith('ur') ? v.lang.includes('ur') || v.lang.includes('hi') : v.lang.includes('en')) &&
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Zira'))
            ) || voices.find((v) => v.lang.startsWith('en'));

            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }
          }

          utterance.onend = onSpeechFinished;
          utterance.onerror = (e) => {
            console.warn('Browser SpeechSynthesis error:', e);
            onSpeechFinished();
          };

          setTimeout(() => {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          }, 40);
        } catch (e) {
          console.warn('SpeechSynthesis Exception:', e);
          onSpeechFinished();
        }
      } else {
        onSpeechFinished();
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('audio/mpeg')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = 1.0;
        currentAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          onSpeechFinished();
        };
        audio.onerror = (err) => {
          console.warn('Audio playback error, falling back to browser SpeechSynthesis:', err);
          URL.revokeObjectURL(url);
          speakViaBrowserTTS();
        };

        try {
          await audio.play();
        } catch (playErr) {
          console.warn('Autoplay restriction prevented audio.play(), falling back to browser SpeechSynthesis:', playErr.message);
          speakViaBrowserTTS();
        }
      } else {
        speakViaBrowserTTS();
      }
    } catch (err) {
      console.warn('Error fetching server TTS audio, using browser Web Speech API:', err.message);
      speakViaBrowserTTS();
    }
  }, [isMuted, startListening]);

  const sendRahiMessage = useCallback(async (userText) => {
    if (!userText || !userText.trim()) return;

    const lower = userText.trim().toLowerCase();

    // If proposedNav is open and user speaks affirmative words:
    const isAffirmative = ['yes', 'yeah', 'sure', 'take me', 'haan', 'chalo', 'ok', 'okay', 'take me there', 'redirect'].some((w) => lower.includes(w));
    if (proposedNavRef.current && isAffirmative) {
      const customEvent = new CustomEvent('rahiConfirmNav');
      window.dispatchEvent(customEvent);
      speakRahiReply('Navigating you now!', 'en');
      return;
    }

    setRahiError(null);
    setAvatarState('processing');
    setShowSpeechBubble(false);

    const newTurn = { role: 'user', content: userText.trim() };
    const updatedHistory = [...conversationHistory, newTurn];
    setConversationHistory(updatedHistory);

    try {
      const res = await fetch(`${API_BASE_URL}/rahi/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText.trim(),
          history: updatedHistory,
          currentPageContext: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConversationHistory((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ]);

        if (data.proposed_navigation) {
          setProposedNav(data.proposed_navigation);
        } else {
          setProposedNav(null);
        }

        speakRahiReply(data.reply, data.language || 'en');
      } else {
        setRahiError(data.message || 'Failed to connect to Rahi assistant.');
        setAvatarState('idle');
        if (isSessionActiveRef.current) {
          setTimeout(() => {
            if (isSessionActiveRef.current) startListening();
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Error sending message to Rahi:', err);
      setRahiError('Network error reaching Rahi service.');
      setAvatarState('idle');
      if (isSessionActiveRef.current) {
        setTimeout(() => {
          if (isSessionActiveRef.current) startListening();
        }, 1000);
      }
    }
  }, [conversationHistory, speakRahiReply, startListening]);

  const toggleListening = useCallback(() => {
    if (isSessionActive) {
      setIsSessionActive(false);
      isSessionActiveRef.current = false;
      stopListening();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setAvatarState('idle');
    } else {
      setIsSessionActive(true);
      isSessionActiveRef.current = true;
      startListening();
    }
  }, [isSessionActive, startListening, stopListening]);

  const confirmNavigation = useCallback((onNavigate) => {
    if (proposedNav && typeof onNavigate === 'function') {
      onNavigate(proposedNav);
    }
    setProposedNav(null);
  }, [proposedNav]);

  const rejectNavigation = useCallback(() => {
    setProposedNav(null);
  }, []);

  const closeSpeechBubble = useCallback(() => {
    setShowSpeechBubble(false);
  }, []);

  return {
    avatarState,
    latestReply,
    showSpeechBubble,
    proposedNav,
    rahiError,
    isMuted,
    hasMicSupport,
    isSessionActive,
    toggleListening,
    startListening,
    stopListening,
    sendRahiMessage,
    confirmNavigation,
    rejectNavigation,
    closeSpeechBubble,
    setIsMuted,
  };
}
