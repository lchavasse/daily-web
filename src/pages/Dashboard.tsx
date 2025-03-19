
import React from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import UserDashboard from '@/components/UserDashboard';
import NavigationMenu from '@/components/NavigationMenu';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, isLoading, account } = useAuth();

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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full mx-auto pt-8 pb-16">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <UserDashboard />
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Dashboard;
