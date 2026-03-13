import React, { useState } from 'react';
import { Zap, X } from 'lucide-react';

export default function TaskUrgencyManager({ task, onUpdate, onClose }) {
  const [selectedUrgency, setSelectedUrgency] = useState(task.urgency || 1);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (selectedUrgency === task.urgency) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(task.id, { urgency: selectedUrgency });
      onClose();
    } catch (err) {
      console.error('Error updating urgency:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const urgencyLevels = [
    { level: 1, label: 'Low', color: 'from-green-500 to-green-600', description: 'Can wait', icon: '😌' },
    { level: 2, label: 'Medium', color: 'from-yellow-500 to-yellow-600', description: 'Plan ahead', icon: '⚠️' },
    { level: 3, label: 'High', color: 'from-orange-500 to-orange-600', description: 'Do soon', icon: '🔥' },
    { level: 4, label: 'Critical', color: 'from-red-500 to-red-600', description: 'Do now!', icon: '🚨' },
    { level: 5, label: 'Emergency', color: 'from-red-600 to-red-700', description: 'Do immediately!', icon: '⚡' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Set Urgency</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task title */}
        <p className="text-sm text-gray-400 mb-6 truncate">
          {task.title}
        </p>

        {/* Urgency levels */}
        <div className="space-y-2 mb-6">
          {urgencyLevels.map((item) => (
            <button
              key={item.level}
              onClick={() => setSelectedUrgency(item.level)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                selectedUrgency === item.level
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/8'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.label}</span>
                    {selectedUrgency === item.level && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Preview bars */}
        <div className="mb-6 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Urgency visualization:</p>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1 h-3 rounded-full transition-all ${
                  i <= Math.min(selectedUrgency, 3)
                    ? 'bg-cyan-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-sm font-bold hover:bg-cyan-500/30 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
