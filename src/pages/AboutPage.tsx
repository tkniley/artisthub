import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getProfile } from '../db';
import type { Profile } from '../types';

export const AboutPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const p = await getProfile();
        setProfile(p);
      } catch (err) {
        console.error("Error loading biography data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-art-bg dark:bg-art-bg">
        <div className="font-serif italic text-xl text-art-muted tracking-widest animate-pulse">
          loading biography...
        </div>
      </div>
    );
  }

  // Split bioText by newlines for clean paragraph renderings
  const bioParagraphs = profile.bioText.split('\n\n');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-art-bg dark:bg-art-darkBg text-art-dark dark:text-art-bg py-16 sm:py-24 transition-colors duration-500"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Title */}
        <header className="mb-16 sm:mb-24">
          <p className="text-[10px] uppercase tracking-extra text-art-muted mb-2">The Practitioner</p>
          <h1 className="text-4xl sm:text-6xl font-serif">Biography</h1>
        </header>

        {/* Biography Grid: Portrait & Story */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-32 items-start">
          
          {/* Left Column: Portrait */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 w-full flex justify-center"
          >
            <div className="bg-art-card dark:bg-art-darkCard border border-art-border/40 dark:border-art-darkBorder/40 aspect-[3/4] w-full max-w-md overflow-hidden relative group">
              <img
                src={profile.portraitImage}
                alt={profile.name}
                className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 transition-all duration-[1.5s]"
              />
              <div className="absolute inset-0 border-[8px] border-art-bg/20 dark:border-art-darkBg/20 pointer-events-none" />
            </div>
          </motion.div>

          {/* Right Column: Story Text */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col space-y-6 text-sm sm:text-base text-art-dark/80 dark:text-art-bg/85 font-sans leading-relaxed tracking-wide"
          >
            <h2 className="text-3xl font-serif text-art-dark dark:text-art-bg mb-4 border-b border-art-border/40 dark:border-art-darkBorder/40 pb-4">
              {profile.name}
            </h2>
            
            {bioParagraphs.map((para, idx) => (
              <p key={idx} className="whitespace-pre-line last:mb-0">
                {para}
              </p>
            ))}
          </motion.div>

        </section>

        {/* Curriculum Vitae (CV) Section */}
        {profile.cv && profile.cv.length > 0 && (
          <section className="border-t border-art-border/40 dark:border-art-darkBorder/40 pt-20">
            
            <header className="mb-12">
              <p className="text-[10px] uppercase tracking-extra text-art-muted mb-2">Exhibitions & Education</p>
              <h2 className="text-3xl sm:text-5xl font-serif">Curriculum Vitae</h2>
            </header>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16"
            >
              {profile.cv.map((sec) => (
                <motion.div 
                  key={sec.id}
                  variants={itemVariants}
                  className="flex flex-col space-y-8"
                >
                  {/* Category Header */}
                  <h3 className="text-lg font-serif uppercase tracking-widest text-art-accent border-b border-art-border/40 dark:border-art-darkBorder/40 pb-3">
                    {sec.category}
                  </h3>

                  {/* Category Items */}
                  <div className="flex flex-col space-y-6">
                    {sec.items.map((item) => (
                      <div key={item.id} className="text-sm font-sans tracking-wide">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="font-semibold text-art-dark dark:text-art-bg min-w-[36px]">
                            {item.year}
                          </span>
                          <span className="font-serif italic text-art-dark dark:text-art-bg text-right flex-1">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-art-muted dark:text-art-darkMuted mt-1 leading-normal text-right">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                </motion.div>
              ))}
            </motion.div>

          </section>
        )}

        {/* Connect / Contact Panel */}
        <section className="mt-32 border-t border-art-border/40 dark:border-art-darkBorder/40 pt-20 max-w-3xl mx-auto text-center flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-extra text-art-muted mb-4">Representation & Inquiries</span>
          <h2 className="text-3xl sm:text-4xl font-serif mb-6">Contact the Studio</h2>
          <p className="text-sm text-art-muted dark:text-art-darkMuted mb-8 max-w-xl leading-relaxed">
            For acquisitions, press kits, catalogs, or private viewing appointments, please contact our administrative studio. We welcome inquiries from curators and collectors globally.
          </p>
          <a
            href={`mailto:studio@${profile.name.toLowerCase().replace(/\s+/g, '')}.com`}
            className="text-lg sm:text-xl font-serif border-b border-art-accent hover:border-art-dark dark:hover:border-art-bg text-art-accent transition-colors duration-300 pb-1"
          >
            studio@{profile.name.toLowerCase().replace(/\s+/g, '')}.com
          </a>
        </section>

      </div>
    </motion.div>
  );
};
