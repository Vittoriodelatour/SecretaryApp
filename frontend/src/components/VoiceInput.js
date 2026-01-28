import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import speechService from '../services/speechService';

export default function VoiceInput({ onTranscript, disabled, isActive, onActivate }) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(speechService.isSupported());
  }, []);

  useEffect(() => {
    speechService.onListeningStart = () => {
      setIsListening(true);
      setError('');
      onActivate?.();
    };

    speechService.onListeningEnd = () => {
      setIsListening(false);
    };

    speechService.onResult = (result) => {
      if (result.isFinal) {
        if (onTranscript) {
          onTranscript(result.final.trim());
        }
      }
    };

    speechService.onError = (error) => {
      setIsListening(false);
      if (error === 'no-speech') {
        setError('No speech detected');
      } else if (error === 'network') {
        setError('Network error');
      } else {
        setError(`Error: ${error}`);
      }
    };

    return () => {
      speechService.onListeningStart = null;
      speechService.onListeningEnd = null;
      speechService.onResult = null;
      speechService.onError = null;
    };
  }, [onTranscript, onActivate]);

  const toggleListening = () => {
    if (!supported || disabled) return;

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      try {
        setError('');
        speechService.startListening();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (!supported) {
    return (
      <button
        disabled
        className="w-14 h-14 rounded-full bg-gray-500/20 text-gray-400 flex items-center justify-center cursor-not-allowed"
        title="Speech recognition not supported"
      >
        <Mic className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`w-14 h-14 rounded-full transition-all flex items-center justify-center shadow-lg ${
          isListening
            ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 scale-110 animate-pulse'
            : 'bg-gradient-to-br from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-white`}
        title={isListening ? 'Listening... Click to stop' : 'Click to speak'}
      >
        {isListening ? (
          <MicOff className="w-7 h-7" />
        ) : (
          <Mic className="w-7 h-7" />
        )}
      </button>
      {error && (
        <div className="text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}
