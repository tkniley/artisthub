import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { GalleryPage } from './pages/GalleryPage';
import { StudioPage } from './pages/StudioPage';
import { getProfile } from './db';
import type { Profile } from './types';

// Scroll to top on route change to make page transitions feel highly polished
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Animated Route Wrapper to hook up Framer Motion transitions
const AnimatedRoutes: React.FC<{ artistName: string }> = ({ artistName }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + Shift + S
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        navigate('/studio');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dynamic Header */}
      <Navbar artistName={artistName} />
      
      {/* Route Views with AnimatePresence */}
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            
            {/* Studio Route */}
            <Route 
              path="/studio" 
              element={
                <StudioPage />
              } 
            />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Dynamic Footer */}
      <Footer artistName={artistName} />
    </div>
  );
};

export const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
    // Fetch profile to get Artist Name globally
  useEffect(() => {
    const fetchArtistName = async () => {
      try {
        const p = await getProfile();
        setProfile(p);
      } catch (err) {
        console.error("Error fetching global profile name:", err);
      }
    };
    fetchArtistName();
  }, []);

  // Keep track of CMS edits in current tab sessions by running an interval or check
  useEffect(() => {
    // Poll local DB lightly every 2 seconds to check if name changed in CMS and update instantly
    const interval = setInterval(async () => {
      try {
        const p = await getProfile();
        if (p && p.name !== profile?.name) {
          setProfile(p);
        }
      } catch (err) {
        // quiet
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [profile]);

  const artistName = profile?.name || 'Eleonora Vance';

  return (
    <Router>
      <ScrollToTop />
      <AnimatedRoutes artistName={artistName} />
    </Router>
  );
};

export default App;
