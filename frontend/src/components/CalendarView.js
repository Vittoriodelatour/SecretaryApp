import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayTasks = tasksByDate[dateStr] || [];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          // Sort tasks by time
          const sortedTasks = [...dayTasks].sort((a, b) => {
            if (!a.due_time) return 1;
            if (!b.due_time) return -1;
            return a.due_time.localeCompare(b.due_time);
          });

          return (
            <div
              key={dateStr}
              className={`p-4 rounded-xl transition-all min-h-48 flex flex-col ${
                isToday
                  ? 'bg-cyan-500/20 border-2 border-cyan-500'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {/* Date Header */}
              <div className="text-center mb-4 pb-3 border-b border-white/10">
                <div className="text-xs text-gray-500 uppercase">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-xl font-bold ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                  {date.getDate()}
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-2 flex-1">
                {sortedTasks.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-4">No events</p>
                ) : (
                  sortedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-xs p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group cursor-pointer"
                      title={task.title}
                    >
                      {/* Time */}
                      {task.due_time && (
                        <div className="flex items-center gap-1 text-cyan-400 font-semibold mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.due_time}</span>
                        </div>
                      )}
                      {/* Title */}
                      <div className="text-gray-300 group-hover:text-white transition-colors truncate">
                        {task.title}
                      </div>
                      {/* Urgency Indicator */}
                      {task.urgency >= 2 && (
                        <div className="mt-1 flex gap-0.5">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`w-0.5 h-1.5 rounded-full ${
                                i <= task.urgency ? 'bg-cyan-400' : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hasAnyTasks && (
        <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-gray-500">No tasks scheduled for the next 7 days</p>
          <p className="text-xs text-gray-600 mt-2">Try saying "Schedule a meeting for tomorrow at 2pm"</p>
        </div>
      )}
    </div>
  );
}
