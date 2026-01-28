import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const apiService = {
  // Command processing
  processCommand: (text) => {
    return api.post('/command', { text });
  },

  // Task operations
  getTasks: (params = {}) => {
    return api.get('/tasks', { params });
  },

  createTask: (task) => {
    return api.post('/tasks', task);
  },

  getTask: (id) => {
    return api.get(`/tasks/${id}`);
  },

  updateTask: (id, updates) => {
    return api.put(`/tasks/${id}`, updates);
  },

  completeTask: (id) => {
    return api.patch(`/tasks/${id}/complete`);
  },

  deleteTask: (id) => {
    return api.delete(`/tasks/${id}`);
  },

  // Calendar and priority views
  getCalendar: (startDate, endDate) => {
    return api.get('/calendar', {
      params: { start_date: startDate, end_date: endDate }
    });
  },

  getPriorityMatrix: () => {
    return api.get('/priority-matrix');
  },

  // Health check
  healthCheck: () => {
    return api.get('/../health');
  },
};

export default apiService;
