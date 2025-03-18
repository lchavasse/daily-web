
import React, { useEffect, useState } from 'react';
import { getJournalEntries, JournalEntry } from '@/lib/api';

const JournalView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const data = await getJournalEntries();
        setEntries(data);
        if (data.length > 0) {
          setSelectedEntry(data[0]);
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const getDaysArray = () => {
    // This would typically generate days for the current month
    // For demo purposes, we'll just use the dates from our entries
    const dates = entries.map(entry => new Date(entry.date));
    dates.sort((a, b) => a.getTime() - b.getTime());
    
    const result = [];
    const today = new Date();
    
    // Add some days before the first entry
    for (let i = 3; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push({ date, hasEntry: false });
    }
    
    // Add days with entries
    dates.forEach(date => {
      result.push({ date, hasEntry: true });
    });
    
    // Add some days after the last entry
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      result.push({ date, hasEntry: false });
    }
    
    return result;
  };

  const selectDate = (date: Date) => {
    const entry = entries.find(e => new Date(e.date).toDateString() === date.toDateString());
    if (entry) {
      setSelectedEntry(entry);
    } else {
      setSelectedEntry(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading journal...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto py-2 gap-2 no-scrollbar">
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

      {selectedEntry ? (
        <div className="bg-white/50 rounded-lg p-4 border border-gray-100 animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">
              {new Date(selectedEntry.date).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </h3>
          </div>
          <p className="text-sm text-gray-600">{selectedEntry.content}</p>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 animate-fade-in">
          No journal entry for this date
        </div>
      )}
    </div>
  );
};

export default JournalView;
