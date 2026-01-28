import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function PriorityMatrix({ tasksByQuadrant, isLoading }) {
  const quadrants = [
    {
      key: 'urgent_important',
      title: 'Do First',
      subtitle: 'Urgent & Important',
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-900',
    },
    {
      key: 'not_urgent_important',
      title: 'Schedule',
      subtitle: 'Important',
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-900',
    },
    {
      key: 'urgent_not_important',
      title: 'Delegate',
      subtitle: 'Urgent',
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-900',
    },
    {
      key: 'not_urgent_not_important',
      title: 'Eliminate',
      subtitle: 'Low Priority',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-900',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Priority Matrix</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((quadrant) => {
          const tasks = tasksByQuadrant?.[quadrant.key] || [];
          return (
            <div
              key={quadrant.key}
              className={`border-2 rounded-lg p-4 ${quadrant.color}`}
            >
              <div className="mb-3">
                <h3 className={`font-bold text-sm ${quadrant.textColor}`}>
                  {quadrant.title}
                </h3>
                <p className={`text-xs opacity-75 ${quadrant.textColor}`}>
                  {quadrant.subtitle}
                </p>
              </div>

              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className={`text-xs opacity-50 ${quadrant.textColor}`}>
                    No tasks
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded p-2 text-xs border border-current border-opacity-20"
                    >
                      <p className="font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-gray-600 text-xs">
                          {task.due_date}
                          {task.due_time && ` at ${task.due_time}`}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                <p className={`text-xs font-semibold ${quadrant.textColor}`}>
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!tasksByQuadrant ||
      Object.values(tasksByQuadrant).every((tasks) => tasks.length === 0) ? (
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            No tasks yet. Add one to see it in the matrix.
          </p>
        </div>
      ) : null}
    </div>
  );
}
