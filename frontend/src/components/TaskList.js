import React, { useState } from 'react';
import { Trash2, Check, AlertCircle } from 'lucide-react';
import { formatDateTime, getImportanceColor, getUrgencyColor } from '../utils/dateUtils';

export default function TaskList({ tasks, onComplete, onDelete, isLoading }) {
  const [sortBy, setSortBy] = useState('due_date');

  const sortedTasks = [...(tasks || [])].sort((a, b) => {
    if (sortBy === 'urgency') {
      return b.urgency - a.urgency;
    } else if (sortBy === 'importance') {
      return b.importance - a.importance;
    } else {
      // due_date
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }
  });

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No tasks yet. Add one with a voice or text command!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Tasks ({tasks.length})</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="due_date">Sort by Date</option>
          <option value="urgency">Sort by Urgency</option>
          <option value="importance">Sort by Importance</option>
        </select>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onComplete(task.id)}
                disabled={isLoading}
                className="mt-1 p-2 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                title="Mark as complete"
              >
                <Check className="w-5 h-5 text-green-600" />
              </button>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 break-words">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {task.due_date && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatDateTime(task.due_date, task.due_time)}
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(task.importance)}`}
                  >
                    Importance: {task.importance}/5
                  </span>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(task.urgency)}`}
                  >
                    Urgency: {task.urgency}/5
                  </span>

                  {task.task_type === 'calendar' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Calendar
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDelete(task.id)}
                disabled={isLoading}
                className="mt-1 p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                title="Delete task"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
