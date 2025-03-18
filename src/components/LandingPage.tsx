import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { requestCall } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SignUp } from './SignUp';


const LandingPage: React.FC = () => {
  const { user, account } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const navigate = useNavigate();

  return (
    <>
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in flex flex-col items-center">
    <div className="daily-card w-full p-4 space-y-6 rounded-lg">
        {/* Decorative tiles */}
        <div className="w-full">
          <div className="grid grid-cols-4 gap-4">
            <img src="/tile1.png" alt="" className="w-full aspect-square object-cover" />
            <img src="/tile2.png" alt="" className="w-full aspect-square object-cover" />
            <img src="/tile3.png" alt="" className="w-full aspect-square object-cover" />
            <img src="/tile4.png" alt="" className="w-full aspect-square object-cover" />
          </div>
        </div>

        {/* Title and tagline */}
        <div className="flex flex-col min-h-[200px] relative m-2 ">
          <div className="flex flex-col gap-1">
            <h1 className="text-8xl">Drowning</h1>
            <div className="flex flex-row gap-6 ml-2 items-end">
              <h1 className="text-5xl pb-1">in</h1>
              <h1 className="text-7xl">to-dos</h1>
            </div>
            <h1 className="text-6xl ml-2"> & decisions</h1>
          </div>

          <div className="absolute bottom-0 right-4 flex flex-col text-right">
            <h3 className="leading-tight">daily. is your 24/7</h3>
            <div className="flex flex-row gap-2">
              <h3 className="font-bold leading-tight">coach</h3>
              <h3 className="leading-tight">to keep you</h3>
            </div>
            <h3 className="leading-tight">accountable and</h3>
            <h3 className="leading-tight">on track.</h3>
          </div>
        </div>
    
        {isSignUp ? (
          <SignUp onBackClick={() => setIsSignUp(false)}/>
        ) : (
          <>
      {/* Main content card */}
      <div className="daily-card-contrast mx-2">
        {/* Features section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold font-['Afacad']">Register an account for:</h2>
          <ul className="space-y-2 text-lg">
            <li className="flex items-center gap-2">
              <span className="text-daily-button">•</span>
              unlimited calls & reminders
            </li>
            <li className="flex items-center gap-2">
              <span className="text-daily-button">•</span>
              secured data with sms authentication on every call
            </li>
            <li className="flex items-center gap-2">
              <span className="text-daily-button">•</span>
              a web dashboard to track goals & win
            </li>
          </ul>

          {/* Pricing section */}
          <div className="relative pt-4">
            <div className="space-y-2">
              <p className="text-lg text-gray-700">
                For less than a fancy coffee a week, gain a decision partner that never sleeps, never judges, and always has your back.
              </p>
              <p className="text-lg font-semibold">Be an early adopter - £5/month</p>
              <p className="text-sm text-gray-500 italic">
                (cancel anytime - price guaranteed for the next 6 months)
              </p>
            </div>
            <button 
              onClick={() => setIsSignUp(true)}
              className="absolute bottom-0 right-0 bg-daily-button text-white p-5 rounded-full hover:bg-opacity-90 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 17l5-5-5-5"/>
                <path d="M6 17l5-5-5-5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      </>
        )}
    </div>
    </div>
    </>
  );
};

export default LandingPage;
