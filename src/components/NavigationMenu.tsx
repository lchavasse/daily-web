import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Menu, X, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const NavigationMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const navigateTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Mobile menu button
  if (isMobile) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-md"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {isOpen && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)}>
              <div 
                className="absolute top-16 right-4 bg-white rounded-lg shadow-md py-2 w-48 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => user ? navigate('/dashboard') : navigateTo('/')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {user ? 'Dashboard' : 'Sign In'}
                </button>
                <button 
                  onClick={() => navigateTo('/info')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Info
                </button>
                <button 
                  onClick={() => navigateTo('/about')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  About
                </button>
                {user && (
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Logout button for testing (mobile) */}
        {user && (
          <div className="fixed bottom-4 left-4 z-50">
            <button 
              onClick={handleLogout}
              className="bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-md text-red-500"
              title="Logout (Testing)"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </>
    );
  }

  // Desktop navigation pill
  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        <div className="nav-pill">
          <button 
            onClick={() => user ? navigate('/dashboard') : navigateTo('/')}
            className={isActive('/') || isActive('/dashboard') ? 'nav-item-active' : 'nav-item'}
          >
            <User size={18} />
          </button>
          <button 
            onClick={() => navigateTo('/info')}
            className={isActive('/info') ? 'nav-item-active' : 'nav-item'}
          >
            <Menu size={18} />
          </button>
          <button 
            onClick={() => navigateTo('/about')}
            className={isActive('/about') ? 'nav-item-active' : 'nav-item'}
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>
      
      {/* Logout button for testing (desktop) */}
      {user && (
        <div className="fixed bottom-8 left-8 z-50">
          <button 
            onClick={handleLogout}
            className="bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-md text-red-500 hover:bg-white transition-colors"
            title="Logout (Testing)"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </>
  );
};

export default NavigationMenu;
