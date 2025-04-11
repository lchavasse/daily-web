import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Logo from '@/components/Logo';
// Use Vite's built-in ?raw import (doesn't need a plugin)
// @ts-ignore
import onePagerContent from '../content/one-pager.md?raw';

const OnePager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle hash navigation with a small delay
  useEffect(() => {
    if (location.hash) {
      // Add a small delay to ensure content is loaded
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen p-6 relative">
      {/* Content Card */}
      <div className="daily-card animate-fade-in mb-16 mx-auto max-w-6xl">
        {/* Header with back button and logo */}
        <div className="relative flex items-center justify-center mb-12 lm">
          <button
            onClick={() => navigate('/')}
            className="absolute left-4 flex items-center text-[#200503] hover:text-[#400A07] transition-colors"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
          
          <Logo />
        </div>

        <div className="prose prose-invert max-w-none space-y-8 mx-4 [&>*:first-child]:mt-0">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-4xl font-bold text-[#200503] mb-8 w-full break-words text-center">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <div className="flex items-center space-x-3 mt-16 mb-2">
                  <div className="w-8 h-1 bg-[#200503] rounded-full"></div>
                  <h2 className="text-2xl font-semibold text-[#200503] m-0">
                    {children}
                  </h2>
                </div>
              ),
              h3: ({ children }) => (
                <h3 className="text-2xl font-semibold mt-8 text-[#200503]">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-xl font-semibold !mt-1 text-[#200503] not-prose">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="text-lg leading-relaxed text-black !mt-0 !mb-4 not-prose">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 space-y-1 !mt-2">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="text-lg text-black">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-[#200503]">
                  {children}
                </strong>
              ),
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#200503] underline hover:text-[#400A07] font-medium transition-colors"
                >
                  {children}
                </a>
              ),
            }}
          >
            {onePagerContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default OnePager;
