export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
};

export const formatDateTime = (dateString, timeString) => {
  if (!dateString) return '';

  const date = new Date(dateString + 'T00:00:00');
  let result = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (timeString) {
    result += ` at ${timeString}`;
  }

  return result;
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const date = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const isToday = (dateString) => {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
};

export const isTomorrow = (dateString) => {
  if (!dateString) return false;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  return dateString === tomorrow;
};

export const getDateRange = (days = 7) => {
  const today = new Date();
  const end = new Date(today.getTime() + days * 86400000);

  const formatISO = (date) => date.toISOString().split('T')[0];

  return {
    start: formatISO(today),
    end: formatISO(end),
  };
};

export const getImportanceColor = (importance) => {
  if (importance >= 4) return 'bg-red-100 text-red-800';
  if (importance >= 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

export const getUrgencyColor = (urgency) => {
  if (urgency >= 4) return 'bg-red-100 text-red-800';
  if (urgency >= 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};
