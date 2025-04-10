import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  listening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
}

// Define the SpeechRecognition interface to handle browser-specific implementations
interface SpeechRecognitionAPI extends EventTarget {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
  onstart: () => void;
}

// Declare the browser-specific SpeechRecognition constructors
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionAPI | null>(null);
  const [browserSupport, setBrowserSupport] = useState(false);

  useEffect(() => {
    // Check browser support for SpeechRecognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      const instance = new SpeechRecognitionAPI() as SpeechRecognitionAPI;
      instance.continuous = false;
      instance.interimResults = false;
      instance.lang = 'en-US';
      
      instance.onresult = (event) => {
        const finalTranscript = event.results[0][0].transcript;
        setTranscript(finalTranscript);
      };
      
      instance.onend = () => {
        setListening(false);
      };
      
      instance.onerror = (event) => {
        console.error('Speech recognition error', event);
        setListening(false);
      };
      
      instance.onstart = () => {
        setListening(true);
      };
      
      setRecognition(instance);
      setBrowserSupport(true);
    } else {
      setBrowserSupport(false);
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript('');
      recognition.start();
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition: browserSupport,
  };
}
