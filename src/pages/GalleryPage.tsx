import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, Info } from 'lucide-react';
import { getArtworks, getCollections, getProfile, saveInquiry } from '../db';
import type { Artwork, Inquiry } from '../types';

export const GalleryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Core portfolio state
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [artistName, setArtistName] = useState('Vonder Gray');
  const [activeCollection, setActiveCollection] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Selected artwork for the Modal
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  // Inquiry Form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Fetch portfolio data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allWorks, list, profile] = await Promise.all([
          getArtworks(),
          getCollections(),
          getProfile(),
        ]);
        // Filter: only show pieces intended for the main gallery
        setArtworks(allWorks.filter((art) => art.isGallery));
        setCollections(list);
        if (profile.name?.trim()) setArtistName(profile.name.trim());
      } catch (err) {
        console.error("Error fetching gallery data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Check URL params for deep-linking an artwork
  useEffect(() => {
    if (artworks.length > 0) {
      const artId = searchParams.get('art');
      if (artId) {
        const found = artworks.find((art) => art.id === artId);
        if (found) {
          openArtworkDetails(found);
        } else {
          // If not found in gallery works, clear param
          searchParams.delete('art');
          setSearchParams(searchParams);
        }
      } else {
        setSelectedArtwork(null);
      }
    }
  }, [searchParams, artworks]);

  const openArtworkDetails = (art: Artwork) => {
    setSelectedArtwork(art);
    // Prefill inquiry form message
    setInquiryMessage(
      `Dear ${artistName},\n\nI am highly interested in inquiring about your piece titled "${art.title}" (${art.year}). Please provide information regarding availability, acquisition pricing, and logistics/shipping details.\n\nBest regards.`
    );
    setInquirySubmitted(false);
    
    // Set query param in URL
    setSearchParams({ art: art.id });
  };

  const closeArtworkDetails = () => {
    setSelectedArtwork(null);
    setInquiryName('');
    setInquiryEmail('');
    setInquiryMessage('');
    setInquirySubmitted(false);
    
    // Clear query param
    searchParams.delete('art');
    setSearchParams(searchParams);
  };

  // Submit inquiry to the cloud API
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtwork || !inquiryName || !inquiryEmail || !inquiryMessage) return;

    setSubmittingInquiry(true);
    try {
      const newInquiry: Inquiry = {
        id: `inq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        artworkId: selectedArtwork.id,
        artworkTitle: selectedArtwork.title,
        name: inquiryName,
        email: inquiryEmail,
        message: inquiryMessage,
        createdAt: Date.now(),
        status: 'unread',
      };
      await saveInquiry(newInquiry);
      setInquirySubmitted(true);
    } catch (err) {
      console.error("Failed to submit inquiry:", err);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Filter artworks by collection
  const filteredArtworks = artworks.filter((art) => {
    if (activeCollection === 'All') return true;
    return art.collections.includes(activeCollection);
  });

  // Calculate artwork count for each collection
  const getCollectionCount = (colName: string) => {
    if (colName === 'All') return artworks.length;
    return artworks.filter((art) => art.collections.includes(colName)).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-art-bg dark:bg-art-darkBg">
        <div className="font-serif italic text-xl text-art-muted tracking-widest animate-pulse">
          opening gallery vaults...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-art-bg dark:bg-art-darkBg text-art-dark dark:text-art-bg min-h-screen py-16 sm:py-24 transition-colors duration-500"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Page Title */}
        <header className="mb-16 border-b border-art-border/40 dark:border-art-darkBorder/40 pb-8">
          <p className="text-[10px] uppercase tracking-extra text-art-muted mb-2">Curated archive</p>
          <h1 className="text-4xl sm:text-6xl font-serif">The Gallery</h1>
        </header>

        {/* Gallery Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* A. LEFT SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-3 lg:sticky lg:top-28">
            <h2 className="text-[11px] uppercase tracking-extra text-art-muted mb-6 font-sans font-semibold">
              Browse Collections
            </h2>
            
            {/* Horizontal scroll list on small devices, vertical on larger */}
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-1 pb-4 lg:pb-0 no-scrollbar">
              {['All', ...collections].map((colName) => {
                const count = getCollectionCount(colName);
                if (count === 0 && colName !== 'All') return null; // Hide empty tags
                const isActive = activeCollection === colName;

                return (
                  <button
                    key={colName}
                    onClick={() => setActiveCollection(colName)}
                    id={`collection-btn-${colName.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`flex items-center justify-between text-left px-4 py-3 text-xs tracking-widest uppercase transition-all duration-300 font-medium whitespace-nowrap lg:whitespace-normal border-b lg:border-b-0 lg:border-l ${
                      isActive
                        ? 'border-art-accent text-art-accent lg:bg-art-card/50 dark:lg:bg-art-darkCard/50 pl-5'
                        : 'border-transparent text-art-dark/60 dark:text-art-bg/60 hover:text-art-dark dark:hover:text-art-bg pl-4'
                    }`}
                  >
                    <span>{colName}</span>
                    <span className="ml-3 text-[10px] text-art-muted font-sans font-light bg-art-border/30 dark:bg-art-darkBorder/30 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* B. MAIN GALLERY GRID */}
          <main className="lg:col-span-9">
            
            {filteredArtworks.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-art-border dark:border-art-darkBorder">
                <p className="font-serif italic text-lg text-art-muted">
                  No artworks seeded in this collection.
                </p>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-8 gap-y-16"
              >
                <AnimatePresence mode="popLayout">
                  {filteredArtworks.map((work) => (
                    <motion.div
                      key={work.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => openArtworkDetails(work)}
                      className="flex flex-col cursor-pointer group"
                    >
                      {/* Image Frame */}
                      <div className="image-zoom-container bg-art-card dark:bg-art-darkCard border border-art-border/40 dark:border-art-darkBorder/40 aspect-[4/5] overflow-hidden relative">
                        <img
                          src={work.imageUrl}
                          alt={work.title}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700"
                          loading="lazy"
                        />
                        
                        {/* Status Label (if sold/reserved) */}
                        {work.status !== 'available' && (
                          <div className={`absolute top-4 left-4 px-3 py-1 text-[9px] uppercase tracking-widest text-white select-none ${
                            work.status === 'sold' ? 'bg-red-950/80' : 'bg-amber-950/80'
                          }`}>
                            {work.status}
                          </div>
                        )}
                        
                        {/* Immersive overlay button */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="px-6 py-2 border border-white text-white text-[10px] tracking-extra uppercase">
                            View Details
                          </span>
                        </div>
                      </div>

                      {/* Details Row */}
                      <div className="mt-4 flex justify-between items-baseline border-b border-art-border/40 dark:border-art-darkBorder/40 pb-3">
                        <div>
                          <h3 className="text-lg font-serif">{work.title}</h3>
                          <p className="text-xs text-art-muted dark:text-art-darkMuted font-sans mt-0.5">
                            {work.medium}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-serif text-art-muted dark:text-art-darkMuted block">
                            {work.year}
                          </span>
                          <span className="text-xs font-semibold text-art-accent mt-0.5 block">
                            {work.status === 'available' ? work.price : work.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </main>
        </div>

      </div>

      {/* C. FULL-SCREEN ARTWORK DETAILS OVERLAY MODAL */}
      <AnimatePresence>
        {selectedArtwork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-art-dark/95 backdrop-blur-md flex justify-center items-center p-4 md:p-8"
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              id="gallery-modal"
              className="bg-art-bg dark:bg-art-darkBg text-art-dark dark:text-art-bg w-full max-w-6xl shadow-2xl relative grid grid-cols-1 lg:grid-cols-12 overflow-hidden border border-art-border/30 dark:border-art-darkBorder/30"
            >
              
              {/* Close Button */}
              <button
                onClick={closeArtworkDetails}
                id="gallery-modal-close"
                aria-label="Close modal details"
                className="absolute top-4 right-4 z-10 p-3 bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent dark:hover:bg-art-accent hover:text-white transition-all duration-300"
              >
                <X size={16} />
              </button>

              {/* 1. Image Showcase Column (Left 7 Cols) */}
              <div className="lg:col-span-7 bg-black flex items-center justify-center relative aspect-[4/5] lg:aspect-auto min-h-[40vh] lg:min-h-[70vh]">
                <img
                  src={selectedArtwork.imageUrl}
                  alt={selectedArtwork.title}
                  className="max-w-full max-h-[75vh] object-contain select-none"
                />
              </div>

              {/* 2. Metadata & Inquiry Column (Right 5 Cols) */}
              <div className="lg:col-span-5 p-8 md:p-12 overflow-y-auto max-h-[85vh] lg:max-h-[75vh] flex flex-col justify-between">
                
                {/* Upper Metadata Block */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-[10px] font-sans font-semibold text-art-accent tracking-widest uppercase bg-art-accent/10 px-2 py-0.5 rounded-full">
                      {selectedArtwork.year}
                    </span>
                    <span className={`text-[10px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                      selectedArtwork.status === 'available'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : selectedArtwork.status === 'sold'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {selectedArtwork.status}
                    </span>
                  </div>

                  <h2 className="text-3xl font-serif leading-tight mb-2">
                    {selectedArtwork.title}
                  </h2>
                  
                  <div className="space-y-1 mb-8">
                    <p className="text-sm text-art-dark/80 dark:text-art-bg/90 font-sans tracking-wide">
                      <span className="font-semibold">Medium:</span> {selectedArtwork.medium}
                    </p>
                    <p className="text-sm text-art-dark/80 dark:text-art-bg/90 font-sans tracking-wide">
                      <span className="font-semibold">Dimensions:</span> {selectedArtwork.dimensions}
                    </p>
                    <p className="text-base text-art-accent font-serif tracking-widest font-semibold pt-1 border-t border-art-border/40 dark:border-art-darkBorder/40">
                      Price: {selectedArtwork.status === 'available' ? selectedArtwork.price : selectedArtwork.status}
                    </p>
                  </div>

                  {/* Artwork Narrative */}
                  <div className="mb-10 text-sm text-art-muted dark:text-art-darkMuted leading-relaxed">
                    <h4 className="text-xs uppercase tracking-extra font-semibold text-art-dark dark:text-art-bg mb-2">
                      Artist Notes
                    </h4>
                    <p>{selectedArtwork.description || "No description provided."}</p>
                  </div>
                </div>

                {/* Lower Inquiry Form Block */}
                <div className="border-t border-art-border/60 dark:border-art-darkBorder/60 pt-8 mt-4">
                  <h4 className="text-xs uppercase tracking-extra font-semibold text-art-dark dark:text-art-bg mb-4 flex items-center gap-2">
                    <Info size={14} className="text-art-accent" />
                    <span>Inquire About This Piece</span>
                  </h4>

                  {inquirySubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-4 flex items-start space-x-3 rounded-none text-xs leading-normal"
                    >
                      <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Inquiry Sent Successfully.</p>
                        <p>{artistName}’s studio will respond to your email with details shortly.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          required
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          placeholder="Your Full Name"
                          id="inquiry-form-name"
                          className="w-full bg-art-card dark:bg-art-darkCard border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs text-art-dark dark:text-art-bg focus:border-art-accent focus:outline-none placeholder-art-muted rounded-none"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          required
                          value={inquiryEmail}
                          onChange={(e) => setInquiryEmail(e.target.value)}
                          placeholder="Your Email Address"
                          id="inquiry-form-email"
                          className="w-full bg-art-card dark:bg-art-darkCard border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs text-art-dark dark:text-art-bg focus:border-art-accent focus:outline-none placeholder-art-muted rounded-none"
                        />
                      </div>
                      <div>
                        <textarea
                          required
                          rows={4}
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          placeholder="Your Message"
                          id="inquiry-form-message"
                          className="w-full bg-art-card dark:bg-art-darkCard border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs text-art-dark dark:text-art-bg focus:border-art-accent focus:outline-none placeholder-art-muted rounded-none resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingInquiry}
                        id="inquiry-form-submit"
                        className="w-full bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent dark:hover:bg-art-accent hover:text-white dark:hover:text-white py-3 text-[11px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {submittingInquiry ? (
                          <span>Sending...</span>
                        ) : (
                          <>
                            <span>Send Acquisition Inquiry</span>
                            <Send size={12} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
