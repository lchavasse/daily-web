import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

const PhoneForm: React.FC = () => {
  // Get auth functions from context
  const { 
    initiateOtpSignIn, 
    verifyOtp, 
    completeSignUpWithEmail,
    signupWithGoogle,
    addPhoneAfterGoogleSignup,
    isLoading: authIsLoading,
    pendingAction,
    pendingData,
    user
  } = useAuth();

  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countryCode, setCountryCode] = useState('+44');
  const [otp, setOtp] = useState('');
  const [enteredPhone, setEnteredPhone] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

   // Handle country code selection
   const selectCountryCode = (code: string) => {
    setCountryCode(code);
    setShowCountryDropdown(false);
  };

  // Handle phone submission (initial step)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      setIsLoading(true);
      setEnteredPhone(true);
      const fullPhone = `${countryCode}${phone}`;
      console.log('Initiating OTP sign-in with phone:', fullPhone);
      await initiateOtpSignIn(fullPhone);
      // The step will be updated by the useEffect hook when pendingAction changes
    } catch (error) {
      console.error('Phone submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Verifying OTP:', otp);
      const { success, error } = await verifyOtp(otp);
      console.log('OTP verification result:', success);
      
      if (success) {
        // Set flag to force email step after OTP verification
        console.log('OTP verified successfully, setting post-OTP flag');
        setOtp('');
        
        toast.success('Verification successful!');
      } else if (error) {
        setOtpError(error);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      // Extract the error message from the AuthApiError
      const errorMessage = error?.message || 'An unexpected error occurred';
      setOtpError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setEnteredPhone(false);
    setOtp('');
    setOtpError(null);
  };

  return (
    <div className="daily-card w-full max-w-lg mx-auto mb-6 animate-fade-in">

      {isLoading ? (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : !enteredPhone ? (
        <>
        <h2 className="text-sm font-medium mb-4">daily. works with your phone - enter your number to get started</h2>
        <form onSubmit={handlePhoneSubmit}>
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
                    disabled={isLoading || authIsLoading}
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  className="daily-btn rounded-full p-2"
                  disabled={isLoading || authIsLoading}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </>
      ) : (
        <>
        <h2 className="text-sm font-medium mb-4">daily. works with your phone - please verify to reduce spam</h2>
        <form onSubmit={handleOtpSubmit}>
          <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={handleRestart}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
            disabled={isLoading}
          >
            <ArrowLeft size={16} />
          </button>
            <div className="flex-1">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="daily-input text-gray-800"
                placeholder={`Enter OTP sent to ${pendingData?.phone}`}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <button type="submit" className="daily-btn rounded-full p-2" disabled={isLoading}>
              <ArrowRight size={18} />
            </button>
          </div>
          {otpError && (
            <div className="mt-2 text-sm text-red-500">
              {otpError}. <button type="button" onClick={handleRestart} className="text-blue-500 hover:underline">Click here to restart</button>
            </div>
          )}
        </form>
        </>
      )}
    </div>
  );
};

export default PhoneForm;
