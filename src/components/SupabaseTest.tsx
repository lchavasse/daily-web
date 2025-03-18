import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [envVarsStatus, setEnvVarsStatus] = useState<{url: boolean, key: boolean}>({url: false, key: false});

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check environment variables
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        setEnvVarsStatus({
          url: !!supabaseUrl,
          key: !!supabaseAnonKey
        });

        if (!supabaseUrl || !supabaseAnonKey) {
          setConnectionStatus('error');
          setErrorMessage('Missing environment variables. Check your .env file.');
          return;
        }

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Try to get session to check connection
        // This doesn't require any specific tables to exist
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // If we get here, the connection was successful
        setConnectionStatus('success');
      } catch (error: any) {
        console.error('Supabase connection test failed:', error);
        setConnectionStatus('error');
        setErrorMessage(error.message || 'Unknown error connecting to Supabase');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md my-4">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">Environment Variables:</h3>
        <div className="ml-4 mt-2">
          <div className="flex items-center">
            <span className={`inline-block w-6 h-6 rounded-full mr-2 ${envVarsStatus.url ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>VITE_SUPABASE_URL: {envVarsStatus.url ? 'Available' : 'Missing'}</span>
          </div>
          <div className="flex items-center mt-1">
            <span className={`inline-block w-6 h-6 rounded-full mr-2 ${envVarsStatus.key ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>VITE_SUPABASE_ANON_KEY: {envVarsStatus.key ? 'Available' : 'Missing'}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold">Connection Status:</h3>
        <div className="ml-4 mt-2">
          {connectionStatus === 'loading' && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
              <span>Testing connection...</span>
            </div>
          )}
          
          {connectionStatus === 'success' && (
            <div className="flex items-center text-green-600">
              <span className="inline-block w-6 h-6 rounded-full bg-green-500 mr-2"></span>
              <span>Successfully connected to Supabase!</span>
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div>
              <div className="flex items-center text-red-600">
                <span className="inline-block w-6 h-6 rounded-full bg-red-500 mr-2"></span>
                <span>Connection failed</span>
              </div>
              {errorMessage && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                  Error: {errorMessage}
                </div>
              )}
              <div className="mt-4">
                <h4 className="font-medium">Troubleshooting:</h4>
                <ul className="list-disc ml-5 mt-1 text-sm">
                  <li>Check that you've installed @supabase/supabase-js</li>
                  <li>Verify your .env file has the correct values</li>
                  <li>Make sure your Supabase project is up and running</li>
                  <li>Ensure authentication is enabled in your Supabase project settings</li>
                  <li>Check your browser console for more detailed errors</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest; 