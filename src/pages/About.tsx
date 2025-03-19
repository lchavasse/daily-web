
import React from 'react';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';

const About: React.FC = () => {
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
              Available 24/7 through our voice.ai platform, Daily helps you stay organized, on track, and accountable for your goals and commitments.
            </p>
            
            <p>
              Whether you're managing tasks, capturing ideas, or maintaining a journal, Daily is there to assist you every step of the way.
            </p>
            
            <p>
              Our mission is to make productivity more accessible and personalized, providing support when you need it most.
            </p>
          </div>
        </div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default About;
