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

interface RegionPhone {
  region: string;
  phoneNumber: string;
  flag?: string;
}

const RequestCall: React.FC<RequestCallProps> = ({ 
  text = 'call daily. now?', 
  showLogo = false,
  logoPosition = 'left',
  isAnimationComplete = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [displayText, setDisplayText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const [showCallIcon, setShowCallIcon] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const regionPhones: RegionPhone[] = [
    { region: 'UK', phoneNumber: '+44 7449 624226', flag: '🇬🇧' },
    { region: 'US', phoneNumber: '+1 (650) 9105468', flag: '🇺🇸' },
    { region: 'EU', phoneNumber: '+358 45 4901457', flag: '🇫🇮' },
  ];

  const handlePhoneClick = (phoneNumber: string, e: React.MouseEvent) => {
    if (!isMobile) {
      e.preventDefault();
      const formattedNumber = phoneNumber.replace(/\s+/g, '');
      navigator.clipboard.writeText(formattedNumber);
      toast.success('Phone number copied to clipboard');
    }
  };

  const handleRequestCall = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the document
    if (!user?.phone) {
      toast.error('No phone number available');
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestCall(user.phone);
      if (response.success) {
        toast.success('daily. will call you now!');
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
    if (!isMenuExpanded && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
        width: Math.max(272, rect.width),
      });
    }
    setIsMenuExpanded(!isMenuExpanded);
  };

  /*
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  */

  useEffect(() => {
    if (isMenuExpanded && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
        width: Math.max(272, rect.width),
      });
    }
  }, [isMenuExpanded]);

  useEffect(() => {
    let currentIndex = 0;
    const startDelay = 1000; // 1 second delay

    // Initial delay before starting the animation
    const startTimeout = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(intervalId);
          setTypingComplete(true);
          setTimeout(() => setShowCallIcon(true), 300);
        }
      }, 60);

      return () => clearInterval(intervalId);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text]);

  if (showLogo && logoPosition === 'center') {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="animate-scale-in">
          <Logo />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" ref={menuRef}>
      <style>{fadeInAnimation}</style>
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
          transitionDelay: '200ms',
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
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isMenuExpanded ? (
            <ChevronUp size={18} color="white" />
          ) : (
            <Phone size={18} color="white" />
          )}
        </div>
      </button>

      {isMenuExpanded && (
        <div
          className="fixed inset-0 bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuExpanded(false);
          }}
          style={{ zIndex: 99998 }}
        />
      )}

      {isMenuExpanded &&
        createPortal(
          <div
            className="fixed w-72 rounded-lg shadow-xl overflow-hidden transition-all duration-300 opacity-0 animate-fade-in"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBCEB7',
              top: `${menuPosition.top + 10}px`,
              left: `${menuPosition.left}px`,
              transform: 'translateX(-50%)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              zIndex: 99999,
              animation: 'fadeIn 0.2s ease-out forwards',
            }}
          >
            <div className="p-4">
              <button
                className="w-full py-3 px-4 mb-4 rounded-lg flex items-center justify-center font-medium text-white transition-all"
                style={{ backgroundColor: '#502220' }}
                onClick={handleRequestCall}
                disabled={isLoading}
              >
                <Phone size={18} className="mr-2" />
                {isLoading ? 'Calling...' : 'Call me now'}
              </button>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-sm text-gray-500">Or call daily. directly</span>
                </div>
              </div>
              <div className="mt-2 space-y-2 items-center">
                {regionPhones.map((phone, index) => (
                  <div key={index} className="flex items-center py-2 px-2 hover:bg-gray-50 rounded-md">
                    <span className="text-lg mr-2">{phone.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{phone.region}</span>
                      <a
                        href={`tel:${phone.phoneNumber.replace(/\s+/g, '')}`}
                        onClick={(e) => handlePhoneClick(phone.phoneNumber, e)}
                        className="text-sm text-gray-500 hover:text-[#C4916A] cursor-pointer"
                      >
                        {phone.phoneNumber}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default RequestCall;