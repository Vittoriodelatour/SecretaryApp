import React from 'react';

/**
 * ProgressBar Component
 * Displays a progress bar with percentage and label
 */
export default function ProgressBar({
  current = 0,
  total = 0,
  label = 'Progress',
  showPercentage = true,
  height = 'h-2',
  color = 'from-cyan-500 to-cyan-600',
}) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        {showPercentage && (
          <span className="text-xs font-semibold text-cyan-400">
            {percentage}% ({current}/{total})
          </span>
        )}
      </div>
      <div className={`w-full ${height} rounded-full bg-white/5 border border-white/10 overflow-hidden`}>
        <div
          className={`${height} rounded-full bg-gradient-to-r ${color} transition-all duration-300 ease-out`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
