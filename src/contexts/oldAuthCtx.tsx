import React, { useState, useEffect } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ----- Webhook helper functions -----

// Check if an open profile exists for the given phone number
async function checkOpenProfile(phone: string): Promise<boolean> {
  try {
    const response = await fetch('https://daily-dev-server.onrender.com/user/check/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json();
    // Expecting a response like { open: true } 
    return data.open;
  } catch (error) {
    console.error('Error checking open profile:', error);
    return false;
  }
}

// Notify your server with the new user_id (to move data in the background)
async function notifyOpenProfile(userId: string, phone: string): Promise<void> {
  try {
    await fetch('https://daily-dev-server.onrender.com/user/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, phone }),
    });
  } catch (error) {
    console.error('Error notifying open profile:', error);
  }
}

// For email/phone login: Check that the email and phone match your records via a webhook.
// (Your server should check (with proper RLS) that the provided email and phone match.)
async function checkEmailPhoneMatch(email: string, phone: string): Promise<boolean> {
  try {
    const res = await fetch('https://daily-dev-server.onrender.com/user/check/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });
    const result = await res.json();
    return result.match; // expecting { match: true } if they match
  } catch (error) {
    console.error('Error checking email and phone match:', error);
    return false;
  }
}

// ----- Registration Functions -----

// 1a) Registration: Email & Phone
// This function sends an OTP to the phone; after the OTP is entered by the user,
// it verifies the OTP, then updates the user to include the email.
async function registerWithEmailAndPhone(email: string, phone: string, otp: string): Promise<{user?: User, session?: Session, error?: any}> {
  // Call webhook to see if an open profile exists for this phone
  const openProfile = await checkOpenProfile(phone);

  // Send OTP to phone (this creates a temporary account with the phone number)
  const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
  if (otpError) {
    return { error: otpError };
  }

  // (In a real app, the user would now enter the OTP they received)
  // Verify the OTP
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms'
  });
  if (error) {
    return { error };
  }
  // Update the user record to add the email address
  const { error: updateError } = await supabase.auth.updateUser({ email });
  if (updateError) {
    return { error: updateError };
  }
  // (Optionally, create or update a record in your public user_profiles table here)

  // If an open profile was found, notify your external server with the new user ID
  if (openProfile && data.user) {
    await notifyOpenProfile(data.user.id, phone);
  }
  return { 
    user: data.user || undefined, 
    session: data.session || undefined 
  };
}

// 1b) Registration: Google SSO & Phone
// This function triggers Google SSO. After successful authentication,
// the user will be prompted to enter their phone number.
async function registerWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) {
    console.error('Google SSO error:', error.message);
    return;
  }
  // After Google login, the onAuthStateChange handler will set the user
  // Then the UI will show a phone input field
}

// Function to add phone number to an existing account
async function addPhoneToAccount(phone: string): Promise<{success: boolean, error?: any}> {
  const { error } = await supabase.auth.updateUser({ phone });
  if (error) {
    return { success: false, error };
  }
  return { success: true };
}

// ----- Login Functions -----

// 2a) Login: Google SSO
async function loginWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) {
    console.error('Google SSO login error:', error.message);
  }
  // The onAuthStateChange handler will set the user on success.
}

// 2b) Login: Email & Phone
// This function first uses a webhook to check that the email and phone match your records.
// Then it checks that the phone is linked (via your public user_profiles table).
// If so, it sends an OTP and then verifies it.
async function loginWithEmailAndPhone(email: string, phone: string, otp: string): Promise<{user?: User, session?: Session, error?: any}> {
  // Check with your server that email and phone match
  const match = await checkEmailPhoneMatch(email, phone);
  if (!match) {
    return { error: 'Email and phone do not match our records' };
  }

  // Optionally check in your public user_profiles table if the phone exists.
  // (Assuming you have a table "user_profiles" that is readable client-side.)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, phone')
    .eq('phone', phone)
    .single();
  if (profileError || !profile) {
    return { error: 'Phone not found in our records. Please login with email & password and then add your phone.' };
  }

  // Send OTP for login
  const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
  if (otpError) {
    return { error: otpError };
  }
  if (!otp) {
    return { error: 'OTP not provided' };
  }
  // Verify OTP and log the user in
  const { data, error: verifyError } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms'
  });
  if (verifyError) {
    return { error: verifyError };
  }
  return { 
    user: data.user || undefined, 
    session: data.session || undefined 
  };
}

