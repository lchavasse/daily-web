import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';
import SocialLinks from '@/components/SocialLinks';

const Info: React.FC = () => {
  const [showRoadmap, setShowRoadmap] = useState(false);
  const location = useLocation();

  // Check for the roadmap parameter when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('view') === 'roadmap') {
      setShowRoadmap(true);
    }
  }, [location]);

  const toggleRoadmap = () => {
    setShowRoadmap(!showRoadmap);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md mx-auto pt-8 pb-16">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="daily-card animate-fade-in">
          {showRoadmap ? (
            <>
              <button 
                className="text-sm text-gray-500 hover:text-gray-700 mb-4" 
                onClick={toggleRoadmap}
              >
                ← back
              </button>
              
              <h2 className="text-xl font-medium mb-4">Our Roadmap</h2>
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-medium mb-2">→ 07.04</h3>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>daily. will proactively reschedule calls to keep you on track</li>
                    <li>daily. will respond to sms to add context to your calls</li>
                    <li>you can control reminders from the web dashboard</li>
                    <li>tasks & reminders will be unified for simplicity</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">→ 14.04</h3>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>improved separation of context for conversations
                      <ul className="pl-5 italic text-gray-600">
                        <li>talk about different areas of your life at different times</li>
                      </ul>
                    </li>
                    <li>you can customise daily's tone & personality
                      <ul className="pl-5 text-gray-600">
                        <li>choose more voices</li>
                      </ul>
                    </li>
                    <li>multiple notes / ideas will replace the single notes page
                      <ul className="pl-5 text-gray-600">
                        <li>these will be able to be created by daily. for you to refer to</li>
                      </ul>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">→ 28.04</h3>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>journal restructure: add items to future days - get prompts from daily. - improve automation</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">→ 01.06</h3>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Mobile app to handle calls, messages and reminders directly</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="italic text-sm">
                daily. is constantly evolving. We apologise for any bugs at this stage. We would be most grateful if you could contact us if you experience any issues.
              </p>

              <button 
                className="text-md mt-2 text-[#502220] hover:text-[#250604] underline italic" 
                onClick={toggleRoadmap}
              >
                view our roadmap
              </button>

              <h2 className="text-2xl font-medium mb-4 mt-4">How <strong>daily.</strong> Works?</h2>
              
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-medium mb-2">Goal Tracking</h3>
                  <p className="text-gray-700">
                    Daily helps you set, track, and achieve your goals by providing regular check-ins and updates on your progress.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Reminders</h3>
                  <p className="text-gray-700">
                    Daily can schedule calls and text reminders to keep you on track.
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
            </>
          )}
        </div>
        <SocialLinks />
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Info;
