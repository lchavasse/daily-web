import React from 'react';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';
import { useNavigate } from 'react-router-dom';
import SocialLinks from '@/components/SocialLinks';

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md mx-auto pt-8 pb-16">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="daily-card animate-fade-in">
          <h2 className="text-xl font-medium mb-4">About Daily</h2>
          
          <div className="space-y-4 text-sm">
            <p>
              Daily is your personal AI voice assistant focused on goal tracking and accountability.
            </p>
            <p>
              Your privacy is important to us. We store your data on a secure server and will never sell it to third parties.
              For full details, please see our privacy policy below.
            </p>
            <p className="italic">
              Built by <a href="https://linkedin.com/in/lachlan-chavasse" className="text-daily-button">Lachlan Chavasse</a> from Nile Street Ltd.
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-4">
          <button
            onClick={() => navigate('/privacy-policy')}
            className="flex-1 px-6 py-4 bg-[#B48261] text-white text-lg font-medium rounded-2xl hover:opacity-90 transition-all shadow-lg"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => window.location.href = 'mailto:daily@nile-street.com'}
            className="flex-1 px-6 py-4 bg-[#B48261] text-white text-lg font-medium rounded-2xl hover:opacity-90 transition-all shadow-lg"
          >
            Contact Us
          </button>
        </div>
        <SocialLinks />
      </div>

      <NavigationMenu />
    </div>
  );
};

export default About;
