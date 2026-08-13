import { useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../services/api';

/**
 * Custom Hook for Laila Voice I/O
 * Handles MediaRecorder capture, Whisper transcription, TTS speech output, and silence detection.
 */
export default function useChatVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false);
  const [micError, setMicError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const currentAudioRef = useRef(null);

  const hasMicSupport = typeof window !== 'undefined' && Boolean(navigator?.mediaDevices?.getUserMedia && window.MediaRecorder);

  // Clean up timers & audio resources on unmount
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

  const stopListening = useCallback(async (onTranscribe) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  const startListening = useCallback(async (onTranscribe) => {
    setMicError(null);
    if (!hasMicSupport) {
      setMicError('Microphone is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Silence detection setup via Web Audio API
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let silenceStart = Date.now();

          const checkSilence = () => {
            if (mediaRecorder.state === 'inactive') return;
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((acc, val) => acc + val, 0);
            const average = sum / dataArray.length;

            if (average < 10) {
              if (Date.now() - silenceStart > 2000) {
                // 2.0 seconds of silence detected -> auto-stop
                stopListening(onTranscribe);
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
        console.warn('Silence detection unavailable:', ae);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'utterance.webm');

          const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          if (data.success && data.text && typeof onTranscribe === 'function') {
            onTranscribe(data.text);
          } else if (!data.success) {
            setMicError(data.message || 'Failed to transcribe speech.');
          }
        } catch (err) {
          console.error('Transcription network error:', err);
          setMicError('Network error transcribing audio.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('Mic access denied or error:', err);
      setMicError('Microphone access denied or unavailable.');
      setIsListening(false);
    }
  }, [hasMicSupport, stopListening]);

  const speakReply = useCallback(async (text, language = 'en') => {
    if (!isVoiceOutputEnabled || !text) return;

    // Cancel ongoing speech
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);

    try {
      const response = await fetch(`${API_BASE_URL}/voice/speak`, {
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

        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      } else {
        const data = await response.json();
        if (data.fallback && typeof window !== 'undefined' && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(data.text || text);
          utterance.lang = language.startsWith('ur') ? 'ur-PK' : 'en-US';
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
        }
      }
    } catch (err) {
      console.error('Error in speakReply:', err);
      setIsSpeaking(false);
    }
  }, [isVoiceOutputEnabled]);

  const toggleVoiceOutput = useCallback(() => {
    setIsVoiceOutputEnabled((prev) => !prev);
  }, []);

  return {
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
  };
}
