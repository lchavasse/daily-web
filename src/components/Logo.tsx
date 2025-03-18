import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="block mx-auto w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-xl transition-all duration-300 hover:shadow-md animate-fade-in">
      <img src="/splash_logo.png" alt="Logo" className="w-full h-full object-cover" />
    </Link>
  );
};

export default Logo;
