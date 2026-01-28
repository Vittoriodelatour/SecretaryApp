import React, { useMemo } from 'react';

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

          return (
            <div
              key={dateStr}
              className={`p-4 rounded-xl transition-all ${
                isToday
                  ? 'bg-cyan-500/20 border border-cyan-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="text-center mb-3">
                <div className="text-xs text-gray-500">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                  {date.getDate()}
                </div>
              </div>

              <div className="space-y-2">
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-2">—</p>
                ) : (
                  dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-xs p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all truncate"
                      title={task.title}
                    >
                      {task.due_time && (
                        <span className="text-cyan-400 font-semibold">{task.due_time} </span>
                      )}
                      <span className="text-gray-300">{task.title}</span>
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
        </div>
      )}
    </div>
  );
}
