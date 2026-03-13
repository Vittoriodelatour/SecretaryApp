/**
 * Format date and time for display with intelligent relative time
 */

export const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Normalize to midnight for comparison
  const dateNormalized = new Date(date);
  dateNormalized.setHours(0, 0, 0, 0);

  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0);

  const tomorrowNormalized = new Date(tomorrow);
  tomorrowNormalized.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayNormalized = new Date(yesterday);
  yesterdayNormalized.setHours(0, 0, 0, 0);

  if (dateNormalized.getTime() === todayNormalized.getTime()) {
    return 'Today';
  } else if (dateNormalized.getTime() === tomorrowNormalized.getTime()) {
    return 'Tomorrow';
  } else if (dateNormalized.getTime() === yesterdayNormalized.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
};

export const formatRelativeDateWithTime = (dateStr, timeStr) => {
  if (!dateStr) return timeStr || '';

  const relativeDatePart = formatRelativeDate(dateStr);

  if (timeStr) {
    return `${relativeDatePart} at ${timeStr}`;
  }

  return relativeDatePart;
};

export const formatTimeDisplay = (timeStr) => {
  if (!timeStr) return '';

  // Ensure 24-hour format conversion if needed
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);

    // Convert to 12-hour format
    const isPM = hour >= 12;
    const displayHour = hour % 12 || 12;
    const ampm = isPM ? 'PM' : 'AM';

    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
};

export const getTimeUntil = (dateStr, timeStr) => {
  if (!dateStr) return '';

  const now = new Date();
  const dueDate = new Date(dateStr);

  // If time is specified, add it to the date
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':');
    dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    dueDate.setHours(23, 59, 59, 0);
  }

  const diffMs = dueDate - now;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 0) {
    const overdueMins = Math.abs(diffMins);
    if (overdueMins < 60) {
      return `${overdueMins}m overdue`;
    } else if (overdueMins < 1440) {
      return `${Math.round(overdueMins / 60)}h overdue`;
    } else {
      return `${Math.round(overdueMins / 1440)}d overdue`;
    }
  }

  if (diffMins < 60) {
    return `in ${diffMins}m`;
  } else if (diffHours < 24) {
    return `in ${diffHours}h`;
  } else {
    return `in ${diffDays}d`;
  }
};

export const getUrgencyColor = (urgency) => {
  if (urgency >= 5) return 'bg-red-600 text-red-100';
  if (urgency >= 4) return 'bg-red-500 text-red-100';
  if (urgency >= 3) return 'bg-orange-500 text-orange-100';
  if (urgency === 2) return 'bg-yellow-500 text-yellow-100';
  return 'bg-green-500 text-green-100';
};

export const getUrgencyLabel = (urgency) => {
  if (urgency >= 5) return 'Emergency';
  if (urgency >= 4) return 'Critical';
  if (urgency >= 3) return 'High';
  if (urgency === 2) return 'Medium';
  return 'Low';
};

export const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

export const isDueToday = (dateStr) => {
  if (!dateStr) return false;
  const dueDate = new Date(dateStr);
  const today = new Date();
  return dueDate.toDateString() === today.toDateString();
};

export const isSoon = (dateStr) => {
  if (!dateStr) return false;
  const dueDate = new Date(dateStr);
  const today = new Date();
  const daysDiff = (dueDate - today) / (1000 * 60 * 60 * 24);
  return daysDiff >= 0 && daysDiff <= 3;
};
