import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';

const UrgencyBars = ({ urgency = 1 }) => {
  const bars = Math.min(Math.max(urgency, 1), 3);
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1 h-3 rounded-full transition-all ${
            i <= bars ? 'bg-cyan-400' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
};

export default function TaskList({ tasks, onComplete, onDelete, isLoading }) {
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-xl font-semibold text-gray-300">All done</h2>
        <p className="text-sm text-gray-500 mt-2">No tasks yet. Create one with voice or text.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all group"
        >
          {/* Checkbox */}
          <button
            onClick={() => onComplete(task.id)}
            className="flex-shrink-0 text-gray-400 hover:text-cyan-400 transition-colors"
            title="Mark as complete"
          >
            <CheckCircle2 className="w-6 h-6" />
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{task.title}</h3>
            <div className="flex items-center gap-3 mt-1">
              {task.due_date && (
                <span className="text-xs text-gray-500">
                  {new Date(task.due_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {task.due_time && (
                <span className="text-xs text-gray-500">{task.due_time}</span>
              )}
            </div>
          </div>

          {/* Urgency Bars */}
          <div className="flex-shrink-0">
            <UrgencyBars urgency={task.urgency} />
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(task.id)}
            className="flex-shrink-0 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete task"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
