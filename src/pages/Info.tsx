
import React from 'react';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';

const Info: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md mx-auto pt-8 pb-16">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="daily-card animate-fade-in">
          <h2 className="text-xl font-medium mb-4">How Daily Works</h2>
          
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
                Interact with Daily through natural conversation. Daily understands context and can help you manage tasks, capture ideas, and maintain your journal.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">24/7 Availability</h3>
              <p className="text-gray-700">
                Daily is always available to help you, whether through the web app or by phone. Get assistance whenever you need it.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Personalized Experience</h3>
              <p className="text-gray-700">
                Daily learns your preferences and habits to provide a more tailored experience that fits your workflow.
              </p>
            </div>
          </div>
        </div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Info;
