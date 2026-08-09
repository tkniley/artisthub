import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { getProfile, getArtworks } from '../db';
import type { Profile, Artwork } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [featuredWorks, setFeaturedWorks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const p = await getProfile();
        const allWorks = await getArtworks();
        setProfile(p);
        // Take featured works
        setFeaturedWorks(allWorks.filter((w) => w.isFeatured));
      } catch (err) {
        console.error("Error loading homepage data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-art-bg dark:bg-art-darkBg">
        <div className="font-serif italic text-xl text-art-muted tracking-widest animate-pulse">
          loading portfolio...
        </div>
      </div>
    );
  }

  // Exhibition highlight only when CV is enabled for the public site
  const upcomingShow =
    profile.showCv && profile.cv?.[0]?.items?.[0] ? profile.cv[0].items[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="bg-art-bg dark:bg-art-darkBg text-art-dark dark:text-art-bg transition-colors duration-500"
    >
      {/* 1. HERO SECTION */}
      <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden border-b border-art-border/30 dark:border-art-darkBorder/30">
        {/* Animated Zooming Background Image */}
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.45 }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full bg-cover bg-center select-none"
            style={{ backgroundImage: `url(${profile.heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-art-bg via-transparent to-transparent dark:from-art-darkBg" />
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-8xl tracking-wider mb-4 font-serif"
          >
            {profile.name}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-script text-4xl md:text-6xl text-[#db2777] dark:text-[#ec4899] mb-8 whitespace-nowrap normal-case tracking-normal drop-shadow-sm select-none"
          >
            {profile.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/gallery"
              id="hero-cta-gallery"
              className="px-8 py-3 text-xs uppercase tracking-widest bg-art-dark text-art-bg dark:bg-art-bg dark:text-art-dark hover:bg-art-accent dark:hover:bg-art-accent dark:hover:text-white hover:text-white transition-all duration-300"
            >
              Explore Gallery
            </Link>
            <Link
              to="/about"
              id="hero-cta-about"
              className="px-8 py-3 text-xs uppercase tracking-widest border border-art-dark/40 dark:border-art-bg/40 hover:border-art-accent hover:text-art-accent transition-all duration-300"
            >
              The Artist
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center opacity-60 pointer-events-none"
        >
          <span className="text-[9px] uppercase tracking-extra mb-1 font-sans">scroll</span>
          <ChevronDown size={14} className="text-art-muted" />
        </motion.div>
      </section>

      {/* 2. CONCEPTUAL / PHILOSOPHY STATEMENT */}
      <section className="max-w-4xl mx-auto px-6 py-28 md:py-40 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-[1px] bg-art-accent/60 mb-12" />
          <blockquote className="font-serif italic text-2xl md:text-4xl text-art-dark/90 dark:text-art-bg/95 leading-relaxed tracking-wide">
            "{profile.philosophy}"
          </blockquote>
          <div className="w-12 h-[1px] bg-art-accent/60 mt-12" />
        </motion.div>
      </section>

      {/* 3. FEATURED WORKS GRID */}
      {featuredWorks.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-8 py-12 border-t border-art-border/30 dark:border-art-darkBorder/30">
          <div className="flex justify-between items-end mb-16">
            <div>
              <p className="text-[10px] uppercase tracking-extra text-art-muted mb-2">Curated selection</p>
              <h2 className="text-3xl md:text-5xl font-serif">Featured Works</h2>
            </div>
            <Link
              to="/gallery"
              id="featured-view-all"
              className="flex items-center space-x-2 text-xs uppercase tracking-widest hover:text-art-accent transition-colors py-2"
            >
              <span>View Full Gallery</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Staggered Art Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
            {featuredWorks.map((work, idx) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className={`flex flex-col cursor-pointer ${
                  idx % 2 === 1 ? 'md:translate-y-16' : ''
                }`}
                onClick={() => navigate(`/gallery?art=${work.id}`)}
              >
                {/* Artwork Card */}
                <div className="image-zoom-container bg-art-card dark:bg-art-darkCard border border-art-border/40 dark:border-art-darkBorder/40 aspect-[4/5] relative overflow-hidden group">
                  <img
                    src={work.imageUrl}
                    alt={work.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700"
                    loading="lazy"
                  />
                  {/* Subtle hover overlay details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white text-xs tracking-widest uppercase">
                      Inquire / Details
                    </p>
                  </div>
                </div>

                {/* Artwork Metadata */}
                <div className="mt-6 flex justify-between items-baseline border-b border-art-border/40 dark:border-art-darkBorder/40 pb-4">
                  <div>
                    <h3 className="text-xl font-serif">{work.title}</h3>
                    <p className="text-xs text-art-muted dark:text-art-darkMuted font-sans mt-1">
                      {work.medium} — {work.dimensions}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif italic text-sm text-art-muted dark:text-art-darkMuted">{work.year}</p>
                    <span className="text-xs font-semibold text-art-accent mt-1 block">
                      {work.price}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Spacer for staggered grid offset */}
      <div className="h-28 sm:h-44" />

      {/* 4. CURRENT / RECENT EXHIBITION HIGHLIGHT */}
      {upcomingShow && (
        <section className="bg-art-card dark:bg-art-darkCard border-t border-b border-art-border/40 dark:border-art-darkBorder/40 transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-20 flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-24">
            
            <div className="max-w-md">
              <span className="text-[10px] uppercase tracking-extra text-art-accent block mb-3 font-semibold">
                On Exhibition
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif mb-6 leading-tight">
                Current & Upcoming Solos
              </h2>
              <p className="text-sm text-art-muted dark:text-art-darkMuted leading-relaxed">
                Experience the artwork in person. Discover curated shows exploring sculptural geometry, tactile gesso textures, and temporal voids at leading international spaces.
              </p>
            </div>

            <div className="flex-1 w-full flex flex-col justify-center space-y-6">
              {profile.cv[0].items.slice(0, 2).map((show) => (
                <div 
                  key={show.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center py-6 border-b border-art-border/40 dark:border-art-darkBorder/40 last:border-0"
                >
                  <div>
                    <span className="text-xs font-sans tracking-widest text-art-accent font-semibold">{show.year}</span>
                    <h4 className="text-lg font-serif mt-1">{show.title}</h4>
                  </div>
                  <div className="text-sm font-sans tracking-wider text-art-muted dark:text-art-darkMuted sm:text-right mt-2 sm:mt-0 italic">
                    {show.detail}
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <Link
                  to="/about"
                  id="cv-view-all"
                  className="px-6 py-2 border border-art-dark/40 dark:border-art-bg/40 text-xs tracking-widest uppercase hover:bg-art-dark hover:text-art-bg dark:hover:bg-art-bg dark:hover:text-art-dark transition-all duration-300 inline-block"
                >
                  View Full CV & Biography
                </Link>
              </div>
            </div>

          </div>
        </section>
      )}
    </motion.div>
  );
};
