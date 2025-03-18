import React from 'react';
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full mx-auto pt-8 pb-16">
        <div className="mb-10">
          <Logo />
        </div>
        <div className="flex justify-center mb-6">
          <RequestCall />
        </div>

        <LandingPage />
        
        <SocialLinks />
      </div>
      
      <NavigationMenu />
    </div>
  );
};

export default OpenPage;
