
import React from 'react';
import { Instagram, Linkedin, Play } from 'lucide-react';

const SocialLinks: React.FC = () => {
  return (
    <div className="flex justify-center gap-6 mt-8">
      <a 
        href="https://instagram.com" 
        target="_blank"
        rel="noopener noreferrer"
        className="social-circle hover:scale-105 animate-pulse-soft"
        style={{ animationDelay: '0s' }}
      >
        <Instagram size={20} />
      </a>
      <a 
        href="https://youtube.com" 
        target="_blank"
        rel="noopener noreferrer"
        className="social-circle hover:scale-105 animate-pulse-soft"
        style={{ animationDelay: '0.5s' }}
      >
        <Play size={20} />
      </a>
      <a 
        href="https://linkedin.com" 
        target="_blank"
        rel="noopener noreferrer"
        className="social-circle hover:scale-105 animate-pulse-soft"
        style={{ animationDelay: '1s' }}
      >
        <Linkedin size={20} />
      </a>
    </div>
  );
};

export default SocialLinks;
