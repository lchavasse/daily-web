import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <Link 
      to="/" 
      className={`block w-14 h-14 sm:w-16 sm:h-16 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-xl transition-all duration-300 hover:shadow-md ${className}`}
    >
      <img src="/splash_logo.png" alt="Logo" className="w-full h-full object-cover" />
    </Link>
  );
};

export default Logo;
