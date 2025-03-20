import { requestCall } from '@/lib/api';
import { Phone, ChevronDown, ChevronUp, X } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createPortal } from 'react-dom';
import Logo from '@/components/Logo';

// Add keyframe animation
const fadeInAnimation = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px) translateX(-50%);
    }
    to {
      opacity: 1;
      transform: translateY(0) translateX(-50%);
    }
  }
`;

interface RequestCallProps {
  text?: string;
  showLogo?: boolean;
  logoPosition?: 'center' | 'left';
  isAnimationComplete?: boolean;
}

// Define region phone numbers
interface RegionPhone {
  region: string;
  phoneNumber: string;
  flag?: string;
}

const RequestCall: React.FC<RequestCallProps> = ({ 
  text = 'Should we call now?', 
  showLogo = false,
  logoPosition = 'left',
  isAnimationComplete = true
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { user, account } = useAuth();
    const [displayText, setDisplayText] = useState('');
    const [typingComplete, setTypingComplete] = useState(false);
    const [showCallIcon, setShowCallIcon] = useState(false);
    const [isMenuExpanded, setIsMenuExpanded] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    
    // Region phone numbers
    const regionPhones: RegionPhone[] = [
      { region: 'United States', phoneNumber: '+1 (855) 555-1234', flag: '🇺🇸' },
      { region: 'United Kingdom', phoneNumber: '+44 20 7946 0958', flag: '🇬🇧' },
      { region: 'Australia', phoneNumber: '+61 2 8046 6127', flag: '🇦🇺' },
      { region: 'Canada', phoneNumber: '+1 (866) 555-4321', flag: '🇨🇦' },
      { region: 'Germany', phoneNumber: '+49 30 2555 5678', flag: '🇩🇪' },
    ];
    
    const handleRequestCall = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.phone) {
          toast.error('No phone number available');
          return;
        }

        setIsLoading(true);
        try {
          const response = await requestCall(user.phone);
          if (response.success) {
              toast.success('daily. will call you in 30s');
              setIsMenuExpanded(false);
          } else {
              toast.error('Failed to request call');
          }
        } catch (error) {
          console.error('Error requesting call:', error);
          toast.error('An error occurred');
        } finally {
          setIsLoading(false);
        }
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsMenuExpanded(!isMenuExpanded);
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuExpanded(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    // Update menu position when it's opened
    useEffect(() => {
        if (isMenuExpanded && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + rect.width / 2 + window.scrollX,
                width: Math.max(272, rect.width) // 272px is our menu width (w-72 = 18rem = 288px)
            });
        }
    }, [isMenuExpanded]);

    // Typing animation effect - start animation immediately
    useEffect(() => {
      let currentIndex = 0;
      
      const intervalId = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(intervalId);
          setTypingComplete(true);
          
          // Show call icon with a small delay after typing is complete
          setTimeout(() => {
            setShowCallIcon(true);
          }, 300);
        }
      }, 60); // Faster typing animation

      return () => clearInterval(intervalId);
    }, [text]);

    // Only the logo centered in the container
    if (showLogo && logoPosition === 'center') {
      return (
        <div className="flex justify-center items-center w-full">
          <div className="animate-scale-in">
            <Logo />
          </div>
        </div>
      );
    }

    // Logo and call button side by side
    return (
      <div className="relative flex items-center justify-center" ref={menuRef}>
        <style>{fadeInAnimation}</style>
        {/* Show logo when requested */}
        {showLogo && (
          <div className="mr-4 animate-scale-in">
            <Logo />
          </div>
        )}

        <button 
          className={`transition-all duration-300 hover:shadow-md transform hover:-translate-y-1 flex items-center ${
            isAnimationComplete ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
          style={{ 
            backgroundColor: '#EBCEB7',
            borderRadius: '2rem',
            padding: '0.75rem 1.25rem',
            width: 'auto',
            minWidth: '220px',
            transitionDelay: '200ms'
          }} 
          onClick={toggleMenu}
          disabled={isLoading}
          ref={buttonRef}
        >
          <h2 
            className="text-lg font-medium font-[Afacad] mr-3 flex-grow whitespace-nowrap"
            style={{ fontStyle: 'italic' }}
          >
            {displayText}
          </h2>
          
          {/* Call icon that appears after typing is complete */}
          <div 
            className={`rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              showCallIcon ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
            style={{
              backgroundColor: isLoading ? '#d4a28e' : '#C4916A',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              width: '2.25rem',
              height: '2.25rem',
            }}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isMenuExpanded ? <ChevronUp size={18} color="white" /> : <ChevronDown size={18} color="white" />
            )}
          </div>
        </button>

        {/* Expanded Menu - using Portal to render at the top level of DOM */}
        {isMenuExpanded && createPortal(
          <div>
            {/* Backdrop for clicking outside */}
            <div 
              className="fixed inset-0 bg-transparent" 
              onClick={() => setIsMenuExpanded(false)}
              style={{ zIndex: 99998 }}
            />
            
            {/* Menu Content */}
            <div 
              className="fixed w-72 rounded-lg shadow-xl overflow-hidden transition-all duration-300 opacity-0 animate-fade-in"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBCEB7',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                transform: 'translateX(-50%)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                zIndex: 99999,
                animation: 'fadeIn 0.2s ease-out forwards'
              }}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg text-gray-800">Contact Options</h3>
                  <button 
                    onClick={() => setIsMenuExpanded(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Call Me Now Button */}
                <button
                  className="w-full py-3 px-4 mb-4 rounded-lg flex items-center justify-center font-medium text-white transition-all"
                  style={{ backgroundColor: '#C4916A' }}
                  onClick={handleRequestCall}
                  disabled={isLoading}
                >
                  <Phone size={18} className="mr-2" />
                  {isLoading ? 'Calling...' : 'Call me now'}
                </button>
                
                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-sm text-gray-500">Or call us directly</span>
                  </div>
                </div>
                
                {/* Region Phone Numbers */}
                <div className="mt-2 space-y-2">
                  {regionPhones.map((phone, index) => (
                    <div key={index} className="flex items-center py-2 px-2 hover:bg-gray-50 rounded-md">
                      <span className="text-lg mr-2">{phone.flag}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{phone.region}</span>
                        <a 
                          href={`tel:${phone.phoneNumber.replace(/\s+/g, '')}`} 
                          className="text-sm text-gray-500 hover:text-[#C4916A]"
                        >
                          {phone.phoneNumber}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
};

export default RequestCall;
