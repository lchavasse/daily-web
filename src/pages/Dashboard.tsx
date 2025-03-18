
import React from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import UserDashboard from '@/components/UserDashboard';
import NavigationMenu from '@/components/NavigationMenu';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();

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

  return (
    <div className="min-h-screen p-6 relative">
      <div className="max-w-2xl mx-auto pt-8 pb-16">
        <div className="mb-10">
          <Logo />
        </div>

        <div className="daily-card bg-brown-300 mb-6 shadow-md text-white">
          <h2 className="text-lg font-medium mb-2">Hello, {user.email.split('@')[0]}</h2>
          <p className="text-white/90 text-sm">How can I help you today?</p>
        </div>

        <UserDashboard />
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Dashboard;
