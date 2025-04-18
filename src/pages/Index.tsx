import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import SocialLinks from '@/components/SocialLinks';
import NavigationMenu from '@/components/NavigationMenu';
import { useAuth } from '@/contexts/AuthContext';
import PhoneForm from '@/components/PhoneForm';
import LandingPage from '@/components/LandingPage';

const Index: React.FC = () => {
  const { user, account, pendingAction } = useAuth();
  const [displayText, setDisplayText] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('Index page - Auth state:', { user: user ? 'logged in' : 'not logged in', account, pendingAction });
  }, [user, account, pendingAction]);

  // Typing animation effect
  useEffect(() => {
    const text = 'daily.';
    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 150);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full mx-auto pt-8 pb-16 relative">
        <div className="mb-10">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="text-center pt-8">
            <h1 className="text-4xl mb-2 text-gray-900 h-12 font-['Afacad']">
              {displayText}
            </h1>
            <p className="text-gray-600 mb-4 text-xl font-['Afacad']" style={{ fontStyle: 'italic' }}>
              your accountability assistant.
            </p>
          </div>
        </div>
        <div className="relative z-10">
          {!user ? (
            <PhoneForm />
          ) : account === 'open' ? (
            <Navigate to="/welcome" />
          ) : account === 'closed' ? (
            <Navigate to="/dashboard" />
          ) : (
            <div>
              <h1>Loading...</h1>
            </div>
          )}
        </div>
        <div className="relative z-0 mt-8">
          <SocialLinks />
        </div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Index;
