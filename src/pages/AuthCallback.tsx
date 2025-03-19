import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and query parameters
        const hash = window.location.hash;
        const query = window.location.search;

        console.log('Auth callback received:', { hash, query });

        // The Supabase client will automatically handle the OAuth callback
        // Just need to check if we have a session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          navigate('/');
          return;
        }

        if (data.session) {
          console.log('Session found, redirecting to dashboard');
          if (data.session.user.phone) {
            navigate('/Openpage');
          } else {
            navigate('/');
          }
        } else {
          console.log('No session found, redirecting to home');
          navigate('/');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Processing authentication...</div>
    </div>
  );
};

export default AuthCallback; 