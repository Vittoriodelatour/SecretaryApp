import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import speechService from '../services/speechService';

export default function VoiceInput({ onTranscript, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(speechService.isSupported());

    if (!speechService.isSupported()) {
      setError('Speech recognition not supported in this browser');
    }
  }, []);

  useEffect(() => {
    speechService.onListeningStart = () => {
      setIsListening(true);
      setError('');
      setInterimTranscript('');
    };

    speechService.onListeningEnd = () => {
      setIsListening(false);
    };

    speechService.onResult = (result) => {
      setInterimTranscript(result.interim);
      if (result.isFinal) {
        setTranscript(result.final.trim());
        if (onTranscript) {
          onTranscript(result.final.trim());
        }
      }
    };

    speechService.onError = (error) => {
      setIsListening(false);
      if (error === 'no-speech') {
        setError('No speech detected. Try speaking again.');
      } else if (error === 'network') {
        setError('Network error. Check your connection.');
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
  }, [onTranscript]);

  const toggleListening = () => {
    if (!supported || disabled) return;

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      try {
        setError('');
        setTranscript('');
        setInterimTranscript('');
        speechService.startListening();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-4 h-4 text-red-600" />
        <span className="text-sm text-red-700">Speech recognition not supported</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`flex items-center justify-center w-16 h-16 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse-ring'
            : 'bg-blue-500 hover:bg-blue-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-white shadow-lg`}
        title={isListening ? 'Listening... Click to stop' : 'Click to start listening'}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>

      {isListening && (
        <div className="text-sm text-gray-600 text-center">
          {interimTranscript && (
            <p className="italic text-gray-500">{interimTranscript}</p>
          )}
          {!interimTranscript && <p>Listening...</p>}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      {transcript && !isListening && (
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-900">Transcript: {transcript}</p>
        </div>
      )}
    </div>
  );
}
