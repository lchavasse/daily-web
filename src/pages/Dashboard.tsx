
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-2xl mx-auto pt-8 pb-16">
        <div className="mb-10">
          <Logo />
        </div>

        <UserDashboard />
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Dashboard;
