import React, { useMemo } from 'react';
import { TrendingUp, Calendar, Zap, Clock } from 'lucide-react';
import ProgressBar from './ProgressBar';

export default function EnhancedStats({ tasks, completedTasks }) {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Complete task filtering
    const completedToday = completedTasks.filter(t => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    const completedYesterday = completedTasks.filter(t => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === yesterday.getTime();
    }).length;

    const completedThisWeek = completedTasks.filter(t => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      return completedDate >= sevenDaysAgo;
    }).length;

    const completedThisMonth = completedTasks.filter(t => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      return completedDate >= thirtyDaysAgo;
    }).length;

    // Overdue tasks
    const overdueCount = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;

    // Urgent tasks
    const urgentCount = tasks.filter(t => t.urgency >= 3).length;

    // Tasks due today
    const dueTodayCount = tasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date).toDateString() === today.toDateString();
    }).length;

    // Completion streak
    let completionStreak = 0;
    let checkDate = new Date(today);
    while (checkDate >= thirtyDaysAgo) {
      const completedOnDate = completedTasks.filter(t => {
        if (!t.completed_at) return false;
        const cDate = new Date(t.completed_at);
        cDate.setHours(0, 0, 0, 0);
        return cDate.getTime() === checkDate.getTime();
      }).length;

      if (completedOnDate > 0) {
        completionStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Average completion per day this week
    const avgCompletionThisWeek = (completedThisWeek / 7).toFixed(1);

    return {
      activeTasksCount: tasks.length,
      completedToday,
      completedYesterday,
      completedThisWeek,
      completedThisMonth,
      overdueCount,
      urgentCount,
      dueTodayCount,
      completionStreak,
      avgCompletionThisWeek,
      totalTasksToday: completedToday + dueTodayCount,
    };
  }, [tasks, completedTasks]);

  const getStreakEmoji = (streak) => {
    if (streak === 0) return '❌';
    if (streak === 1) return '🔥';
    if (streak <= 3) return '🔥🔥';
    if (streak <= 7) return '🔥🔥🔥';
    return '🌟';
  };

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Tasks */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
          <div className="text-cyan-400 text-3xl font-bold">{stats.activeTasksCount}</div>
          <div className="text-gray-400 text-xs mt-1 uppercase tracking-wide">Active Tasks</div>
        </div>

        {/* Completed Today */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
          <div className="text-green-400 text-3xl font-bold">{stats.completedToday}</div>
          <div className="text-gray-400 text-xs mt-1 uppercase tracking-wide">Completed Today</div>
        </div>

        {/* Overdue */}
        {stats.overdueCount > 0 && (
          <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-all">
            <div className="text-red-400 text-3xl font-bold">{stats.overdueCount}</div>
            <div className="text-red-400/70 text-xs mt-1 uppercase tracking-wide">Overdue</div>
          </div>
        )}

        {/* Urgent */}
        {stats.urgentCount > 0 && (
          <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/50 transition-all">
            <div className="text-orange-400 text-3xl font-bold">{stats.urgentCount}</div>
            <div className="text-orange-400/70 text-xs mt-1 uppercase tracking-wide">Urgent</div>
          </div>
        )}

        {/* Due Today */}
        {stats.dueTodayCount > 0 && (
          <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-all">
            <div className="text-blue-400 text-3xl font-bold">{stats.dueTodayCount}</div>
            <div className="text-blue-400/70 text-xs mt-1 uppercase tracking-wide">Due Today</div>
          </div>
        )}

        {/* Completion Streak */}
        <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-all">
          <div className="text-purple-400 text-3xl font-bold">{stats.completionStreak} {getStreakEmoji(stats.completionStreak)}</div>
          <div className="text-purple-400/70 text-xs mt-1 uppercase tracking-wide">Day Streak</div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-cyan-300">Today's Progress</h3>
          </div>
          <span className="text-xs font-bold text-cyan-400">
            {stats.totalTasksToday > 0 ? Math.round((stats.completedToday / stats.totalTasksToday) * 100) : 0}%
          </span>
        </div>
        <ProgressBar
          current={stats.completedToday}
          total={stats.totalTasksToday}
          color="from-cyan-500 to-cyan-600"
          height="h-3"
        />
        <p className="text-xs text-gray-500 mt-3">
          {stats.completedToday} completed out of {stats.totalTasksToday} today
        </p>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400 text-xs font-medium">This Week</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.completedThisWeek}</div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.avgCompletionThisWeek} per day avg
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400 text-xs font-medium">This Month</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.completedThisMonth}</div>
          <p className="text-xs text-gray-500 mt-2">
            {(stats.completedThisMonth / 30).toFixed(1)} per day avg
          </p>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Performance</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span>Yesterday</span>
            <span className="text-white font-semibold">{stats.completedYesterday} tasks</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
              style={{
                width: `${Math.min((stats.completedYesterday / Math.max(stats.completedToday, 1)) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
