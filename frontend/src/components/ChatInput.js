import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

export default function ChatInput({ onCommand, isLoading, onClose }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onCommand(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your command..."
        disabled={isLoading}
        className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/15 transition-all"
        autoFocus
      />
      <button
        type="submit"
        disabled={isLoading || !text.trim()}
        className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 transition-all"
      >
        <Send className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition-all"
      >
        <X className="w-5 h-5" />
      </button>
    </form>
  );
}
