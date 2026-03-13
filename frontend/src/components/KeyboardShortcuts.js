import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const shortcuts = [
  { key: 'Cmd+K (Mac) / Ctrl+K (Windows)', action: 'Focus search' },
  { key: 'Cmd+Enter (Mac) / Ctrl+Enter (Windows)', action: 'Add task from input' },
  { key: '/', action: 'Open chat input' },
  { key: 'M', action: 'Toggle microphone' },
  { key: '1', action: 'Go to Checklist' },
  { key: '2', action: 'Go to Calendar' },
  { key: '3', action: 'Go to Stats' },
  { key: 'Escape', action: 'Close modals/inputs' },
  { key: '↑ / ↓', action: 'Navigate tasks' },
  { key: 'Enter', action: 'Mark task complete' },
  { key: 'Delete / Backspace', action: 'Delete task' },
];

export default function KeyboardShortcuts({ onClose }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + ? to open shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '?') {
        setIsOpen(!isOpen);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  return (
    <>
      {/* Help Button in corner */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs"
        title="Keyboard shortcuts (Cmd+Shift+?)"
      >
        ?
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <code className="text-cyan-400 text-xs font-mono font-bold flex-shrink-0 pt-0.5">
                    {shortcut.key}
                  </code>
                  <span className="text-gray-300 text-sm flex-1">{shortcut.action}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              Press Cmd+Shift+? to toggle
            </p>
          </div>
        </div>
      )}
    </>
  );
}
