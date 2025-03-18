import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Debug environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const webhookServerUrl = import.meta.env.VITE_WEBHOOK_SERVER_URL as string;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key available:', supabaseAnonKey ? 'Yes (key hidden for security)' : 'No');
console.log('Webhook Server URL:', webhookServerUrl);

// Verify Supabase connection on startup
const verifySupabaseConnection = async () => {
  try {
    // Instead of querying a specific table, just check connection by getting session
    // This doesn't require any specific tables to exist
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
    return false;
  }
};

// Run the verification
verifySupabaseConnection()
  .then(connected => {
    if (connected) {
      console.log('✅ Supabase is connected and working');
    } else {
      console.error('❌ Supabase connection failed');
    }
  });

interface User {
  id: string;
  email: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  pendingAction: string | null;
  pendingData: any;
  isProfileComplete: boolean;
  signupComplete: boolean;
  // Separate functions as requested
  initiateOtpSignIn: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<{success: boolean, isSignup: boolean}>;
  completeSignUpWithEmail: (email: string) => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  addPhoneAfterGoogleSignup: (phone: string) => Promise<boolean>;
  verifyPhoneAfterGoogleSignup: (otp?: string) => Promise<boolean>;
  loginWithEmail: (email: string, phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addPhoneToAccount: (phone: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<any>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [signupComplete, setSignupComplete] = useState<boolean>(false);

  // Helper function to convert Supabase user to our User format
  const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;
    console.log('Mapping Supabase user:', supabaseUser);
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      phone: supabaseUser.phone,
    };
  };

  // Helper function to check if a user's profile is complete
  const checkProfileComplete = (user: User | null): boolean => {
    if (!user) return false;
    
    // Consider profile complete if both email and phone exist
    // Email verification is not required for initial access
    return Boolean(user.email && user.phone);
  };

