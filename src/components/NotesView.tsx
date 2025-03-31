import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserProfileForDashboard, updateUserProfile } from '../lib/api';

const NotesView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notes, setNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const loadProfile = async () => {
        const userData = await fetchUserProfileForDashboard(userId);
        console.log('User profile data:', userData);
        setUserProfile(userData);
        setNotes(userData?.notes || '');
      };
      
      loadProfile();
    }
  }, [userId]);

  const handleSaveNotes = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Call the API to update the user profile
      const result = await updateUserProfile(userId, { notes });
      
      if (result.success && result.data) {
        // Update local state with the new profile data
        setUserProfile(result.data);
        setIsEditing(false);
      } else {
        // Show error message
        setSaveError(result.error || 'Failed to save notes');
      }
      
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveError('An unexpected error occurred');
      setIsSaving(false);
    }
  };

  return (
    <div className="daily-card-contrast rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Notes</h3>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-sm text-daily-accent hover:text-daily-accent-hover transition"
          >
            Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button 
              onClick={() => {
                setIsEditing(false);
                setNotes(userProfile?.notes || '');
                setSaveError(null);
              }}
              className="text-sm text-gray-400 hover:text-gray-300 transition"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveNotes}
              className="text-sm text-daily-accent hover:text-daily-accent-hover transition"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
      
      {saveError && (
        <div className="mb-3 p-2 bg-red-900/50 text-red-200 rounded text-sm">
          {saveError}
        </div>
      )}
      
      {isEditing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your notes here..."
          className="w-full h-32 p-3 bg-white text-black rounded focus:border-daily-accent focus:outline-none transition"
        />
      ) : (
        <div className="prose prose-invert max-w-none">
          {notes ? (
            <p className="whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-gray-400 italic">No notes added yet. Click 'Edit' to add some.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesView;
