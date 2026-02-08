import React, { useState, useEffect } from 'react';
import { Mic, MicOff, HelpCircle } from 'lucide-react';
import speechService from '../services/speechService';

export default function VoiceInput({
  onTranscript,
  disabled,
  isActive,
  onActivate,
  onShowHelp
}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setSupported(speechService.isSupported());
  }, []);

  useEffect(() => {
    speechService.onListeningStart = () => {
      setIsListening(true);
      setError('');
      setStatusMessage('Listening...');
      onActivate?.();
    };

    speechService.onListeningEnd = () => {
      setIsListening(false);
      setStatusMessage('Processing...');
      setTimeout(() => setStatusMessage(''), 2000);
    };

    speechService.onResult = (result) => {
      if (result.isFinal) {
        const transcript = result.final.trim();
        setStatusMessage(`Got: "${transcript}"`);
        if (onTranscript) {
          onTranscript(transcript);
        }
        setTimeout(() => setStatusMessage(''), 2000);
      }
    };

    speechService.onError = (error) => {
      setIsListening(false);
      let errorMsg = '';
      if (error === 'no-speech') {
        errorMsg = 'No speech detected. Try again.';
      } else if (error === 'network') {
        errorMsg = 'Network error. Check connection.';
      } else if (error === 'not-allowed') {
        errorMsg = 'Microphone permission denied';
      } else {
        errorMsg = `Error: ${error}`;
      }
      setError(errorMsg);
      setStatusMessage('');
      setTimeout(() => setError(''), 4000);
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
      <div className="flex items-center gap-3">
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

        {/* Help Button */}
        <button
          onClick={onShowHelp}
          disabled={disabled}
          className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } text-gray-400 hover:text-cyan-400 hover:bg-white/5 border border-white/10`}
          title="Voice commands help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className="text-xs text-cyan-400 font-medium text-center max-w-xs">
          {statusMessage}
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400 text-center max-w-xs">{error}</div>
      )}
    </div>
  );
}
