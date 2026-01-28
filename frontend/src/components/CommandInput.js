import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import VoiceInput from './VoiceInput';

export default function CommandInput({ onCommand, isLoading }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onCommand(text);
      setText('');
    }
  };

  const handleVoiceTranscript = (transcript) => {
    if (transcript) {
      onCommand(transcript);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Voice Command
        </label>
        <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />
      </div>

      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          or Type a Command
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add task, show tasks, complete task..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200 text-sm text-blue-800">
        <p className="font-medium mb-1">Example commands:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>"Add task call dentist tomorrow at 2pm"</li>
          <li>"What are my tasks for today"</li>
          <li>"Show urgent tasks"</li>
          <li>"Complete task number 1"</li>
        </ul>
      </div>
    </div>
  );
}
