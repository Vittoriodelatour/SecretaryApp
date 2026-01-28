import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

export default function CalendarView({ tasks, isLoading }) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  const tasksByDate = useMemo(() => {
    const map = {};
    if (tasks) {
      tasks.forEach((task) => {
        if (task.due_date) {
          if (!map[task.due_date]) {
            map[task.due_date] = [];
          }
          map[task.due_date].push(task);
        }
      });
    }
    return map;
  }, [tasks]);

  const hasAnyTasks = Object.values(tasksByDate).some((t) => t.length > 0);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Calendar</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-px bg-gray-200 min-w-full">
          {weekDays.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div
                key={dateStr}
                className={`min-h-32 p-3 ${
                  isToday ? 'bg-blue-50' : 'bg-white'
                } border border-gray-200`}
              >
                <div className={`text-sm font-semibold mb-2 ${
                  isToday ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className={`text-base ${isToday ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </div>
                </div>

                <div className="space-y-1">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">No tasks</p>
                  ) : (
                    dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`text-xs p-1 rounded truncate ${
                          task.urgency >= 3 ? 'bg-red-100 text-red-800' :
                          task.importance >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                        title={task.title}
                      >
                        {task.due_time && (
                          <span className="font-semibold">{task.due_time} </span>
                        )}
                        <span>{task.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasAnyTasks && (
        <div className="p-8 text-center border-t border-gray-200">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            No tasks scheduled for the next 7 days.
          </p>
        </div>
      )}
    </div>
  );
}
