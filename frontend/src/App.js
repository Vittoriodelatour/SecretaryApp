import React, { useState, useEffect } from 'react';
import './App.css';
import './index.css';
import { Calendar, ListTodo, MessageCircle, AlertCircle, BarChart3 } from 'lucide-react';
import VoiceInput from './components/VoiceInput';
import ChatInput from './components/ChatInput';
import TaskList from './components/TaskList';
import CalendarView from './components/CalendarView';
import ProgressBar from './components/ProgressBar';
import VoiceCommandsHelp from './components/VoiceCommandsHelp';
import apiService from './services/api';
import speechService from './services/speechService';

function App() {
  const [currentView, setCurrentView] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [lastResponse, setLastResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedToday, setCompletedToday] = useState(0);
  const [totalTasksToday, setTotalTasksToday] = useState(0);
  const [responseType, setResponseType] = useState('success');
  const [inputMode, setInputMode] = useState('none'); // 'none', 'voice', 'chat'
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);

  // Load tasks on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchTasks();
    fetchCompletedTasks();
  }, []);

  // Update total tasks today when tasks change
  useEffect(() => {
    const totalToday = completedToday + tasks.length;
    setTotalTasksToday(totalToday > 0 ? totalToday : completedToday);
  }, [tasks, completedToday]);

  const fetchTasks = async () => {
    try {
      const response = await apiService.getTasks({ status: 'pending' });
      setTasks(response.data);
      setError('');
    } catch (err) {
      setError('Unable to connect. Make sure backend is running.');
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchCompletedTasks = async () => {
    try {
      const response = await apiService.getTasks({ status: 'completed' });
      setCompletedTasks(response.data);

      // Count completed tasks today
      const today = new Date().toDateString();
      const completed = response.data.filter(t => {
        const completedDate = t.completed_at ? new Date(t.completed_at).toDateString() : null;
        return completedDate === today;
      }).length;
      setCompletedToday(completed);

      // Calculate total tasks created/started today (completed + active tasks created today)
      // For now, total = completed today + all active tasks (approximation of what's relevant today)
      const totalToday = completed + tasks.length;
      setTotalTasksToday(totalToday);
    } catch (err) {
      console.error('Error fetching completed tasks:', err);
    }
  };

  const handleCommand = async (commandText) => {
    setIsLoading(true);
    setError('');
    setInputMode('none');

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
        speechService.speak(`Done: ${completedTask.title}`);
      }
      await fetchTasks();
      await fetchCompletedTasks();
    } catch (err) {
      setError('Failed to complete task');
      console.error('Error completing task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      setIsLoading(true);
      try {
        await apiService.deleteTask(taskId);
        const deletedTask = tasks.find(t => t.id === taskId) || completedTasks.find(t => t.id === taskId);
        if (deletedTask) {
          speechService.speak(`Deleted: ${deletedTask.title}`);
        }
        await fetchTasks();
        await fetchCompletedTasks();
      } catch (err) {
        setError('Failed to delete task');
        console.error('Error deleting task:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRestore = async (taskId) => {
    setIsLoading(true);
    try {
      // Update task status back to pending
      await apiService.updateTask(taskId, { status: 'pending' });
      const restoredTask = completedTasks.find(t => t.id === taskId);
      if (restoredTask) {
        speechService.speak(`Restored: ${restoredTask.title}`);
      }
      await fetchTasks();
      await fetchCompletedTasks();
    } catch (err) {
      setError('Failed to restore task');
      console.error('Error restoring task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Top Navigation Cards */}
      <div className="px-4 pt-4 pb-2 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {/* Checklist Card */}
          <button
            onClick={() => setCurrentView('list')}
            className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
              currentView === 'list'
                ? 'bg-cyan-500/20 border border-cyan-500'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              <span className="text-sm font-medium">Checklist</span>
            </div>
          </button>

          {/* Calendar Card */}
          <button
            onClick={() => setCurrentView('calendar')}
            className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
              currentView === 'calendar'
                ? 'bg-cyan-500/20 border border-cyan-500'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Calendar</span>
            </div>
          </button>

          {/* Statistics Card */}
          <button
            onClick={() => setCurrentView('stats')}
            className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
              currentView === 'stats'
                ? 'bg-cyan-500/20 border border-cyan-500'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Stats</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="px-4 pb-32 pt-2">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-200">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-300 text-xs font-medium"
            >
              ✕
            </button>
          </div>
        )}

        {/* Response Message */}
        {lastResponse && (
          <div
            className={`p-4 rounded-xl mb-4 text-sm font-medium transition-all ${
              responseType === 'success'
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-200'
                : 'bg-red-500/10 border border-red-500/30 text-red-200'
            }`}
          >
            {lastResponse}
          </div>
        )}

        {/* Content Views */}
        {currentView === 'list' && (
          <TaskList
            tasks={tasks}
            completedTasks={completedTasks}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onCommand={handleCommand}
            isLoading={isLoading}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView tasks={tasks} isLoading={isLoading} />
        )}

        {currentView === 'stats' && (
          <div className="space-y-4">
            {/* Active Tasks Card */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-cyan-400 text-3xl font-bold">{tasks.length}</div>
              <div className="text-gray-400 text-sm mt-1">Active Tasks</div>
            </div>

            {/* Completed Today Card */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-cyan-400 text-3xl font-bold">{completedToday}</div>
              <div className="text-gray-400 text-sm mt-1">Completed Today</div>
            </div>

            {/* Daily Progress Card */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">Today's Progress</h3>
                <span className="text-xs font-bold text-cyan-400">
                  {totalTasksToday > 0 ? Math.round((completedToday / totalTasksToday) * 100) : 0}%
                </span>
              </div>
              <ProgressBar
                current={completedToday}
                total={totalTasksToday}
                label="Completion Rate"
                color="from-cyan-500 to-cyan-600"
                height="h-3"
              />
              <p className="text-xs text-gray-500 mt-3">
                {completedToday} of {totalTasksToday} tasks completed
              </p>
            </div>

            {/* Weekly Stats */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-cyan-400 text-3xl font-bold">{completedTasks.length}</div>
              <div className="text-gray-400 text-sm mt-1">Completed This Week</div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black to-black/80 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-around gap-4">
          {/* Checklist Button */}
          <button
            onClick={() => setCurrentView('list')}
            className={`p-3 rounded-lg transition-all ${
              currentView === 'list'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Checklist"
          >
            <ListTodo className="w-6 h-6" />
          </button>

          {/* Microphone Button (Center, Larger) */}
          <VoiceInput
            onTranscript={handleCommand}
            disabled={isLoading || inputMode === 'chat'}
            isActive={inputMode === 'voice'}
            onActivate={() => setInputMode('voice')}
            onShowHelp={() => setShowVoiceHelp(true)}
          />

          {/* Chat Button */}
          <button
            onClick={() => setInputMode(inputMode === 'chat' ? 'none' : 'chat')}
            className={`p-3 rounded-lg transition-all ${
              inputMode === 'chat'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Chat"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Input (when active) */}
        {inputMode === 'chat' && (
          <div className="border-t border-white/10 px-4 py-3">
            <ChatInput
              onCommand={handleCommand}
              isLoading={isLoading}
              onClose={() => setInputMode('none')}
            />
          </div>
        )}
      </div>

      {/* Voice Commands Help Modal */}
      {showVoiceHelp && (
        <VoiceCommandsHelp onClose={() => setShowVoiceHelp(false)} />
      )}
    </div>
  );
}

export default App;
