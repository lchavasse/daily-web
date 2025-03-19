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
    const [typingComplete, setTypingComplete] = useState(false);
    const [showCallIcon, setShowCallIcon] = useState(false);
    
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

    // Typing animation effect - start animation immediately
    useEffect(() => {
      const text = 'Should we call now?';
      let currentIndex = 0;
      
      const intervalId = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(intervalId);
          setTypingComplete(true);
          
          // Show call icon with a small delay after typing is complete
          setTimeout(() => {
            setShowCallIcon(true);
          }, 300);
        }
      }, 60); // Faster typing animation

      return () => clearInterval(intervalId);
    }, []);

    return (
      <button 
        className="transition-all duration-300 hover:shadow-md transform hover:-translate-y-1 flex items-center" 
        style={{ 
          backgroundColor: '#EBCEB7',
          borderRadius: '2rem',
          padding: '0.75rem 1.25rem',
          width: 'auto',
          minWidth: '220px'
        }} 
        onClick={handleRequestCall}
        disabled={isLoading}
      >
        <h2 
          className="text-lg font-medium font-[Afacad] mr-3 flex-grow whitespace-nowrap"
          style={{ fontStyle: 'italic' }}
        >
          {displayText}
        </h2>
        
        {/* Call icon that appears after typing is complete */}
        <div 
          className={`rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            showCallIcon ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          style={{
            backgroundColor: isLoading ? '#d4a28e' : '#C4916A',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            width: '2.25rem',
            height: '2.25rem',
          }}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Phone size={18} color="white" />
          )}
        </div>
      </button>
    );
};

export default RequestCall;
