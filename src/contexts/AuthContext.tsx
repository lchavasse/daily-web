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

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  pendingAction: string | null;
  pendingData: any;
  account: string | null;
  updateAccount: (account: string) => Promise<void>;
  // Separate functions as requested
  initiateOtpSignIn: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<{success: boolean, error?: string}>;
  completeSignUpWithEmail: (email: string) => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  addPhoneAfterGoogleSignup: (phone: string) => Promise<boolean>;
  logout: () => Promise<void>;
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
  const [account, setAccount] = useState<string | null>(null);

  // Helper function to convert Supabase user to our User format
  const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;
    console.log('Mapping Supabase user:', supabaseUser);
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata.name || null,
      email: supabaseUser.email,
      phone: supabaseUser.phone,
    };
  };

  // Initialize auth state and check for existing session
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
        // Set loading to false after session check
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    console.log('Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        
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

  const updateAccount = async (account: string) => {
    setAccount(account);
  }

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
      let name = null;
      // return if no user
      if (data.error) {
        console.log('No profile found, returning "none"');
        result = 'none';
      } else if (data.account === 'open') {
        console.log('Open profile found');
        result = 'open';
        if (data.name) {
          name = data.name;
        }
      } else if (data.account === 'closed') {
        console.log('Closed profile found');
        result = 'closed';
        if (data.name) {
          name = data.name;
        }
      }

      if (name) { // if name is available, update the user - else this will happen during signup..?
        user.name = name;
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

  // Initiate OTP sign in / up (with open user check)
  const initiateOtpSignIn = async (phone: string) => {
    setIsLoading(true);
    try {
      console.log('Initiating OTP sign in with phone:', phone);
      
      // Check for open profile
      const account = await checkForProfile(phone);
      setAccount(account);
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
  const verifyOtp = async (otp: string): Promise<{success: boolean, error?: string}> => {
    try {
      console.log('Verifying OTP...', otp);
      
      if (!pendingAction || !pendingData) {
        console.error('No pending authentication action');
        toast.error('No pending authentication action');
        return {success: false};
      }

      console.log('Pending action:', pendingAction);
      console.log('Pending data:', pendingData);

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
        return { success: false, error: error.message };
      }

    
      
      if (account === 'none') {
        // Create or update user profile
        await notifyProfile(data.user.id, pendingData.phone, account, data.user.email);
        setAccount('open');
      }
      
      console.log('OTP verification successful');
      toast.success('OTP verified successfully');
      
      // Determine if this is a signup (account was 'none') or login - NOT SURE WHAT THIS IS DOING
      const isSignup = pendingData.account === 'none';
      
      // Return success, whether this was a signup OTP, and a copy of the pending data
      return {success: true};
      
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'OTP verification failed');
      return {success: false};
    } finally {
      setIsLoading(false);
    }
  };

  // Implement the missing functions with placeholder implementations
  const completeSignUpWithEmail = async (email: string): Promise<void> => {
    // Placeholder implementation
    console.log('Completing signup with email:', email);
    // Implementation would go here
  };

  const signupWithGoogle = async (): Promise<void> => {
    console.log('Attempting to link Google account...');
      
    // Use the same redirect URL as in signupWithGoogle
    const currentUrl = window.location.origin;
    const redirectUrl = `${currentUrl}/auth/callback`;
      
    console.log('Using redirect URL:', redirectUrl);
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      console.error('Google signup error:', error);
    }
  };

  const addPhoneAfterGoogleSignup = async (phone: string): Promise<boolean> => {
    // Placeholder implementation
    console.log('Adding phone after Google signup:', phone);
    // Implementation would go here
    return true;
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
    account,
    updateAccount,
    initiateOtpSignIn,
    verifyOtp,
    completeSignUpWithEmail,
    signupWithGoogle,
    addPhoneAfterGoogleSignup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};