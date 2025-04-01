import React, { useState, useEffect, useRef } from 'react';
import { Phone, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { requestCall } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import SignUp from './SignUp';


const LandingPage: React.FC = () => {
  const { user, account } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Detect if the device is mobile based on screen width
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkIfMobile();
    
    // Set expanded state based on device on initial load
    setIsExpanded(window.innerWidth < 768);
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Toggle expanded state for info section
  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Auto-scroll when expanded - only for desktop
    if (!isMobile && newExpandedState) {
      // First wait for the state to update and animation to start
      setTimeout(() => {
        window.scrollBy({
          top: 300, // this seems to be doing the scroll!!!
          behavior: 'smooth'
        });
      }, 400);
    } else if (!isMobile) {
      // Scroll back to top of card when collapsing - only for desktop
      if (cardRef.current) {
        cardRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  // Handle resize events - only for desktop
  useEffect(() => {
    const handleResize = () => {
      if (isExpanded && !isMobile) {
        window.scrollBy({
          top: 500,
          behavior: 'smooth'
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded, isMobile]);
  
  // Content for the details/form section
  const renderDetailsContent = () => {
    if (isSignUp) {
      return <SignUp onBackClick={() => setIsSignUp(false)}/>;
    }
    
    return (
      <>
        {/* Info content */}
        <div className="daily-card-contrast mx-0 mt-1 border-t border-gray-400/20">
          {/* Features section */}
          <div 
            className={`space-y-4 pb-1 ${isMobile ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            onClick={() => isMobile && setIsSignUp(true)}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold font-['Afacad']">Register an account for:</h2>
              {isMobile && (
                <ChevronRight size={24} className="text-daily-button" />
              )}
            </div>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span className="text-daily-button mt-1.5">•</span>
                <div>
                  <strong>Unlimited</strong> calls & reminders
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-daily-button mt-1.5">•</span>
                <div>
                  secured data with sms authentication on every call
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-daily-button mt-1.5">•</span>
                <div>
                  <div><strong>Launching 01.04.2025</strong></div>
                  <div>a web dashboard to track goals</div>
                </div>
              </li>
            </ul>

            {/* Pricing section */}
            <div className="relative pt-2">
              <div className="space-y-2">
                <p className="text-md italic text-gray-700">
                  For less than a fancy coffee a week, gain a decision partner that never sleeps, never judges, and always has your back.
                </p>
                <p className="text-lg font-semibold">Be an early adopter - £5/month - 7 day free trial</p>
                <p className="text-sm text-gray-500 italic">
                  (cancel anytime - price guaranteed for the next 6 months)
                </p>
              </div>
              {!isMobile && (
              <button 
                onClick={() => setIsSignUp(true)}
                className={`absolute right-0 bg-daily-button text-white hover:bg-opacity-90 transition-all duration-300 rounded-full ${
                  isMobile 
                  ? 'p-3 bottom-12' // Smaller button and higher positioning on mobile
                  : 'p-4 bottom-0' // Original size on desktop
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" 
                  width={isMobile ? "22" : "28"} 
                  height={isMobile ? "22" : "28"} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M13 17l5-5-5-5"/>
                  <path d="M6 17l5-5-5-5"/>
                </svg>
              </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in flex flex-col items-center">
      {/* Main card section with tiles and headline */}
      <div className="w-full">
        <div 
          ref={cardRef}
          className="daily-card w-full p-4 rounded-lg transition-all duration-500"
          id="main-card"
        >
          {/* Decorative tiles */}
          <div className="w-full">
            <div className="grid grid-cols-4 gap-4">
              <img src="/tile1.png" alt="" className="w-full aspect-square object-cover" />
              <img src="/tile2.png" alt="" className="w-full aspect-square object-cover" />
              <img src="/tile3.png" alt="" className="w-full aspect-square object-cover" />
              <img src="/tile4.png" alt="" className="w-full aspect-square object-cover" />
            </div>
          </div>

          {/* Title and tagline - Different styles for mobile vs desktop */}
          {isMobile ? (
            // Mobile version - Title with consistent size over two lines
            <div className="flex flex-col m-2 mt-6 mb-4">
              <div className="flex flex-col mb-6">
                <h1 className="text-4xl font-bold leading-tight">Drowning in</h1>
                <h1 className="text-4xl font-bold leading-tight">to-dos & decisions</h1>
              </div>

              {/* Tagline below the title on mobile */}
              <div className="mt-2 text-xl">
                <p className="leading-tight italic">daily. is your 24/7 <span className="font-bold">coach</span> to keep</p>
                <p className="leading-tight italic">you accountable and on track.</p>
              </div>
            </div>
          ) : (
            // Desktop version - Original style with varying sizes
            <div className="flex flex-col relative m-2 mt-4 mb-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-7xl sm:text-8xl">Drowning</h1>
                <div className="flex flex-row gap-6 ml-2 items-end">
                  <h1 className="text-4xl sm:text-5xl pb-1">in</h1>
                  <h1 className="text-6xl sm:text-7xl">to-dos</h1>
                </div>
                <h1 className="text-5xl sm:text-6xl ml-2"> & decisions</h1>
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
          )}
          
          {/* Toggle indicator - Only shown on desktop */}
          {!isMobile && (
            <div 
              className="flex justify-center cursor-pointer transition-transform duration-300 mx-auto"
              onClick={toggleExpanded}
            >
              {isExpanded ? (
                <ChevronUp size={24} />
              ) : (
                <ChevronDown size={24} className="animate-bounce" />
              )}
              <span className="sr-only">{isExpanded ? 'Show less' : 'Show more'}</span>
            </div>
          )}

          {/* Expandable info section - Only within the card on desktop */}
          {!isMobile && (
            <div 
              id="expandable-content"
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isExpanded 
                  ? 'max-h-[800px] opacity-100 mt-5' 
                  : 'max-h-0 opacity-0 mt-0 pointer-events-none'
              }`}
            >
              {renderDetailsContent()}
            </div>
          )}
        </div>
        
        {/* Separate details section for mobile - Always visible, outside the card */}
        {isMobile && (
          <div className="w-full p-0 rounded-lg mt-6">
            {renderDetailsContent()}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default LandingPage;