// ----- React UI Component -----
// This component toggles between registration and login, and between email-based and Google SSO flows.
const App: React.FC = () => {
  // Toggle between "register" and "login" modes
  const [mode, setMode] = useState<'register' | 'login'>('register');
  // For registration: choose between "email" & "google" flows.
  const [registrationType, setRegistrationType] = useState<'email' | 'google'>('email');
  // For login: choose between "email" & "google"
  const [loginType, setLoginType] = useState<'email' | 'google'>('email');
  // Flag to show phone input after Google auth
  const [showPhoneInput, setShowPhoneInput] = useState<boolean>(false);

  // Form fields
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        // If user signed in with Google and doesn't have a phone number,
        // show the phone input field
        if (!session.user.phone && session.user.app_metadata.provider === 'google') {
          setShowPhoneInput(true);
          setMessage('Please add your phone number to complete registration.');
        }
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle adding phone to existing account
  const handleAddPhone = async () => {
    if (!phone) {
      setMessage('Please enter a phone number.');
      return;
    }
    
    const result = await addPhoneToAccount(phone);
    if (result.success) {
      setShowPhoneInput(false);
      setMessage('Phone number added successfully!');
      // Update the user object with the new phone number
      if (user) {
        setUser({...user, phone});
      }
    } else {
      setMessage('Error: ' + (result.error.message || result.error));
    }
  };

  // ----- Handlers for registration & login -----
  const handleRegistration = async () => {
    setMessage('');
    if (registrationType === 'email') {
      // Email & Phone registration
      const result = await registerWithEmailAndPhone(email, phone, otp);
      if (result.error) {
        setMessage('Error: ' + (result.error.message || result.error));
      } else {
        setUser(result.user || null);
        setMessage('Registration successful!');
      }
    } else {
      // Google SSO & Phone registration
      await registerWithGoogle();
      setMessage('Redirecting to Google SSO...');
    }
  };

  const handleLogin = async () => {
    setMessage('');
    if (loginType === 'google') {
      await loginWithGoogle();
      setMessage('Redirecting to Google SSO...');
    } else {
      const result = await loginWithEmailAndPhone(email, phone, otp);
      if (result.error) {
        setMessage('Error: ' + (result.error.message || result.error));
      } else {
        setUser(result.user || null);
        setMessage('Login successful!');
      }
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
      setMessage("Error logging out: " + error.message);
    } else {
      setUser(null);
      setMessage("Logged out successfully.");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: 'auto', padding: 20 }}>
      <h1>Auth Demo</h1>
      
      {/* Show phone input after Google auth if needed */}
      {user && showPhoneInput ? (
        <div>
          <h2>Complete Your Registration</h2>
          <p>Please add your phone number to complete your registration.</p>
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={handleAddPhone}>Add Phone Number</button>
        </div>
      ) : (
        <>
          {/* Regular auth UI */}
          <div>
            <button onClick={() => setMode('register')} disabled={mode === 'register'}>
              Register
            </button>
            <button onClick={() => setMode('login')} disabled={mode === 'login'}>
              Login
            </button>
          </div>

          {mode === 'register' ? (
            <div>
              <h2>Registration</h2>
              <div>
                <label>
                  <input
                    type="radio"
                    checked={registrationType === 'email'}
                    onChange={() => setRegistrationType('email')}
                  />
                  Email & Phone
                </label>
                <label>
                  <input
                    type="radio"
                    checked={registrationType === 'google'}
                    onChange={() => setRegistrationType('google')}
                  />
                  Google SSO
                </label>
              </div>
              {registrationType === 'email' ? (
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button onClick={handleRegistration}>Register</button>
                </div>
              ) : (
                <div>
                  <button onClick={handleRegistration}>Register with Google</button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2>Login</h2>
              <div>
                <label>
                  <input
                    type="radio"
                    checked={loginType === 'email'}
                    onChange={() => setLoginType('email')}
                  />
                  Email & Phone
                </label>
                <label>
                  <input
                    type="radio"
                    checked={loginType === 'google'}
                    onChange={() => setLoginType('google')}
                  />
                  Google SSO
                </label>
              </div>
              {loginType === 'email' ? (
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button onClick={handleLogin}>Login</button>
                </div>
              ) : (
                <div>
                  <button onClick={handleLogin}>Login with Google</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {message && <p>{message}</p>}
      
      {/* User info and logout */}
      {user && !showPhoneInput && (
        <div>
          <h3>Welcome, {user.email || user.phone}</h3>
          <p>User ID: {user.id}</p>
          {user.phone && <p>Phone: {user.phone}</p>}
        </div>
      )}
      
      {/* Logout Button */}
      {user && !showPhoneInput && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button onClick={handleLogout} style={{ padding: 10 }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default App;

