import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Menu, X } from 'lucide-react';

interface NavbarProps {
  artistName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ artistName }) => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Synchronize theme with state
  useEffect(() => {
    const isDark = document.body.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.body.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.body.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'About', path: '/about' },
    { name: 'Studio', path: '/studio' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-art-border/40 dark:border-art-darkBorder/40 bg-art-bg/80 dark:bg-art-darkBg/80 backdrop-blur-md transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        
        {/* Branding Logo */}
        <Link 
          to="/" 
          id="nav-logo"
          className="text-xl sm:text-2xl font-serif tracking-widest text-art-dark dark:text-art-bg hover:opacity-80 transition-opacity duration-300 uppercase"
        >
          {artistName || 'ArtistHub'}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                id={`nav-link-${item.name.toLowerCase()}`}
                className="relative text-sm tracking-widest uppercase text-art-dark/70 dark:text-art-bg/70 hover:text-art-dark dark:hover:text-art-bg transition-colors duration-300 font-sans font-medium"
              >
                {item.name}
                {isActive && (
                  <motion.span
                    layoutId="activeNavUnderline"
                    className="absolute -bottom-2 left-0 right-0 h-[1px] bg-art-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            id="nav-theme-toggle"
            aria-label="Toggle theme mode"
            className="p-2 text-art-dark/70 dark:text-art-bg/70 hover:text-art-accent dark:hover:text-art-accent hover:bg-art-card dark:hover:bg-art-darkCard rounded-full transition-all duration-300"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center space-x-4">
          <button
            onClick={toggleTheme}
            id="mobile-theme-toggle"
            aria-label="Toggle theme mode"
            className="p-2 text-art-dark/70 dark:text-art-bg/70 hover:text-art-accent rounded-full"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            id="mobile-menu-toggle"
            aria-label="Toggle mobile menu"
            className="p-2 text-art-dark dark:text-art-bg hover:text-art-accent transition-colors"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden border-b border-art-border/40 dark:border-art-darkBorder/40 bg-art-bg dark:bg-art-darkBg w-full absolute left-0 top-20 px-8 py-6 flex flex-col space-y-6 shadow-xl"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              id={`mobile-nav-link-${item.name.toLowerCase()}`}
              onClick={() => setIsOpen(false)}
              className={`text-sm tracking-widest uppercase font-medium transition-colors ${
                location.pathname === item.path
                  ? 'text-art-accent font-semibold'
                  : 'text-art-dark/70 dark:text-art-bg/70'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </motion.div>
      )}
    </header>
  );
};
