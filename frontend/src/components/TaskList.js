import React, { useState } from 'react';
import { Circle, Trash2, MoreVertical, RotateCcw, Plus } from 'lucide-react';

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

const TaskMenu = ({ onRestore, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-300 transition-colors p-1"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-lg bg-white/10 border border-white/20 shadow-lg z-10">
          <button
            onClick={() => {
              onRestore();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm text-gray-300"
          >
            <RotateCcw className="w-4 h-4" />
            Restore to checklist
          </button>
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm text-red-400 border-t border-white/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default function TaskList({
  tasks,
  completedTasks,
  onComplete,
  onDelete,
  onRestore,
  onCommand,
  isLoading,
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onCommand(`Add task ${inputValue}`);
      setInputValue('');
    }
  };

  // Get completed tasks from past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const completedThisWeek = (completedTasks || []).filter((task) => {
    if (!task.completed_at) return false;
    const completedDate = new Date(task.completed_at);
    return completedDate >= sevenDaysAgo;
  });

  return (
    <div className="space-y-6">
      {/* Add Task Input */}
      <form onSubmit={handleAddTask}>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all">
          <Plus className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
      </form>

      {/* Active Tasks Section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Your Tasks
        </h2>

        {isLoading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-sm text-gray-500">No active tasks. Great job!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all group"
              >
                {/* Empty Circle Checkbox */}
                <button
                  onClick={() => onComplete(task.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-cyan-400 transition-colors"
                  title="Mark as complete"
                >
                  <Circle className="w-6 h-6" />
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
                      <span className="text-xs text-cyan-400 font-medium">
                        {task.due_time}
                      </span>
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
        )}
      </div>

      {/* Completed This Week Section */}
      {completedThisWeek.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Completed This Week
          </h2>
          <div className="space-y-2">
            {completedThisWeek.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all group"
              >
                {/* Completed Indicator */}
                <div className="flex-shrink-0 text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-400 truncate line-through">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {task.completed_at && (
                      <span className="text-xs text-gray-600">
                        {new Date(task.completed_at).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3-Dot Menu */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <TaskMenu
                    onRestore={() => onRestore(task.id)}
                    onDelete={() => onDelete(task.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
