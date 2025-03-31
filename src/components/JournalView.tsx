import React, { useEffect, useState } from 'react';
import { getJournalEntries, JournalEntry, saveJournalEntry } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const JournalView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [rangeStartDate, setRangeStartDate] = useState<Date>(new Date());
  const { user } = useAuth();

  // Initialize with today as the end of our 10-day range
  useEffect(() => {
    const today = new Date();
    // Set range start date to 9 days before today (for a 10-day range)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 9);
    setRangeStartDate(startDate);
  }, []);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        if (!user?.id) {
          console.error('User ID is required to fetch journal entries');
          setIsLoading(false);
          return;
        }
        
        console.log(`Fetching journal entries for user: ${user.id}`);
        const data = await getJournalEntries(user.id);
        console.log('Journal entries received:', data);
        
        setEntries(data);
        
        // After setting entries, select today's date
        const today = new Date();
        const todayEntry = data.find(entry => 
          new Date(entry.date).toDateString() === today.toDateString()
        );
        
        if (todayEntry) {
          console.log('Found entry for today:', todayEntry);
          setSelectedEntry(todayEntry);
          setNewContent(todayEntry.content);
          setEditMode(false);
        } else {
          console.log('No entry found for today, creating a new one');
          // Create a new entry for today
          const formattedDate = today.toISOString().split('T')[0];
          const newEntry = {
            id: `${user?.id || 'new'}-${formattedDate}`,
            date: formattedDate,
            content: ''
          };
          setSelectedEntry(newEntry);
          setNewContent('');
          setEditMode(true); // Automatically enter edit mode for new entries
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        toast.error('Failed to load journal entries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [user?.id]);

  const getDaysArray = () => {
    const result = [];
    
    // Generate 10 days starting from rangeStartDate
    for (let i = 0; i < 10; i++) {
      const date = new Date(rangeStartDate);
      date.setDate(rangeStartDate.getDate() + i);
      
      const hasEntry = entries.some(entry => 
        new Date(entry.date).toDateString() === date.toDateString()
      );
      
      result.push({ date, hasEntry });
    }
    
    return result;
  };

  const navigateDays = (direction: 'prev' | 'next') => {
    const newStartDate = new Date(rangeStartDate);
    if (direction === 'prev') {
      // Move 10 days earlier
      newStartDate.setDate(rangeStartDate.getDate() - 1);
    } else {
      // Move 10 days later
      newStartDate.setDate(rangeStartDate.getDate() + 1);
    }
    setRangeStartDate(newStartDate);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const selectedDate = new Date(e.target.value);
      // Set the selected date as the start of our range
      setRangeStartDate(selectedDate);
      
      // Also select this date in the journal
      selectDate(selectedDate);
    }
  };

  const selectDate = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    const existingEntry = entries.find(e => 
      new Date(e.date).toDateString() === date.toDateString()
    );
    
    if (existingEntry) {
      // Select existing entry
      setSelectedEntry(existingEntry);
      setNewContent(existingEntry.content);
      setEditMode(false);
    } else {
      // Create a new entry for this date
      const newEntry = {
        id: `${user?.id || 'new'}-${formattedDate}`,
        date: formattedDate,
        content: ''
      };
      setSelectedEntry(newEntry);
      setNewContent('');
      setEditMode(true); // Automatically enter edit mode for new entries
    }
  };

  const handleSaveEntry = async () => {
    if (!selectedEntry || !user?.id) return;

    try {
      setIsSaving(true);
      
      console.log('Saving entry for date:', selectedEntry.date);
      console.log('Entry content preview:', newContent.length > 50 ? `${newContent.substring(0, 50)}...` : newContent);
      
      const result = await saveJournalEntry(
        user.id, 
        selectedEntry.date, 
        newContent
      );
      
      if (result.success && result.data) {
        console.log('Save successful, received entry:', result.data);
        
        // Update entries array - either add new entry or update existing
        // Identify if this was a new entry based on whether it was in the entries array
        const existingEntryIndex = entries.findIndex(e => 
          new Date(e.date).toDateString() === new Date(selectedEntry.date).toDateString()
        );
        
        let updatedEntries;
        if (existingEntryIndex === -1) {
          // This was a new entry
          updatedEntries = [...entries, result.data];
        } else {
          // This was an update to an existing entry
          updatedEntries = entries.map((e, index) => 
            index === existingEntryIndex ? result.data! : e
          );
        }

        setEntries(updatedEntries);
        setSelectedEntry(result.data);
        setEditMode(false);
        toast.success('Journal entry saved successfully');
      } else {
        console.error('Save failed:', result.error);
        toast.error(result.error || 'Failed to save journal entry');
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('An error occurred while saving the journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedEntry) {
      // Check if this date has an existing entry
      const existingEntry = entries.find(e => 
        new Date(e.date).toDateString() === new Date(selectedEntry.date).toDateString()
      );
      
      if (existingEntry) {
        // This was an edit to an existing entry
        setNewContent(existingEntry.content);
        setEditMode(false);
      } else {
        // This was a new entry, so clear selection
        setSelectedEntry(null);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading journal...</div>;
  }

  // Format date for date input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        {/* Navigation and day tiles */}
        <button
          onClick={() => navigateDays('prev')}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 mr-2"
          aria-label="Previous days"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex overflow-x-auto py-2 gap-2 no-scrollbar flex-grow">
          {getDaysArray().map((item, index) => (
            <button
              key={index}
              onClick={() => selectDate(item.date)}
              className={`flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-300 ${
                selectedEntry && new Date(selectedEntry.date).toDateString() === item.date.toDateString()
                  ? 'bg-daily-tab text-white'
                  : item.hasEntry
                  ? 'bg-white border border-gray-200'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span className="text-xs">{item.date.toLocaleDateString('en-GB', { day: 'numeric' })}</span>
              <span className="text-xs">{item.date.toLocaleDateString('en-GB', { month: 'short' })}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={() => navigateDays('next')}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 ml-2 mr-2"
          aria-label="Next days"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Date picker */}
        <div className="relative">
          <input
            type="date"
            onChange={handleDatePickerChange}
            className="w-8 h-8 opacity-0 absolute inset-0 cursor-pointer z-10"
            aria-label="Select a date from calendar"
          />
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {selectedEntry ? (
        <div className="daily-card-contrast animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">
              {new Date(selectedEntry.date).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            {!editMode && (
              <button 
                onClick={() => setEditMode(true)} 
                className="text-xs text-daily-accent hover:text-daily-accent-dark transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          
          {editMode ? (
            <div className="space-y-3">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full h-32 p-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-daily-accent"
                placeholder="Write your journal entry here..."
                disabled={isSaving}
              />
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEntry}
                  className={`px-3 py-1 text-xs text-white rounded-md transition-colors ${
                    isSaving 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-daily-accent hover:bg-daily-accent-dark'
                  }`}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {selectedEntry.content || 'No content. Click Edit to add a journal entry.'}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 animate-fade-in">
          Select a date to view or create a journal entry
        </div>
      )}
    </div>
  );
};

export default JournalView;
