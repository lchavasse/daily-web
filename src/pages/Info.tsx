
import React from 'react';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';
import SocialLinks from '@/components/SocialLinks';
const Info: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md mx-auto pt-8 pb-16">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="daily-card animate-fade-in">
          <p className="italic text-sm">
            daily. is constantly evolving. We apolgise for any bugs at this stage. We would be most grateful if you could contact us if you experience any issues.
          </p>

          <h2 className="text-xl font-medium mb-4 mt-4">How <strong>daily.</strong> Works</h2>
          
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-medium mb-2">Goal Tracking</h3>
              <p className="text-gray-700">
                Daily helps you set, track, and achieve your goals by providing regular check-ins and updates on your progress.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Voice Assistant</h3>
              <p className="text-gray-700">
                Interact with daily through natural conversation. daily understands context and can help you manage tasks, capture ideas, and maintain a record of your decisions and progress.
                <br />
                <br />
                <p className="italic">Lead the conversation. daily is only as good as the information you share.</p>
              </p>
            </div>
            
          </div>
        </div>
        <SocialLinks />
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Info;
