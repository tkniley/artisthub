import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FooterProps {
  artistName: string;
}

export const Footer: React.FC<FooterProps> = ({ artistName }) => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleCopyrightClick = () => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime > 1500) {
      setClickCount(1);
    } else {
      const newCount = clickCount + 1;
      if (newCount >= 3) {
        navigate('/studio');
        setClickCount(0);
      } else {
        setClickCount(newCount);
      }
    }
    setLastClickTime(currentTime);
  };

  return (
    <footer className="w-full border-t border-art-border/40 dark:border-art-darkBorder/40 bg-art-bg/30 dark:bg-art-darkBg/30 py-12 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 text-xs sm:text-sm tracking-widest text-art-muted dark:text-art-darkMuted uppercase">
        
        {/* Left Side: Credits */}
        <div className="text-center md:text-left select-none">
          <p 
            onClick={handleCopyrightClick} 
            className="cursor-default hover:text-art-accent/60 transition-colors duration-300"
          >
            © {currentYear} {artistName || 'ArtistHub'}. All Rights Reserved.
          </p>
          <p className="mt-1 text-[10px] lowercase text-art-muted/60 dark:text-art-darkMuted/60">
            Represented globally. Inquiries welcome.
          </p>
        </div>

        {/* Center: Social / External Links */}
        <div className="flex space-x-8">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-art-dark dark:hover:text-art-bg transition-colors duration-300"
            id="footer-link-instagram"
          >
            Instagram
          </a>
          <a
            href="https://artsy.net"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-art-dark dark:hover:text-art-bg transition-colors duration-300"
            id="footer-link-artsy"
          >
            Artsy
          </a>
          <a
            href="https://pinterest.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-art-dark dark:hover:text-art-bg transition-colors duration-300"
            id="footer-link-pinterest"
          >
            Pinterest
          </a>
        </div>

        {/* Right Side: Subtle layout balancer */}
        <div className="hidden md:block w-[1px]" />

      </div>
    </footer>
  );
};
