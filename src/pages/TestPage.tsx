import React from 'react';
import SupabaseTest from '../components/SupabaseTest';
import { useAuth } from '../contexts/AuthContext';

const TestPage: React.FC = () => {
  const { 
    user, 
    loginWithEmail, 
    loginWithGoogle, 
    verifyOtp,
    isLoading
  } = useAuth();

  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [showOtpInput, setShowOtpInput] = React.useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) return;
    await loginWithEmail(email, phone);
    setShowOtpInput(true);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    const success = await verifyOtp(otp);
    if (success) {
      setShowOtpInput(false);
      setOtp('');
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Supabase Authentication Test</h1>
      
      <SupabaseTest />
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          {user ? (
            <div className="bg-green-50 p-4 rounded">
              <p><span className="font-semibold">ID:</span> {user.id}</p>
              <p><span className="font-semibold">Email:</span> {user.email || 'Not set'}</p>
              <p><span className="font-semibold">Phone:</span> {user.phone || 'Not set'}</p>
            </div>
          ) : (
            <p className="text-gray-600">No user currently logged in</p>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
          
          {!showOtpInput ? (
            <div>
              <form onSubmit={handleEmailLogin} className="mb-6">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter email"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter phone with country code (e.g. +1234567890)"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Login with Email & Phone'}
                </button>
              </form>
              
              <div className="text-center">
                <p className="text-gray-500 mb-2">- OR -</p>
                <button
                  onClick={handleGoogleLogin}
                  className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 flex items-center justify-center w-full"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M12 5c1.617 0 3.101.554 4.286 1.474l3.004-2.948C17.507 1.833 14.917.75 12 .75 7.419.75 3.565 3.539 1.573 7.5l3.516 2.727C6.275 7.109 8.937 5 12 5z"
                    />
                    <path
                      fill="#34A853"
                      d="M23.25 12c0-.816-.073-1.605-.21-2.358H12v4.557h6.295c-.272 1.474-1.1 2.728-2.346 3.575l3.39 2.635C21.537 18.33 23.25 15.444 23.25 12z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.089 14.228l-3.516 2.727C3.565 20.461 7.419 23.25 12 23.25c2.917 0 5.507-1.083 7.289-2.977l-3.39-2.635C14.71 18.695 13.407 19.25 12 19.25c-3.063 0-5.725-2.109-6.911-5.022z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 24c3.04 0 5.65-1.005 7.5-2.73l-3.37-2.614C14.978 19.525 13.59 20 12 20c-3.45 0-6.365-2.312-7.411-5.42l-3.421 2.648C3.324 21.269 7.245 24 12 24z"
                    />
                  </svg>
                  Login with Google
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter the OTP sent to your phone"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                className="ml-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowOtpInput(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Debugging Tips</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Open your browser's developer console (F12) to see detailed logs</li>
          <li>Check your .env file has valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values</li>
          <li>Verify you have the @supabase/supabase-js package installed</li>
          <li>Make sure phone auth is enabled in your Supabase project:</li>
          <ul className="list-disc pl-5 mt-1 mb-2">
            <li>Go to Authentication → Providers → Phone</li>
            <li>Enable phone auth and save</li>
          </ul>
          <li><strong>Important:</strong> Create the required database tables:</li>
          <ul className="list-disc pl-5 mt-1">
            <li>Create a <code>user_profiles</code> table with columns: <code>id</code>, <code>user_id</code>, <code>phone</code>, <code>email</code></li>
            <li>Set up appropriate Row Level Security (RLS) policies</li>
          </ul>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h2 className="text-lg font-semibold mb-2">First-time Setup Notes</h2>
        <p className="text-sm mb-2">
          Currently, the connection test is simplified to only verify Supabase connectivity without checking for specific tables. 
          In a real production app, you would need to:
        </p>
        <ol className="list-decimal pl-5 text-sm space-y-1">
          <li>Create the necessary database tables in Supabase</li>
          <li>Enable phone authentication in Supabase Authentication settings</li>
          <li>Set up appropriate RLS policies for secure data access</li>
          <li>Configure webhook endpoints for email/phone verification</li>
        </ol>
      </div>
    </div>
  );
};

export default TestPage; 