  // Update profile completion status whenever user changes
  useEffect(() => {
    setIsProfileComplete(checkProfileComplete(user));
    console.log('Profile complete status:', checkProfileComplete(user));
  }, [user]);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        console.log('Checking for existing Supabase session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session retrieval error:', error);
        }
        
        if (session) {
          console.log('Found existing session:', session);
          const mappedUser = mapSupabaseUser(session.user);
          setUser(mappedUser);
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    console.log('Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        
        // If a user just signed in with Google, set a flag to indicate they need to add a phone
        if (event === 'SIGNED_IN' && session?.user?.app_metadata?.provider === 'google' && !session.user.phone) {
          console.log('User signed in with Google, needs to add phone');
          setPendingAction('google_signup_needs_phone');
        }
        
        // If a user just signed in with OTP but doesn't have an email, set a flag
        if (event === 'SIGNED_IN' && !session?.user?.email && session?.user?.phone) {
          console.log('User signed in with OTP, needs to add email');
          setPendingAction('otp_verified');
        }
        
        // If email was verified, show a success message but don't change any pending actions
        // since we're allowing users to continue without verification
        if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
          console.log('Email verified');
          toast.success('Email verified successfully!');
        }
        
        const mappedUser = session ? mapSupabaseUser(session.user) : null;
        setUser(mappedUser);
        setIsLoading(false);
      }
    );

    checkSession();

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // ----- Webhook helper functions -----

  // Check if a profile exists for the given phone number
  const checkForProfile = async (phone: string): Promise<string> => {
    try {
      console.log('Checking for profile with phone:', phone);
      
      const response = await fetch(webhookServerUrl + '/user/check/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      
      if (!response.ok) {
        console.error('Error response from check endpoint:', response.status);
        return 'none'; // Default to none if there's an error
      }
      
      const data = await response.json();
      console.log('Profile check result:', data);

      let result = 'none';
      // return if no user
      if (data.error) {
        console.log('No profile found, returning "none"');
        result = 'none';
      } else if (data.account === 'open') {
        console.log('Open profile found');
        result = 'open';
      } else if (data.account === 'closed') {
        console.log('Closed profile found');
        result = 'closed';
      }

      return result;
      
    } catch (error) {
      console.error('Error checking for profile:', error);
      return 'none'; // Return a string instead of an object
    }
  };

  // Notify your server with the new user_id (to move data in the background)
  const notifyProfile = async (userId: string, phone: string, account: string, email: string = null) => {
    try {
      console.log('Notifying server about profile:', { userId, phone, account, email });
      
      const response = await fetch(webhookServerUrl + '/user/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, phone, account, email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response from notify endpoint:', data);
        throw new Error(data.error || 'Failed to notify server');
      }
      
      console.log('Server notification successful:', data);
      return data;
    } catch (error) {
      console.error('Error notifying profile:', error);
      throw error; // Re-throw to allow caller to handle
    }
  };

  // NOT USING THIS RN
  // For email/phone login: Check that the email and phone match your records via a webhook.
  // (Your server should check (with proper RLS) that the provided email and phone match.)
  const checkEmailPhoneMatch = async (email: string, phone: string) => {
    try {
      const res = await fetch(webhookServerUrl + '/user/check/match', {
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
  };

  // Initiate OTP sign in / up (with open user check)
  const initiateOtpSignIn = async (phone: string) => {
    setIsLoading(true);
    try {
      console.log('Initiating OTP sign in with phone:', phone);
      
      // Check for open profile
      const account = await checkForProfile(phone);
      console.log('Profile check result:', account);
      
      // Send OTP
      const { error } = await supabase.auth.signInWithOtp({ phone });
      
      if (error) {
        console.error('OTP send error:', error);
        toast.error(error.message);
        return;
      }
      
      // Set pending action for verification step
      setPendingAction('otp_initiated');
      setPendingData({ phone, account: account });
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      console.error('OTP initiation error:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP verification function
  const verifyOtp = async (otp: string): Promise<{success: boolean, isSignup: boolean}> => {
    setIsLoading(true);
    try {
      console.log('Verifying OTP...', otp);
      
      if (!pendingAction || !pendingData) {
        console.error('No pending authentication action');
        toast.error('No pending authentication action');
        return {success: false, isSignup: false};
      }

      console.log('Pending action:', pendingAction);
      console.log('Pending data:', pendingData);

      // Handle Google signup phone verification separately
      if (pendingAction === 'google_signup_needs_otp') {
        console.log('Verifying phone after Google signup...');
        const success = await verifyPhoneAfterGoogleSignup(otp);
        return {success, isSignup: false};
      }

      // For other cases, use Supabase OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingData.phone,
        token: otp,
        type: 'sms'
      });

      console.log('OTP verification result:', data, error);

      if (error) {
        console.error('OTP verification error:', error);
        toast.error(error.message);
        return {success: false, isSignup: false};
      }

      // Flag to track if this was a signup OTP
      let isSignup = false;
      const pendingDataCopy = {...pendingData}; // Create a copy to return to caller

      // If it was an email signup, we need to update the pending data but not clear it
      // so completeSignUpWithEmail can use it
      if (pendingAction === 'otp_initiated') {
        console.log('OTP initiated action detected, updating to otp_verified');
        
        // Update pending action to indicate OTP is verified
        setPendingAction('otp_verified');
        console.log('Updated pendingAction to otp_verified');
        
        // Set the flag to inform the caller this was a signup OTP
        isSignup = true;
        
        // notify the server to create or migrate profile - user id comes from the session
        try {
          if (pendingData.account !== 'closed' && data?.user) {
            // Use the user ID from the Supabase response instead of relying on the user state
            console.log('Notifying server with user ID from Supabase response:', data.user.id);
            await notifyProfile(data.user.id, pendingData.phone, pendingData.account);
          } else if (pendingData.account !== 'closed' && user) {
            // Fallback to using the user state if available
            console.log('Notifying server with user ID from state:', user.id);
            await notifyProfile(user.id, pendingData.phone, pendingData.account);
          } else {
            console.warn('Could not notify server: No user ID available');
          }
        } catch (notifyError) {
          console.error('Error notifying server:', notifyError);
          // Continue even if notification fails - the OTP was verified successfully
        }
      } else {
        // For other actions like login, we can clear the state
        console.log('Non-otp_initiated action, clearing pending action and data');
        setSignupComplete(true);
        setPendingAction(null);
        setPendingData(null);
      }

      console.log('OTP verification successful');
      console.log('Returning result:', {success: true, isSignup, pendingDataCopy});
      toast.success('OTP verified successfully');
      
      // Return success, whether this was a signup OTP, and a copy of the pending data
      return {success: true, isSignup};
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'OTP verification failed');
      return {success: false, isSignup: false};
    } finally {
      setIsLoading(false);
    }
  };

  // Complete signup with email after OTP verification
  const completeSignUpWithEmail = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Completing signup with email:', email);
      console.log('Current pending state:', { pendingAction, pendingData });
      
      // Be more lenient with pending action check - it might be 'otp_verified' 
      // or the user might have directly verified through Supabase auth state
      if ((!pendingAction || pendingAction !== 'otp_verified') && !pendingData?.phone) {
        console.error('No verified OTP session or phone data');
        toast.error('Please verify your phone number first');
        return;
      }

      const phoneToUse = pendingData?.phone || user?.phone;
      
      if (!phoneToUse) {
        console.error('No phone number found in pending data or user');
        toast.error('No phone number found');
        return;
      }

      // add email to account
      try {
        const response = await fetch(webhookServerUrl + '/user/email/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, phone: phoneToUse }),
        });
        
        const data = await response.json();

        if (data.success) {
          console.log('Email added successfully');
        } else {
          console.error('Error adding email:', data.error);
        }
      } catch (error) {
        console.error('Error adding email:', error);
      }

      /* NOT USING FOR NOW
      // Update user with email - this will trigger Supabase to send a verification email - NEED TO DESIGN THESE EMAILS BEFORE ADDING THIS FUNCTIONALITY - THIS MIGHT TIE IN TO PAYMENT ETC.
      const { error: updateError } = await supabase.auth.updateUser({ 
        email: email 
      });
      
      if (updateError) {
        console.error('User update error:', updateError);
        toast.error(updateError.message);
        return;
      }
      */
      
      // Update local user state
      if (user) {
        user.email = email; // set email in local state
      }

      // Clear pending state
      setPendingAction(null);
      setPendingData(null);
      
      // Clear post-OTP verification flag (if component is using it)
      // This won't have an effect outside component but is good for consistency
      setSignupComplete(true);
      
      console.log('Email added and profile completed');
      toast.success('Account created! A verification email has been sent to your inbox.');
    } catch (error: any) {
      console.error('Email signup completion error:', error);
      toast.error(error.message || 'Failed to complete signup');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up / in with Google (happens first, before phone verification)
  const signupWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Initiating Google signup...');
      
      // Get the current URL for constructing the redirect URL
      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/auth/callback`;
      
      console.log('Using redirect URL:', redirectUrl);
      
      // Initiate Google SSO with the specific redirect URL
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error('Google auth error:', error);
        toast.error(error.message);
        return;
      }
      
      // The auth state change listener will set pendingAction to 'google_signup_needs_phone'
      // when the user returns from Google authentication
      
      toast.success('Redirecting to Google login...');
    } catch (error: any) {
      console.error('Google signup error:', error);
      toast.error(error.message || 'Failed to sign up with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Add phone after Google signup
  const addPhoneAfterGoogleSignup = async (phone: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Adding phone after Google signup:', phone);
      
      if (!user) {
        console.error('No user found');
        toast.error('You must be logged in to add a phone number');
        return false;
      }

      // Instead of using signInWithOtp which creates a new user,
      // we'll use a custom verification flow
      
      // First, check if the phone is already in use by another account
      const account = await checkForProfile(phone);
      if (account === 'closed') {
        toast.error('This phone number is already associated with another account');
        return false;
      }
      
      const { error } = await supabase.auth.updateUser({ phone: phone });
      if (error) {
        console.error('Error updating user:', error);
        toast.error(error.message);
        return false;
      }
      
      setPendingAction('google_signup_needs_otp');
      setPendingData({ phone: phone, account: account });
      
      toast.success('OTP sent to your phone');
      return true;
    } catch (error: any) {
      console.error('Error adding phone after Google signup:', error);
      toast.error(error.message || 'Failed to add phone number');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneAfterGoogleSignup = async (otp?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingData.phone,
        token: otp,
        type: 'phone_change'
      });

      console.log('OTP verification result:', data, error);
      
      if (error) {
        console.error('OTP verification failed:', error);
        toast.error(error.message || 'Failed to verify OTP');
        return false;
      }
      
      console.log('OTP verified successfully, updating user profile with phone number');
      
      console.log('Phone number updated in Supabase');
      
      // Notify server to create or migrate profile
      if (pendingData.account !== 'closed') {
        console.log('Notifying server about open profile for user:', user.id);
        try {
          await notifyProfile(user.id, pendingData.phone, pendingData.account, user.email);
          console.log('Server notified successfully');
        } catch (notifyError) {
          console.error('Error notifying server:', notifyError);
          // Continue even if notification fails - the phone number is already updated in Supabase
        }
      }

      // Clear pending state
      setPendingAction(null);
      setPendingData(null);

      setSignupComplete(true);
      
      toast.success('Phone number verified and added to your account');
      return true;
    } catch (error: any) {
      console.error('Error verifying phone after Google signup:', error);
      toast.error(error.message || 'Failed to verify phone number');
      return false;
    }
  };

  // Login with email (existing account)
  const loginWithEmail = async (email: string, phone: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Attempting email login with:', { email, phone });
      
      // Check that email and phone match
      console.log('Checking email/phone match...');
      const match = await checkEmailPhoneMatch(email, phone);
      console.log('Email/phone match result:', match);
      
      if (!match) {
        toast.error('Email and phone do not match our records');
        return;
      }

      // Send OTP for login
      console.log('Sending OTP to phone...');
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
      
      if (otpError) {
        console.error('OTP send error:', otpError);
        toast.error(otpError.message);
        return;
      }
      
      console.log('OTP sent successfully');
      
      // Store pending data for OTP verification
      setPendingAction('login_email');
      setPendingData({ email, phone });
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google (existing account)
  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Attempting Google login...');
      
      // Use the same redirect URL as in signupWithGoogle
      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/auth/callback`;
      
      console.log('Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      console.log('Google login result:', data, error);
      
      if (error) throw error;
      toast.success('Redirecting to Google login...');
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const addPhoneToAccount = async (phone: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ phone });
      
      if (error) {
        toast.error(error.message);
        return false;
      }
      
      // Check if there was a pending open profile
      const openProfileFound = sessionStorage.getItem('openProfileFound') === 'true';
      if (openProfileFound && user) {
        await notifyProfile(user.id, phone, 'none');
      }
      
      // Clear session storage
      sessionStorage.removeItem('pendingPhone');
      sessionStorage.removeItem('openProfileFound');
      
      toast.success('Phone number added successfully');
      return true;
    } catch (error: any) {
      console.error('Error adding phone:', error);
      toast.error(error.message || 'Failed to add phone number');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      // Clear pending state
      setPendingAction(null);
      setPendingData(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    pendingAction,
    pendingData,
    isProfileComplete,
    signupComplete,
    // Update with new functions
    initiateOtpSignIn,
    verifyOtp,
    completeSignUpWithEmail,
    signupWithGoogle,
    addPhoneAfterGoogleSignup,
    verifyPhoneAfterGoogleSignup,
    loginWithEmail,
    loginWithGoogle,
    logout,
    addPhoneToAccount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
