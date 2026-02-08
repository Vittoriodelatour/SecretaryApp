import React from 'react';
import { X, Mic } from 'lucide-react';

/**
 * VoiceCommandsHelp Component
 * Shows supported voice commands and usage examples
 */
export default function VoiceCommandsHelp({ onClose }) {
  const commands = [
    {
      title: 'Add Tasks',
      examples: [
        'Add task call dentist',
        'Add task meeting tomorrow at 2pm',
        'Create urgent task finish report',
        'Schedule task vacation next week',
      ],
    },
    {
      title: 'View Tasks',
      examples: [
        'Show my tasks',
        'What are my tasks for today',
        'Show urgent tasks',
        'What tasks do I have',
      ],
    },
    {
      title: 'Complete Tasks',
      examples: [
        'Complete task number 1',
        'Mark task done',
        'Finish the report task',
      ],
    },
    {
      title: 'Delete Tasks',
      examples: [
        'Delete task number 2',
        'Remove the meeting task',
        'Cancel that task',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Voice Commands</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tips Section */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <h3 className="text-sm font-semibold text-cyan-300 mb-3">💡 Tips for Best Results</h3>
            <ul className="text-xs text-cyan-200 space-y-2">
              <li>✓ Speak naturally and clearly</li>
              <li>✓ Include dates and times for scheduling (e.g., "tomorrow at 2pm")</li>
              <li>✓ Use keywords like "urgent", "high priority", "critical"</li>
              <li>✓ Reference tasks by number when completing or deleting</li>
              <li>✓ Wait for the microphone to stop pulsing before speaking</li>
            </ul>
          </div>

          {/* Commands by Category */}
          {commands.map((category, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.examples.map((example, exIdx) => (
                  <div
                    key={exIdx}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
                  >
                    <p className="text-xs text-gray-300 font-mono">
                      <span className="text-gray-500">"</span>
                      {example}
                      <span className="text-gray-500">"</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Supported Features Section */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-3">✨ Features</h3>
            <ul className="text-xs text-gray-300 space-y-2">
              <li>• Real-time speech recognition</li>
              <li>• Natural language processing for task commands</li>
              <li>• Audio feedback on completed actions</li>
              <li>• Automatic task list updates</li>
              <li>• Support for scheduling with dates and times</li>
              <li>• Priority and urgency level detection</li>
            </ul>
          </div>

          {/* How to Use */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 border border-cyan-500/20">
            <h3 className="text-sm font-semibold text-cyan-300 mb-3">🎤 How to Use Voice Input</h3>
            <ol className="text-xs text-cyan-200 space-y-2">
              <li>
                <span className="font-semibold">1. Tap the microphone button</span> at the bottom center
              </li>
              <li>
                <span className="font-semibold">2. Wait for the pulsing animation</span> to start
              </li>
              <li>
                <span className="font-semibold">3. Speak your command</span> clearly
              </li>
              <li>
                <span className="font-semibold">4. Release when done</span> (or tap again to stop)
              </li>
              <li>
                <span className="font-semibold">5. You'll hear confirmation</span> of your command
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-white/10 bg-black p-4 text-center">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium transition-all"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
