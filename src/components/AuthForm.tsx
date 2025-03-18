import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Mail, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Country codes data
const countryCodes = [
  { code: '+1', country: 'US' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' },
  { code: '+33', country: 'FR' },
  { code: '+49', country: 'DE' },
  { code: '+81', country: 'JP' },
  { code: '+86', country: 'CN' },
];

// Authentication flow steps
enum AuthStep {
  INITIAL = 'initial',
  VERIFY_OTP = 'verify_otp',
  ENTER_EMAIL = 'enter_email',
  ENTER_PHONE_AFTER_GOOGLE = 'enter_phone_after_google'
}

const AuthForm: React.FC = () => {
  // State for form inputs
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+44');
  const [otp, setOtp] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  
  // State for tracking the current step in the auth flow
  const [currentStep, setCurrentStep] = useState<AuthStep>(AuthStep.INITIAL);
  
  // State to track if we're in the post-OTP verification flow
  const [isPostOtpVerification, setIsPostOtpVerification] = useState(false);
  
  // Get auth functions from context
  const { 
    initiateOtpSignIn, 
    verifyOtp, 
    completeSignUpWithEmail,
    signupWithGoogle,
    addPhoneAfterGoogleSignup,
    isLoading,
    pendingAction,
    pendingData,
    user
  } = useAuth();

  // Enhanced logic to determine the current auth step based on user state and pending actions
  useEffect(() => {
    console.log('Auth state changed:', { 
      user, 
      pendingAction, 
      pendingData, 
      currentStep,
      isPostOtpVerification
    });
    
    // If we're in the post-OTP verification flow, force the email step
    if (isPostOtpVerification) {
      console.log('In post-OTP verification flow, forcing email step');
      setCurrentStep(AuthStep.ENTER_EMAIL);
      return;
    }
    
    // If user is fully authenticated (has both email and phone), stay at initial step
    if (user && user.email && user.phone) {
      console.log('User fully authenticated, showing initial step');
      setCurrentStep(AuthStep.INITIAL);
      return;
    }
    
    // Handle different pending actions
    if (pendingAction) {
      console.log('Handling pending action:', pendingAction);
      switch (pendingAction) {
        case 'google_signup_needs_phone':
          // User authenticated with Google but needs to add phone
          setCurrentStep(AuthStep.ENTER_PHONE_AFTER_GOOGLE);
          break;

        case 'google_signup_needs_otp':
          // User authenticated with Google but needs to verify phone
          setCurrentStep(AuthStep.VERIFY_OTP);
          break;
          
        case 'otp_initiated':
          // OTP has been sent, show verification screen
          setCurrentStep(AuthStep.VERIFY_OTP);
          // If we have pending phone data, set it in the form
          if (pendingData?.phone) {
            const phoneWithoutCode = pendingData.phone.startsWith('+') 
              ? extractPhoneNumber(pendingData.phone)
              : pendingData.phone;
            setPhone(phoneWithoutCode);
          }
          break;
          
        case 'otp_verified':
          // OTP has been verified, show email input if needed
          console.log('OTP verified, showing email input');
          setCurrentStep(AuthStep.ENTER_EMAIL);
          break;
          
        case 'login_email':
          // Email login flow, show OTP verification
          setCurrentStep(AuthStep.VERIFY_OTP);
          break;
          
        default:
          // For any other pending action, stay at initial step
          setCurrentStep(AuthStep.INITIAL);
      }
      return;
    }
    
    // If user exists but is missing email or phone, handle accordingly
    if (user) {
      console.log('User exists, checking for missing fields');
      if (!user.email) {
        console.log('User missing email, showing email input');
        setCurrentStep(AuthStep.ENTER_EMAIL);
      } else if (!user.phone) {
        console.log('User missing phone, showing phone input');
        setCurrentStep(AuthStep.ENTER_PHONE_AFTER_GOOGLE);
      } else {
        console.log('User has all fields, showing initial step');
        setCurrentStep(AuthStep.INITIAL);
      }
      return;
    }
    
    // Default to initial step if no conditions are met
    console.log('No conditions met, showing initial step');
    setCurrentStep(AuthStep.INITIAL);
  }, [user, pendingAction, pendingData, isPostOtpVerification]);

  // Helper function to extract phone number without country code
  const extractPhoneNumber = (fullPhone: string) => {
    // Find the country code that matches the beginning of the phone number
    const countryCode = countryCodes.find(cc => 
      fullPhone.startsWith(cc.code)
    );
    
    if (countryCode) {
      // Set the country code dropdown
      setCountryCode(countryCode.code);
      // Return the phone number without the country code
      return fullPhone.substring(countryCode.code.length);
    }
    
    // If no matching country code is found, return the full phone
    return fullPhone;
  };

  // Handle phone submission (initial step)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      const fullPhone = `${countryCode}${phone}`;
      console.log('Initiating OTP sign-in with phone:', fullPhone);
      await initiateOtpSignIn(fullPhone);
      // The step will be updated by the useEffect hook when pendingAction changes
    } catch (error) {
      console.error('Phone submission error:', error);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      console.log('Verifying OTP:', otp);
      const success = await verifyOtp(otp);
      console.log('OTP verification result:', success);
      
      if (success) {
        // Set flag to force email step after OTP verification
        console.log('OTP verified successfully, setting post-OTP flag');
        setIsPostOtpVerification(true);
        setOtp('');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
    }
  };

  // Handle email submission (after OTP verification)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    try {
      console.log('Completing signup with email:', email);
      await completeSignUpWithEmail(email);
      
      // Clear the post-OTP verification flag
      setIsPostOtpVerification(false);
      
      // Reset form - user will be redirected to dashboard automatically
      // since their profile is now considered complete
      resetForm();
    } catch (error) {
      console.error('Email submission error:', error);
    }
  };

  // Handle Google signup
  const handleGoogleSignup = async () => {
    try {
      console.log('Initiating Google signup');
      await signupWithGoogle();
      // The step will be updated by the useEffect hook when pendingAction changes
    } catch (error) {
      console.error('Google signup error:', error);
    }
  };

  // Handle phone submission after Google signup
  const handlePhoneAfterGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      const fullPhone = `${countryCode}${phone}`;
      console.log('Adding phone after Google signup:', fullPhone);
      const success = await addPhoneAfterGoogleSignup(fullPhone);
      
    } catch (error) {
      console.error('Phone submission error:', error);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setCurrentStep(AuthStep.INITIAL);
    setEmail('');
    setPhone('');
    setOtp('');
    setIsPostOtpVerification(false);
  };

  // Handle country code selection
  const selectCountryCode = (code: string) => {
    setCountryCode(code);
    setShowCountryDropdown(false);
  };

  // Debug info component
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="mt-4 p-2 bg-gray-800 text-xs text-gray-300 rounded-md">
        <div><strong>Current Step:</strong> {currentStep}</div>
        <div><strong>Post-OTP:</strong> {isPostOtpVerification ? 'Yes' : 'No'}</div>
        <div><strong>Pending Action:</strong> {pendingAction || 'None'}</div>
        <div><strong>User:</strong> {user ? `ID: ${user.id.substring(0, 8)}...` : 'Not logged in'}</div>
        {user && (
          <>
            <div><strong>Email:</strong> {user.email || 'Not set'}</div>
            <div><strong>Phone:</strong> {user.phone || 'Not set'}</div>
          </>
        )}
      </div>
    );
  };

  // Render the appropriate form based on the current step
  const renderForm = () => {
    switch (currentStep) {
      case AuthStep.VERIFY_OTP:
        return (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-center text-sm mb-4">
              Enter the verification code sent to your phone
              {pendingData?.phone && <span className="block font-medium mt-1">{pendingData.phone}</span>}
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="daily-input text-gray-800"
              placeholder="Enter OTP"
              disabled={isLoading}
              autoFocus
            />
            <div className="flex justify-end">
              <button type="submit" className="daily-btn" disabled={isLoading}>
                Verify OTP
              </button>
            </div>
          </form>
        );
        
      case AuthStep.ENTER_EMAIL:
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <p className="text-center text-sm mb-4">
              Great! Now enter your email to complete signup
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="daily-input text-gray-800"
              placeholder="Email"
              disabled={isLoading}
              autoFocus
            />
            <div className="flex justify-end">
              <button type="submit" className="daily-btn" disabled={isLoading}>
                Complete Signup
              </button>
            </div>
          </form>
        );
        
      case AuthStep.ENTER_PHONE_AFTER_GOOGLE:
        return (
          <form onSubmit={handlePhoneAfterGoogleSubmit} className="space-y-4">
            <p className="text-center text-sm mb-4">
              Almost done! Please add your phone number to complete signup
              {user?.email && <span className="block font-medium mt-1">for {user.email}</span>}
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  className="daily-input text-gray-800 flex items-center justify-between gap-1 w-20 h-10"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <span>{countryCode}</span>
                  <ChevronDown size={16} />
                </button>
                
                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {countryCodes.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                        onClick={() => selectCountryCode(country.code)}
                      >
                        {country.code} ({country.country})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="daily-input text-gray-800"
                  placeholder="Phone number"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                className="daily-btn rounded-full p-2"
                disabled={isLoading}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        );
        
        
      default: // AuthStep.INITIAL
        return (
          <div className="space-y-4">
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className="daily-input text-gray-800 flex items-center justify-between gap-1 w-20 h-10"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    <span>{countryCode}</span>
                    <ChevronDown size={16} />
                  </button>
                  
                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                          onClick={() => selectCountryCode(country.code)}
                        >
                          {country.code} ({country.country})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="daily-input text-gray-800"
                    placeholder="Phone number"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  className="daily-btn rounded-full p-2"
                  disabled={isLoading}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
            
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-2 text-xs text-gray-300">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-2 bg-white rounded-full py-2 px-4 text-gray-700 hover:bg-gray-50 transition-all duration-300 border border-gray-200"
              disabled={isLoading}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        );
    }
  };

  // Determine the title based on current step and user state
  const getTitle = () => {
    if (isPostOtpVerification) {
      return 'Complete Your Profile';
    }
    
    if (user && !user.phone) {
      return 'Add Your Phone Number';
    }
    
    if (user && !user.email) {
      return 'Complete Your Profile';
    }
    
    switch (currentStep) {
      case AuthStep.VERIFY_OTP:
        return 'Verify Your Phone';
      case AuthStep.ENTER_EMAIL:
        return 'Complete Your Profile';
      case AuthStep.ENTER_PHONE_AFTER_GOOGLE:
        return 'Add Your Phone Number';
      default:
        return 'Sign up or Login';
    }
  };

  return (
    <div className="daily-card w-full max-w-lg mx-auto animate-fade-in text-white shadow-md">
      

      <p className="text-center text-sm italic mb-6">
        daily is your <span className="font-medium not-italic">goal tracking</span> and <span className="font-medium not-italic">accountability</span>
        <br />assistant, available 24/7 by phone
        <br />through <span className="font-medium not-italic">voice.ai</span>
      </p>

      <h2 className="text-xl font-semibold text-center mb-6">
        {getTitle()}
      </h2>

      {renderForm()}
      
      {currentStep !== AuthStep.INITIAL && (
        <button 
          type="button" 
          onClick={resetForm}
          className="text-blue-300 hover:underline text-xs mt-4 block mx-auto"
        >
          Start over
        </button>
      )}
      
      {/* Debug information (only in development) */}
      <DebugInfo />
    </div>
  );
};

export default AuthForm;
