import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function TaskSearch({ onSearch, onFilterChange, tasks }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, urgent, today, overdue
  const [sortBy, setSortBy] = useState('date'); // date, urgency, created
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  useEffect(() => {
    onFilterChange({ type: filterType, sortBy });
  }, [filterType, sortBy, onFilterChange]);

  const getOverdueCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
  };

  const getUrgentCount = () => {
    return tasks.filter(task => task.urgency >= 3).length;
  };

  const getTodayCount = () => {
    const today = new Date().toDateString();
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date).toDateString() === today;
    }).length;
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Search Bar */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
        <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks... (Cmd+K)"
          className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterType === 'all'
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          All ({tasks.length})
        </button>

        {getUrgentCount() > 0 && (
          <button
            onClick={() => setFilterType('urgent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'urgent'
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Urgent ({getUrgentCount()})
          </button>
        )}

        {getTodayCount() > 0 && (
          <button
            onClick={() => setFilterType('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'today'
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Today ({getTodayCount()})
          </button>
        )}

        {getOverdueCount() > 0 && (
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'overdue'
                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            Overdue ({getOverdueCount()})
          </button>
        )}

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition-all ml-auto"
        >
          Sort: {sortBy === 'date' ? 'Due Date' : sortBy === 'urgency' ? 'Urgency' : 'Created'}
        </button>
      </div>

      {/* Sort Options */}
      {showFilters && (
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => { setSortBy('date'); setShowFilters(false); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              sortBy === 'date'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            📅 Due Date
          </button>
          <button
            onClick={() => { setSortBy('urgency'); setShowFilters(false); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              sortBy === 'urgency'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            ⚡ Urgency
          </button>
          <button
            onClick={() => { setSortBy('created'); setShowFilters(false); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              sortBy === 'created'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            🕐 Created
          </button>
        </div>
      )}
    </div>
  );
}
