import React, { useState, useEffect } from 'react';
import './App.css';
import './index.css';
import { Calendar, CheckSquare, Grid3x3, AlertCircle } from 'lucide-react';
import CommandInput from './components/CommandInput';
import TaskList from './components/TaskList';
import CalendarView from './components/CalendarView';
import PriorityMatrix from './components/PriorityMatrix';
import apiService from './services/api';
import speechService from './services/speechService';

function App() {
  const [currentView, setCurrentView] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [tasksByQuadrant, setTasksByQuadrant] = useState({});
  const [lastResponse, setLastResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseType, setResponseType] = useState('success');

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await apiService.getTasks({ status: 'pending' });
      setTasks(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load tasks. Make sure the backend is running.');
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchPriorityMatrix = async () => {
    try {
      const response = await apiService.getPriorityMatrix();
      setTasksByQuadrant(response.data);
    } catch (err) {
      console.error('Error fetching priority matrix:', err);
    }
  };

  const handleCommand = async (commandText) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.processCommand(commandText);
      const data = response.data;

      setLastResponse(data.message);
      setResponseType(data.success ? 'success' : 'error');

      // Speak the response
      if (speechService.isSupported()) {
        speechService.speak(data.message);
      }

      // Refresh tasks after command
      await fetchTasks();

      // If viewing matrix, refresh it too
      if (currentView === 'matrix') {
        await fetchPriorityMatrix();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to process command';
      setLastResponse(errorMessage);
      setResponseType('error');
      console.error('Error processing command:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (taskId) => {
    setIsLoading(true);
    try {
      await apiService.completeTask(taskId);
      const completedTask = tasks.find(t => t.id === taskId);
      if (completedTask) {
        speechService.speak(`Task "${completedTask.title}" marked as complete`);
      }
      await fetchTasks();
    } catch (err) {
      setError('Failed to complete task');
      console.error('Error completing task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsLoading(true);
      try {
        await apiService.deleteTask(taskId);
        const deletedTask = tasks.find(t => t.id === taskId);
        if (deletedTask) {
          speechService.speak(`Task "${deletedTask.title}" deleted`);
        }
        await fetchTasks();
      } catch (err) {
        setError('Failed to delete task');
        console.error('Error deleting task:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'matrix') {
      fetchPriorityMatrix();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Personal Secretary
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Voice-powered task management and scheduling
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-6">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Command Input */}
        <CommandInput onCommand={handleCommand} isLoading={isLoading} />

        {/* Last Response */}
        {lastResponse && (
          <div
            className={`p-4 rounded-lg border ${
              responseType === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                responseType === 'success'
                  ? 'text-green-800'
                  : 'text-red-800'
              }`}
            >
              {lastResponse}
            </p>
          </div>
        )}

        {/* View Selector */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleViewChange('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Task List
          </button>

          <button
            onClick={() => handleViewChange('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'calendar'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>

          <button
            onClick={() => handleViewChange('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'matrix'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            Priority Matrix
          </button>
        </div>

        {/* Content Views */}
        {currentView === 'list' && (
          <TaskList
            tasks={tasks}
            onComplete={handleComplete}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView tasks={tasks} isLoading={isLoading} />
        )}

        {currentView === 'matrix' && (
          <PriorityMatrix
            tasksByQuadrant={tasksByQuadrant}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="grid grid-cols-3 gap-1 p-2">
          <button
            onClick={() => handleViewChange('list')}
            className={`py-2 px-3 rounded text-sm font-medium flex flex-col items-center gap-1 ${
              currentView === 'list'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs">Tasks</span>
          </button>

          <button
            onClick={() => handleViewChange('calendar')}
            className={`py-2 px-3 rounded text-sm font-medium flex flex-col items-center gap-1 ${
              currentView === 'calendar'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Calendar</span>
          </button>

          <button
            onClick={() => handleViewChange('matrix')}
            className={`py-2 px-3 rounded text-sm font-medium flex flex-col items-center gap-1 ${
              currentView === 'matrix'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            <Grid3x3 className="w-5 h-5" />
            <span className="text-xs">Matrix</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
