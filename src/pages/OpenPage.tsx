import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/components/LandingPage';
import SocialLinks from '@/components/SocialLinks';
import RequestCall from '@/components/RequestCall';
import { usePayment } from '@/contexts/PaymentContext';

const OpenPage: React.FC = () => {
  const { user, account, isLoading } = useAuth();
  const { subscriptionStatus } = usePayment();
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [logoPosition, setLogoPosition] = useState('center');
  const [isMobile, setIsMobile] = useState(false);
  const didMountRef = useRef(false);

  // Improved scroll to top function
  const scrollToTop = () => {
    // Try multiple scroll methods to ensure it works across browsers
    window.scrollTo(0, 0);
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
    
    // For iOS Safari specifically
    if ('scrollTo' in document.body) {
      document.body.scrollTo(0, 0);
    }
    
    // Also try setting scroll position directly
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  };

  // Scroll to top with a slight delay after component fully mounts and DOM is ready
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      
      // Use a small delay to ensure DOM is fully rendered
      const scrollTimer = setTimeout(() => {
        scrollToTop();
      }, 50);
      
      return () => clearTimeout(scrollTimer);
    }
  }, []);

  // Detect if the device is mobile based on screen width
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
    };
    
    // Check initially
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (account == 'closed') {
    return <Navigate to="/dashboard" replace />;
  }

  // Animation sequence
  useEffect(() => {
    // Ensure we're at the top before animations start
    scrollToTop();
    
    // Step 1: Logo animation appears centered
    const logoTimer = setTimeout(() => {
      // Step 2: Begin shifting logo position
      setTimeout(() => {
        // Only shift logo left on desktop
        if (!isMobile) {
          setLogoPosition('left');
        }
        
        // Step 3: After logo animation, show the call request
        setTimeout(() => {
          setLogoAnimationComplete(true);
          
          // Step 4: After logo is visible and call request is typing, prepare for landing page
          setTimeout(() => {
            setShowLandingPage(true);
            // One final scroll check after content is loaded
            scrollToTop();
          }, 1000); // Delay before showing landing page content
        }, 300);
      }, 400);
      
    }, 600); // Delay before starting the sequence
    
    return () => clearTimeout(logoTimer);
  }, [isMobile]);

  // Additional effect specifically for handling the initial scroll
  useEffect(() => {
    // Force scroll position after the component is fully mounted
    const initialScrollTimer = setTimeout(() => {
      scrollToTop();
    }, 300);
    
    // Also handle iOS Safari's delayed rendering behavior
    const handlePageLoad = () => {
      scrollToTop();
    };
    
    window.addEventListener('load', handlePageLoad);
    document.addEventListener('readystatechange', handlePageLoad);
    
    return () => {
      clearTimeout(initialScrollTimer);
      window.removeEventListener('load', handlePageLoad);
      document.removeEventListener('readystatechange', handlePageLoad);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user has an active subscription, redirect to dashboard
  /* THIS ISN"T QUITE WORKING YET
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
    return <Navigate to="/dashboard" replace />;
  }
  */

  return (
    <div className="min-h-screen flex flex-col justify-center overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto pt-8 px-6 pb-6">
        {/* Animated header section - Different layouts for mobile and desktop */}
        {isMobile ? (
          // Mobile layout - Logo stacked above call request
          <div className="mb-6 flex flex-col items-center space-y-4">
            {/* Logo centered at the top */}
            <div className="flex justify-center animate-scale-in">
              <Logo />
            </div>
            
            {/* Call request below logo */}
            <div 
              className={`transition-all duration-700 ease-in-out transform ${
                logoAnimationComplete 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              {logoAnimationComplete && <RequestCall />}
            </div>
          </div>
        ) : (
          // Desktop layout with integrated logo and call request
          <div className="mb-6 flex justify-center">
            {logoPosition === 'center' && !logoAnimationComplete ? (
              // Initial state: logo centered
              <RequestCall 
                showLogo={true} 
                logoPosition="center" 
                isAnimationComplete={logoAnimationComplete}
              />
            ) : (
              // After animation: logo and call request side by side
              <RequestCall 
                showLogo={true} 
                logoPosition="left" 
                isAnimationComplete={logoAnimationComplete}
              />
            )}
          </div>
        )}
        
        {/* Main Content - Appears after header animations */}
        <div 
          className={`transition-opacity duration-700 ease-in-out ${
            showLandingPage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <LandingPage />
          
          <div className="mt-6 mb-6">
            <SocialLinks />
          </div>
        </div>
      </div>
      
      {/* Fixed navigation at bottom */}
      <div className="fixed bottom-5 left-0 right-5 z-10">
        <NavigationMenu />
      </div>
    </div>
  );
};

export default OpenPage;
