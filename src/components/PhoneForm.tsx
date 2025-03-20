import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, ChevronDown, Loader2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCountries, getCountryCallingCode, CountryCode } from 'libphonenumber-js';

// Get all countries and their calling codes
const allCountries = getCountries().map(country => ({
  code: `+${getCountryCallingCode(country as CountryCode)}`,
  country,
  name: new Intl.DisplayNames(['en'], { type: 'region' }).of(country) || country
})).sort((a, b) => a.name.localeCompare(b.name));

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
  const [searchQuery, setSearchQuery] = useState('');

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allCountries.filter(country => 
      country.name.toLowerCase().includes(query) || 
      country.code.includes(query) ||
      country.country.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Handle country code selection
  const selectCountryCode = (code: string) => {
    setCountryCode(code);
    setShowCountryDropdown(false);
    setSearchQuery('');
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
      
      if (success) {
        setOtp('');
        toast.success('Verification successful!');
      } else if (error) {
        setOtpError(error);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
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
                  className="daily-input text-gray-800 flex items-center justify-between gap-1 w-24 h-10"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <span>{countryCode}</span>
                  <ChevronDown size={16} />
                </button>
                
                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg z-10 w-64">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                          placeholder="Search countries..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCountries.map((country) => (
                        <button
                          key={country.country}
                          type="button"
                          className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                          onClick={() => selectCountryCode(country.code)}
                        >
                          <span className="mr-2">{country.country}</span>
                          <span className="text-gray-500">{country.code}</span>
                          <span className="ml-auto text-gray-400 text-xs">{country.name}</span>
                        </button>
                      ))}
                    </div>
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
