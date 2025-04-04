import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';
import { useAuth } from '@/contexts/AuthContext';
import UserDashboard from '@/components/UserDashboard';
import SocialLinks from '@/components/SocialLinks';
import RequestCall from '@/components/RequestCall';
import { usePayment } from '@/contexts/PaymentContext';
import { fetchUserProfileForDashboard } from '@/lib/api';
const Dashboard: React.FC = () => {
  const { user, account, isLoading } = useAuth();
  const userId = user?.id;
  const { subscriptionStatus } = usePayment();
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [logoPosition, setLogoPosition] = useState('center');
  const [isMobile, setIsMobile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('Dashboard page - Auth state:', { 
      user: user ? 'logged in' : 'not logged in', 
      userId, 
      account, 
      isLoading,
      subscriptionStatus
    });
  }, [user, userId, account, isLoading, subscriptionStatus]);

  useEffect(() => {
    if (userId) {
      const loadProfile = async () => {
        const userData = await fetchUserProfileForDashboard(userId);
        console.log('User data:', userData);
        setUserProfile(userData);
      };
      
      loadProfile();
    }
  }, [userId]);

  // Detect if the device is mobile based on screen width
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Animation sequence
  useEffect(() => {
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
          }, 1000); // Delay before showing landing page content
        }, 300);
      }, 400);
      
    }, 600); // Delay before starting the sequence
    
    return () => clearTimeout(logoTimer);
  }, [isMobile]);

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

  if (account != 'closed') {
    return <Navigate to="/welcome" replace />;
  }


  return (
    <div className="min-h-screen flex flex-col justify-center items-center overflow-y-auto">
      <div className="w-full mx-auto pt-8 pb-6 ">
        {/* Animated header section - Different layouts for mobile and desktop */}
        {isMobile ? (
          // Mobile layout - Logo stacked above call request
          <div className="mb-6 flex flex-col items-center space-y-4 w-full px-2">
            {/* Logo centered at the top */}
            <div className="flex justify-center animate-scale-in">
              <Logo />
            </div>
            
            {/* Call request below logo */}
            <div 
              className={`transition-all duration-700 ease-in-out transform w-full max-w-[90vw] ${
                logoAnimationComplete 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              {logoAnimationComplete && <RequestCall text={userProfile?.start_q} />}
            </div>
          </div>
        ) : (
          // Desktop layout with integrated logo and call request
          <div className="mb-6 flex justify-center">
            {logoPosition === 'center' && !logoAnimationComplete ? (
              // Initial state: logo centered
              <RequestCall 
                text={userProfile?.start_q} 
                showLogo={true} 
                logoPosition="center" 
                isAnimationComplete={logoAnimationComplete}
              />
            ) : (
              // After animation: logo and call request side by side
              <RequestCall 
                text={userProfile?.start_q} 
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
          <UserDashboard />
          
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

export default Dashboard;
