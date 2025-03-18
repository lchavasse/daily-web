import React from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import RequestCallForm from '@/components/RequestCallForm';
import AuthForm from '@/components/AuthForm';
import SocialLinks from '@/components/SocialLinks';
import NavigationMenu from '@/components/NavigationMenu';
import { useAuth } from '@/contexts/AuthContext';

const Index: React.FC = () => {
  const { user, isLoading, signupComplete, pendingAction } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (user && signupComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full mx-auto pt-8 pb-16">
        <div className="mb-10">
          <Logo />
        </div>

        <RequestCallForm />
        <AuthForm />
        <SocialLinks />
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Index;
