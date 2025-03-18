
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import TasksView from './TasksView';
import IdeasView from './IdeasView';
import JournalView from './JournalView';
import { useAuth } from '@/contexts/AuthContext';

type ViewType = 'tasks' | 'ideas' | 'journal';

const UserDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('tasks');
  const [prompt, setPrompt] = useState('');
  const { user } = useAuth();

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    // Process the prompt
    console.log('Submitting prompt:', prompt);
    setPrompt('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting and prompt */}
      <div className="daily-card bg-brown-300 text-white">
        <h2 className="text-md font-medium mb-4">Hi {user?.email?.split('@')[0] || 'there'}, how have you been..?</h2>
        
        <form onSubmit={handleSubmitPrompt} className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="daily-input"
            placeholder="have you remembered to plan that launch event?"
          />
          <button type="submit" className="daily-btn rounded-full p-2">
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      {/* Tab navigation and content */}
      <div className="daily-card bg-brown-300">
        <div className="flex rounded-lg overflow-hidden mb-6">
          <button
            onClick={() => setActiveView('tasks')}
            className={`flex-1 py-2 px-4 text-center transition-all duration-300 ${
              activeView === 'tasks' ? 'bg-daily-tab text-white' : 'bg-transparent text-white'
            }`}
          >
            tasks
          </button>
          <button
            onClick={() => setActiveView('ideas')}
            className={`flex-1 py-2 px-4 text-center transition-all duration-300 ${
              activeView === 'ideas' ? 'bg-daily-tab text-white' : 'bg-transparent text-white'
            }`}
          >
            ideas
          </button>
          <button
            onClick={() => setActiveView('journal')}
            className={`flex-1 py-2 px-4 text-center transition-all duration-300 ${
              activeView === 'journal' ? 'bg-daily-tab text-white' : 'bg-transparent text-white'
            }`}
          >
            journal
          </button>
        </div>

        {activeView === 'tasks' && <TasksView />}
        {activeView === 'ideas' && <IdeasView />}
        {activeView === 'journal' && <JournalView />}
      </div>
    </div>
  );
};

export default UserDashboard;
