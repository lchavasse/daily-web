import React, { useState, useEffect } from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import TasksView from './TasksView';
import IdeasView from './IdeasView';
import JournalView from './JournalView';
import NotesView from './NotesView';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchUserProfileForDashboard, 
  fetchUserProjectsForDashboard,
  fetchUserTasksForDashboard,
  fetchUserRemindersForDashboard
} from '../lib/api';

type ViewType = 'tasks' | 'ideas' | 'journal';

const UserDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('tasks');
  const [prompt, setPrompt] = useState('');
  const { user } = useAuth();
  const userId = user?.id;
  const [userProfile, setUserProfile] = useState(null);

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    // Process the prompt
    console.log('Submitting prompt:', prompt);
    setPrompt('');
  };

  useEffect(() => {
    if (userId) {
      const loadProfile = async () => {
        const userData = await fetchUserProfileForDashboard(userId);
        console.log('User data:', userData);
        setUserProfile(userData);
      };
      
      loadProfile();
    }
  }, [userId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in flex flex-col items-center zindex-10 px-4">

      {/* Tab navigation and content */}
      <div className="daily-card w-full mx-8">
      <h2 className="text-md font-medium mb-0">Hi {user?.name || 'there'}, how have you been..?</h2>
      <div className="text-sm text-gray-400 mb-4">
        <h3 className="italic text-sm text-[#502220]">this dashboard is being rapidly developed. Please see our <a className="underline" href="/about" target="_blank" rel="noopener noreferrer">roadmap</a> for details...</h3>
      </div>
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
            notes
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
        {/*
          <div className="flex items-center justify-center daily-card-contrast rounded-lg">
            <h2 className="text-xl">!!! Coming Soon !!!</h2>
          </div>
        */}
        
        {activeView === 'tasks' && <TasksView />}
        {activeView === 'ideas' && <NotesView />}
        {activeView === 'journal' && <JournalView />}
      </div>
    </div>
  );
};

export default UserDashboard;
