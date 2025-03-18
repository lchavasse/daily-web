import { requestCall } from '@/lib/api';
import { Phone } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const RequestCall: React.FC = () => {

    const [isLoading, setIsLoading] = useState(false);
    const { user, account } = useAuth();
    const [displayText, setDisplayText] = useState('');
    const handleRequestCall = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.phone) {
        toast.error('No phone number available');
        return;
        }

        setIsLoading(true);
        try {
        const response = await requestCall(user.phone);
        if (response.success) {
            toast.success('daily. will call you in 30s');
        } else {
            toast.error('Failed to request call');
        }
        } catch (error) {
         console.error('Error requesting call:', error);
        toast.error('An error occurred');
        } finally {
        setIsLoading(false);
        }
  };

  // Typing animation effect
  useEffect(() => {
    const text = 'Should we call now?';
    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);


  return (
    <button className="daily-card" style={{ backgroundColor: '#EBCEB777' }} onClick={handleRequestCall}>
        <div className="flex items-center justify-between">
          <h2 className="text-md font-medium font-[Afacad]" style={{ fontStyle: 'italic' }}>{displayText}</h2>
          <form onSubmit={handleRequestCall} className="flex-shrink-0">
            <div 
              className="daily-btn p-2 ml-4 rounded-full"
            >
              <Phone size={18} />
            </div>
          </form>
        </div>
      </button>
  );
};

export default RequestCall;
