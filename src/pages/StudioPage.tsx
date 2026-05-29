import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Tag, BookOpen, Layers, Check, 
  Trash, MessageSquare, AlertCircle, FileText, Upload, LogOut, ChevronRight, Lock, Download
} from 'lucide-react';
import { 
  getProfile, saveProfile, getArtworks, saveArtwork, 
  deleteArtwork, getCollections, saveCollections, getInquiries, 
  deleteInquiry, saveInquiry, exportPortfolioData, importPortfolioData
} from '../db';
import type { Profile, Artwork, CVSection, CVItem, Inquiry } from '../types';

const hashPasscode = async (passcode: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(passcode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const StudioPage: React.FC = () => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Page Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'artworks' | 'collections' | 'pages' | 'inquiries' | 'system'>('overview');

  // Core data states
  const [profile, setProfile] = useState<Profile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form: Artworks
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [artTitle, setArtTitle] = useState('');
  const [artYear, setArtYear] = useState('');
  const [artMedium, setArtMedium] = useState('');
  const [artDimensions, setArtDimensions] = useState('');
  const [artPrice, setArtPrice] = useState('');
  const [artDescription, setArtDescription] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [artStatus, setArtStatus] = useState<'available' | 'sold' | 'reserved'>('available');
  const [artSelectedCollections, setArtSelectedCollections] = useState<string[]>([]);
  const [artIsGallery, setArtIsGallery] = useState(true);
  const [artIsFeatured, setArtIsFeatured] = useState(false);
  const [artworkFormError, setArtworkFormError] = useState('');
  const [artworkSuccessMsg, setArtworkSuccessMsg] = useState('');
  const [artworkImageFile, setArtworkImageFile] = useState<string | null>(null);

  // Form: Collections
  const [newCollectionName, setNewCollectionName] = useState('');

  // Form: Bio / Profile Settings
  const [profileName, setProfileName] = useState('');
  const [profileTagline, setProfileTagline] = useState('');
  const [profilePhilosophy, setProfilePhilosophy] = useState('');
  const [profileHeroImage, setProfileHeroImage] = useState('');
  const [profileBioText, setProfileBioText] = useState('');
  const [profilePortraitImage, setProfilePortraitImage] = useState('');
  const [profileCV, setProfileCV] = useState<CVSection[]>([]);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // CV Row Builder states
  const [cvActiveSectionId, setCvActiveSectionId] = useState<string>('');
  const [newCvYear, setNewCvYear] = useState('');
  const [newCvTitle, setNewCvTitle] = useState('');
  const [newCvDetail, setNewCvDetail] = useState('');

  useEffect(() => {
    const isAuthSession = sessionStorage.getItem('artisthub_studio_auth') === 'true';
    const isAuthLocal = localStorage.getItem('artisthub_studio_auth') === 'true';
    if (isAuthSession || isAuthLocal) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setIsVerifying(true);

    try {
      const hashedInput = await hashPasscode(passcode);
      const expectedHash = import.meta.env.VITE_STUDIO_PASSCODE_HASH || 
                           '8266498d969081c29737b8daeb5b51d60e56d008fff243a39d16c3032d42f6cf';

      if (hashedInput === expectedHash) {
        setIsAuthenticated(true);
        sessionStorage.setItem('artisthub_studio_auth', 'true');
        if (rememberMe) {
          localStorage.setItem('artisthub_studio_auth', 'true');
        }
        await fetchData();
      } else {
        setAuthError('Access Denied. Passcode is incorrect.');
        setPasscode('');
      }
    } catch (err) {
      setAuthError('Verification error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('artisthub_studio_auth');
    localStorage.removeItem('artisthub_studio_auth');
    setIsAuthenticated(false);
    setProfile(null);
    setArtworks([]);
    setCollections([]);
    setInquiries([]);
    setPasscode('');
    setAuthError('');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const p = await getProfile();
      const arts = await getArtworks();
      const cols = await getCollections();
      const inqs = await getInquiries();

      setProfile(p);
      setArtworks(arts);
      setCollections(cols);
      setInquiries(inqs);

      // Pre-fill profile forms
      setProfileName(p.name);
      setProfileTagline(p.tagline);
      setProfilePhilosophy(p.philosophy);
      setProfileHeroImage(p.heroImage);
      setProfileBioText(p.bioText);
      setProfilePortraitImage(p.portraitImage);
      setProfileCV(p.cv || []);
      if (p.cv && p.cv.length > 0) {
        setCvActiveSectionId(p.cv[0].id);
      }
    } catch (err) {
      console.error("Failed to load studio dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded image file to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'artwork' | 'hero' | 'portrait') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'artwork') {
        setArtworkImageFile(base64String);
        setArtImageUrl(''); // Clear text url if file selected
      } else if (type === 'hero') {
        setProfileHeroImage(base64String);
      } else if (type === 'portrait') {
        setProfilePortraitImage(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Artwork Save (Add & Edit)
  const handleArtworkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setArtworkFormError('');
    setArtworkSuccessMsg('');

    if (!artTitle || !artYear || !artMedium || !artDimensions || !artPrice) {
      setArtworkFormError('Please fill out all required fields.');
      return;
    }

    const finalImageUrl = artworkImageFile || artImageUrl;
    if (!finalImageUrl) {
      setArtworkFormError('Please provide an image URL or upload an image file.');
      return;
    }

    try {
      const savedArt: Artwork = {
        id: editingArtworkId || `art-${Date.now()}`,
        title: artTitle,
        year: artYear,
        medium: artMedium,
        dimensions: artDimensions,
        price: artPrice,
        description: artDescription,
        imageUrl: finalImageUrl,
        status: artStatus,
        collections: artSelectedCollections,
        isGallery: artIsGallery,
        isFeatured: artIsFeatured,
        createdAt: editingArtworkId 
          ? (artworks.find(w => w.id === editingArtworkId)?.createdAt || Date.now())
          : Date.now()
      };

      await saveArtwork(savedArt);
      setArtworkSuccessMsg(editingArtworkId ? 'Artwork updated successfully!' : 'Artwork added successfully!');
      
      // Reset forms
      resetArtworkForm();
      
      // Reload lists
      const arts = await getArtworks();
      setArtworks(arts);
    } catch (err) {
      setArtworkFormError('Error saving artwork to browser database.');
    }
  };

  const resetArtworkForm = () => {
    setEditingArtworkId(null);
    setArtTitle('');
    setArtYear('');
    setArtMedium('');
    setArtDimensions('');
    setArtPrice('');
    setArtDescription('');
    setArtImageUrl('');
    setArtworkImageFile(null);
    setArtStatus('available');
    setArtSelectedCollections([]);
    setArtIsGallery(true);
    setArtIsFeatured(false);
  };

  // Pre-fill fields for editing artwork
  const handleArtworkEdit = (art: Artwork) => {
    setEditingArtworkId(art.id);
    setArtTitle(art.title);
    setArtYear(art.year);
    setArtMedium(art.medium);
    setArtDimensions(art.dimensions);
    setArtPrice(art.price);
    setArtDescription(art.description);
    setArtStatus(art.status);
    setArtSelectedCollections(art.collections || []);
    setArtIsGallery(art.isGallery);
    setArtIsFeatured(art.isFeatured);
    
    if (art.imageUrl.startsWith('data:')) {
      setArtworkImageFile(art.imageUrl);
      setArtImageUrl('');
    } else {
      setArtImageUrl(art.imageUrl);
      setArtworkImageFile(null);
    }
    
    // Jump to the top of the tab for editing
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleArtworkDelete = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this artwork? This action cannot be undone.')) return;
    try {
      await deleteArtwork(id);
      const arts = await getArtworks();
      setArtworks(arts);
    } catch (err) {
      console.error("Failed to delete artwork:", err);
    }
  };

  // Toggle collection tags for artwork
  const handleTagToggle = (colName: string) => {
    if (artSelectedCollections.includes(colName)) {
      setArtSelectedCollections(artSelectedCollections.filter(c => c !== colName));
    } else {
      setArtSelectedCollections([...artSelectedCollections, colName]);
    }
  };

  // Handle Collection Category additions
  const handleCollectionAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCollectionName.trim();
    if (!cleanName) return;

    if (collections.includes(cleanName)) {
      alert('This collection category already exists.');
      return;
    }

    try {
      const updatedCols = [...collections, cleanName];
      await saveCollections(updatedCols);
      setCollections(updatedCols);
      setNewCollectionName('');
    } catch (err) {
      console.error("Failed to save collections:", err);
    }
  };

  const handleCollectionDelete = async (colName: string) => {
    if (!window.confirm(`Delete collection "${colName}"? Note: Artworks tagged with "${colName}" will remain in the database but lose this specific tag.`)) return;
    
    try {
      const updatedCols = collections.filter(c => c !== colName);
      await saveCollections(updatedCols);
      setCollections(updatedCols);
      
      // Update artworks that were tagged with this
      const updatedArtworks = artworks.map((art) => {
        if (art.collections.includes(colName)) {
          const newTags = art.collections.filter(c => c !== colName);
          const updatedArt = { ...art, collections: newTags };
          saveArtwork(updatedArt); // Save updates back to DB async
          return updatedArt;
        }
        return art;
      });
      setArtworks(updatedArtworks);
    } catch (err) {
      console.error("Failed to remove collection category:", err);
    }
  };

  // Save profile and CV lists
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');

    if (!profileName || !profileTagline || !profilePhilosophy) {
      alert('Please fill out all primary identity fields.');
      return;
    }

    try {
      const updatedProfile: Profile = {
        name: profileName,
        tagline: profileTagline,
        philosophy: profilePhilosophy,
        heroImage: profileHeroImage,
        bioText: profileBioText,
        portraitImage: profilePortraitImage,
        cv: profileCV
      };

      await saveProfile(updatedProfile);
      setProfileSuccessMsg('Artist profile settings saved successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
      
      // Sync local state
      setProfile(updatedProfile);
    } catch (err) {
      alert('Failed to save profile settings.');
    }
  };

  // CV Builder Functions
  const handleAddCvItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvActiveSectionId || !newCvYear || !newCvTitle || !newCvDetail) {
      alert('Please fill out all CV fields.');
      return;
    }

    const updatedCV = profileCV.map((sec) => {
      if (sec.id === cvActiveSectionId) {
        const newRow: CVItem = {
          id: `cvi-${Date.now()}`,
          year: newCvYear,
          title: newCvTitle,
          detail: newCvDetail
        };
        return {
          ...sec,
          items: [...sec.items, newRow]
        };
      }
      return sec;
    });

    setProfileCV(updatedCV);
    setNewCvYear('');
    setNewCvTitle('');
    setNewCvDetail('');
  };

  const handleDeleteCvItem = (sectionId: string, itemId: string) => {
    const updatedCV = profileCV.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: sec.items.filter(item => item.id !== itemId)
        };
      }
      return sec;
    });
    setProfileCV(updatedCV);
  };

  const handleInquiryDelete = async (id: string) => {
    if (!window.confirm('Delete this inquiry record from the studio database?')) return;
    try {
      await deleteInquiry(id);
      const inqs = await getInquiries();
      setInquiries(inqs);
    } catch (err) {
      console.error("Failed to delete inquiry:", err);
    }
  };

  const handleInquiryToggleRead = async (inq: Inquiry) => {
    try {
      const updated: Inquiry = {
        ...inq,
        status: inq.status === 'unread' ? 'read' : 'unread'
      };
      await saveInquiry(updated);
      const inqs = await getInquiries();
      setInquiries(inqs);
    } catch (err) {
      console.error("Failed to toggle read status:", err);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportPortfolioData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      
      const artistSlug = data.profile.name.toLowerCase().replace(/\s+/g, '_');
      const dateString = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute(
        'download',
        `artisthub_backup_${artistSlug}_${dateString}.json`
      );
      
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to export portfolio data.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmOverwrite = window.confirm(
      'Are you absolutely sure you want to import this portfolio backup? This will completely overwrite all current artworks, collections, biography, and CV in this browser!'
    );
    if (!confirmOverwrite) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await importPortfolioData(json);
        alert('Portfolio data successfully imported! The database has been updated.');
        await fetchData();
      } catch (err: any) {
        alert(`Failed to import data: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-art-bg dark:bg-art-darkBg">
        <div className="font-serif italic text-xl text-art-muted tracking-widest animate-pulse">
          opening artist studio dashboards...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-art-bg dark:bg-art-darkBg py-12 px-6 transition-colors duration-500 relative overflow-hidden">
        {/* Abstract decorative ambient blobs for upscale gallery vibe */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-art-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-art-accent/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full relative z-10"
        >
          {/* Main Card */}
          <div className="bg-art-card/85 dark:bg-art-darkCard/85 border border-art-border dark:border-art-darkBorder backdrop-blur-md p-8 sm:p-10 shadow-2xl flex flex-col items-center">
            
            {/* Gallery Seal/Lock icon */}
            <div className="h-16 w-16 bg-art-accent/10 rounded-full flex items-center justify-center mb-6 border border-art-accent/20">
              <Lock className="text-art-accent h-6 w-6 animate-pulse" />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif text-art-dark dark:text-art-bg tracking-wide">Artist Studio Entry</h2>
              <p className="text-xs text-art-muted dark:text-art-darkMuted mt-2 tracking-widest uppercase">
                Private Vault Access
              </p>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="w-full space-y-6">
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  maxLength={12}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Enter studio passcode"
                  className="w-full bg-art-bg/50 dark:bg-art-darkBg/50 border border-art-border dark:border-art-darkBorder px-4 py-3.5 text-center text-lg font-serif tracking-widest focus:border-art-accent focus:outline-none transition-colors text-art-dark dark:text-art-bg"
                />
              </div>

              {authError && (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: [0, -10, 10, -10, 10, 0], opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-xs text-red-500 dark:text-red-400 font-sans text-center flex items-center justify-center space-x-1.5"
                >
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-center space-x-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 text-art-accent focus:ring-art-accent/30 border-art-border/80 rounded bg-transparent accent-art-accent"
                />
                <label htmlFor="remember-me" className="text-[10px] uppercase tracking-widest text-art-muted dark:text-art-darkMuted cursor-pointer select-none">
                  Remember on this device (30 days)
                </label>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white py-3 text-xs uppercase tracking-widest font-semibold transition-all duration-300 disabled:opacity-50 select-none cursor-pointer"
              >
                {isVerifying ? 'Verifying Credentials...' : 'Unlock Studio'}
              </button>
            </form>

            {/* Quick Helper Pin Pad for Tactile feel */}
            <div className="mt-8 pt-6 border-t border-art-border/40 dark:border-art-darkBorder/40 w-full">
              <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (passcode.length < 12) setPasscode(passcode + num);
                      if (authError) setAuthError('');
                    }}
                    className="h-11 w-11 rounded-full border border-art-border/50 dark:border-art-darkBorder/50 text-xs font-semibold text-art-dark dark:text-art-bg hover:border-art-accent hover:text-art-accent bg-transparent flex items-center justify-center transition-all duration-200 select-none cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setPasscode(passcode.slice(0, -1));
                    if (authError) setAuthError('');
                  }}
                  className="h-11 w-11 rounded-full text-[10px] uppercase font-bold text-art-muted dark:text-art-darkMuted hover:text-red-500 flex items-center justify-center select-none cursor-pointer"
                >
                  Del
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (passcode.length < 12) setPasscode(passcode + '0');
                    if (authError) setAuthError('');
                  }}
                  className="h-11 w-11 rounded-full border border-art-border/50 dark:border-art-darkBorder/50 text-xs font-semibold text-art-dark dark:text-art-bg hover:border-art-accent hover:text-art-accent bg-transparent flex items-center justify-center transition-all duration-200 select-none cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  className="h-11 w-11 rounded-full text-[10px] uppercase font-bold text-art-accent hover:text-art-accent/80 flex items-center justify-center select-none cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 text-[10px] uppercase tracking-widest text-art-muted dark:text-art-darkMuted hover:underline"
            >
              ← Back to Gallery
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-art-bg dark:bg-art-darkBg">
        <div className="font-serif italic text-xl text-art-muted tracking-widest animate-pulse">
          resolving database connection...
        </div>
      </div>
    );
  }

  // Analytics for overview tab
  const totalArtworks = artworks.length;
  const availableCount = artworks.filter(a => a.status === 'available').length;
  const soldCount = artworks.filter(a => a.status === 'sold').length;
  const reservedCount = artworks.filter(a => a.status === 'reserved').length;
  const unreadInquiries = inquiries.filter(i => i.status === 'unread').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-art-bg dark:bg-art-darkBg text-art-dark dark:text-art-bg min-h-screen py-16 transition-colors duration-500"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Studio Branding Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-art-border/40 dark:border-art-darkBorder/40 pb-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="h-2 w-2 bg-art-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-art-accent">
                Secure Offline Studio Environment
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif">Artist Studio</h1>
          </div>
          
          <button 
            onClick={() => {
              if (window.confirm("Logout and return to public portfolio?")) {
                handleLogout();
                window.location.href = "/";
              }
            }}
            className="flex items-center space-x-2 text-xs uppercase tracking-widest border border-art-border hover:border-art-accent hover:text-art-accent px-4 py-2 mt-4 md:mt-0 max-w-max transition-colors"
          >
            <span>Exit Studio</span>
            <LogOut size={12} />
          </button>
        </header>

        {/* Dashboard Tabs Sidebar Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column Tabs Selector */}
          <nav className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-4 lg:pb-0 no-scrollbar">
            <button
              onClick={() => { setActiveTab('overview'); resetArtworkForm(); }}
              id="studio-tab-overview"
              className={`flex items-center space-x-3 px-4 py-3.5 text-xs font-semibold tracking-widest uppercase text-left transition-all duration-300 border-l ${
                activeTab === 'overview'
                  ? 'border-art-accent text-art-accent bg-art-card/65 dark:bg-art-darkCard/65 pl-5'
                  : 'border-transparent text-art-dark/60 dark:text-art-bg/60 hover:text-art-dark dark:hover:text-art-bg pl-4'
              }`}
            >
              <Layers size={14} />
              <span>Studio Overview</span>
            </button>

            <button
              onClick={() => { setActiveTab('artworks'); }}
              id="studio-tab-artworks"
              className={`flex items-center space-x-3 px-4 py-3.5 text-xs font-semibold tracking-widest uppercase text-left transition-all duration-300 border-l ${
                activeTab === 'artworks'
                  ? 'border-art-accent text-art-accent bg-art-card/65 dark:bg-art-darkCard/65 pl-5'
                  : 'border-transparent text-art-dark/60 dark:text-art-bg/60 hover:text-art-dark dark:hover:text-art-bg pl-4'
              }`}
            >
              <BookOpen size={14} />
              <span>Manage Artworks</span>
            </button>

            <button
              onClick={() => { setActiveTab('collections'); resetArtworkForm(); }}
              id="studio-tab-collections"
              className={`flex items-center space-x-3 px-4 py-3.5 text-xs font-semibold tracking-widest uppercase text-left transition-all duration-300 border-l ${
                activeTab === 'collections'
                  ? 'border-art-accent text-art-accent bg-art-card/65 dark:bg-art-darkCard/65 pl-5'
                  : 'border-transparent text-art-dark/60 dark:text-art-bg/60 hover:text-art-dark dark:hover:text-art-bg pl-4'
              }`}
            >
              <Tag size={14} />
              <span>Collections Editor</span>
            </button>

            <button
              onClick={() => { setActiveTab('pages'); resetArtworkForm(); }}
              id="studio-tab-pages"
              className={`flex items-center space-x-3 px-4 py-3.5 text-xs font-semibold tracking-widest uppercase text-left transition-all duration-300 border-l ${
                activeTab === 'pages'
                  ? 'border-art-accent text-art-accent bg-art-card/65 dark:bg-art-darkCard/65 pl-5'
                  : 'border-transparent text-art-dark/60 dark:text-art-bg/60 hover:text-art-dark dark:hover:text-art-bg pl-4'
              }`}
            >
              <FileText size={14} />
              <span>Page CMS Customizer</span>
            </button>

            <button
              onClick={() => { setActiveTab('inquiries'); resetArtworkForm(); }}
              id="studio-tab-inquiries"
              className={`flex items-center justify-between px-4 py-3.5 text-xs font-semibold tracking-widest uppercase text-left transition-all duration-300 border-l ${
                activeTab === 'inquiries'
                  ? 'border-art-accent text-art-accent bg-art-card/65 dark:bg-art-darkCard/65 pl-5'
                  : 'border-transparent text-art-dark/60 dark:text-art-bg/60 hover:text-art-dark dark:hover:text-art-bg pl-4'
              }`}
            >
              <div className="flex items-center space-x-3">
                <MessageSquare size={14} />
                <span>Acquisition Inquiries</span>
              </div>
              {unreadInquiries > 0 && (
                <span className="bg-art-accent text-white font-sans text-[9px] px-2 py-0.5 rounded-full select-none">
                  {unreadInquiries} new
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('system'); resetArtworkForm(); }}
              id="studio-tab-system"
              className={`flex items-center space-x-3 px-4 py-3.5 text-xs font-semibold tracking-widest uppercase text-left transition-all duration-300 border-l ${
                activeTab === 'system'
                  ? 'border-art-accent text-art-accent bg-art-card/65 dark:bg-art-darkCard/65 pl-5'
                  : 'border-transparent text-art-dark/60 dark:text-art-bg/60 hover:text-art-dark dark:hover:text-art-bg pl-4'
              }`}
            >
              <Download size={14} />
              <span>Backup & Transfer</span>
            </button>
          </nav>

          {/* Right Column: Tab View Contents */}
          <main className="lg:col-span-9 bg-art-card/30 dark:bg-art-darkCard/30 border border-art-border/40 dark:border-art-darkBorder/40 p-6 sm:p-10 transition-colors duration-500">
            
            {/* 1. TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div>
                  <h2 className="text-2xl font-serif mb-2">Welcome Back, {profile.name}</h2>
                  <p className="text-xs text-art-muted dark:text-art-darkMuted font-sans">
                    Here is a real-time diagnostic snapshot of your local-first art gallery database.
                  </p>
                </div>

                {/* Analytical Counter Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-art-card dark:bg-art-darkCard border border-art-border/40 p-5">
                    <span className="text-[9px] uppercase tracking-extra text-art-muted block mb-1">Total Pieces</span>
                    <span className="text-3xl font-serif font-bold text-art-dark dark:text-art-bg">{totalArtworks}</span>
                  </div>
                  <div className="bg-art-card dark:bg-art-darkCard border border-art-border/40 p-5">
                    <span className="text-[9px] uppercase tracking-extra text-emerald-600 dark:text-emerald-500 block mb-1">Available</span>
                    <span className="text-3xl font-serif font-bold text-emerald-600 dark:text-emerald-500">{availableCount}</span>
                  </div>
                  <div className="bg-art-card dark:bg-art-darkCard border border-art-border/40 p-5">
                    <span className="text-[9px] uppercase tracking-extra text-art-accent block mb-1">Sold / Reserved</span>
                    <span className="text-3xl font-serif font-bold text-art-accent">{soldCount + reservedCount}</span>
                  </div>
                  <div className="bg-art-card dark:bg-art-darkCard border border-art-border/40 p-5">
                    <span className="text-[9px] uppercase tracking-extra text-blue-600 dark:text-blue-500 block mb-1">New Inquiries</span>
                    <span className="text-3xl font-serif font-bold text-blue-600 dark:text-blue-500">{unreadInquiries}</span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-art-border/40 dark:border-art-darkBorder/40 pt-10">
                  
                  {/* Database Seed Alert */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif">Browser-Local Database</h3>
                    <p className="text-xs text-art-muted dark:text-art-darkMuted leading-relaxed">
                      All artworks, portrait images, and CV items are stored securely inside your browser's private database **(IndexedDB)**. You can upload huge high-definition photos directly from your hard drive, which are instantly converted to base64 formats.
                    </p>
                    <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 border border-amber-500/20 text-xs flex items-start space-x-3">
                      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Local Backups & Deployment</p>
                        <p>Because there is no external server, your changes exist only on this computer. You can upload unlimited artworks. When you are ready to publish, the local app reads this data seamlessly!</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity / Inquiries teaser */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-serif">Recent Customer Messages</h3>
                    {inquiries.length === 0 ? (
                      <div className="p-8 text-center bg-art-card dark:bg-art-darkCard border border-art-border/40 font-sans text-xs text-art-muted">
                        No customer inquiries received yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {inquiries.slice(0, 3).map((inq) => (
                          <div 
                            key={inq.id}
                            className={`p-4 border text-xs flex flex-col justify-between space-y-2 cursor-pointer hover:border-art-accent transition-colors ${
                              inq.status === 'unread' 
                                ? 'bg-blue-500/5 border-blue-500/20 font-medium' 
                                : 'bg-art-card dark:bg-art-darkCard border-art-border/40'
                            }`}
                            onClick={() => setActiveTab('inquiries')}
                          >
                            <div className="flex justify-between items-baseline">
                              <span className="font-semibold">{inq.name}</span>
                              <span className="text-[10px] text-art-muted">{new Date(inq.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="truncate text-art-muted dark:text-art-darkMuted italic">
                              Regarding: "{inq.artworkTitle}"
                            </p>
                          </div>
                        ))}
                        <button
                          onClick={() => setActiveTab('inquiries')}
                          className="text-[11px] uppercase tracking-widest text-art-accent hover:underline flex items-center space-x-1"
                        >
                          <span>Manage all Inquiries ({inquiries.length})</span>
                          <ChevronRight size={10} />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* 2. TAB: MANAGE ARTWORKS */}
            {activeTab === 'artworks' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                
                {/* Upper Title Header */}
                <div className="flex justify-between items-center border-b border-art-border/40 dark:border-art-darkBorder/40 pb-4">
                  <h2 className="text-2xl font-serif">
                    {editingArtworkId ? 'Edit Selected Artwork' : 'Upload New Artwork'}
                  </h2>
                  {editingArtworkId && (
                    <button
                      onClick={resetArtworkForm}
                      className="text-xs uppercase tracking-widest text-red-500 hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Form Section */}
                <form onSubmit={handleArtworkSave} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Column Inputs */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Artwork Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={artTitle}
                        onChange={(e) => setArtTitle(e.target.value)}
                        placeholder="e.g. Whispers of Carrara"
                        className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                          Creation Year *
                        </label>
                        <input
                          type="text"
                          required
                          value={artYear}
                          onChange={(e) => setArtYear(e.target.value)}
                          placeholder="e.g. 2025"
                          className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                          Acquisition Price *
                        </label>
                        <input
                          type="text"
                          required
                          value={artPrice}
                          onChange={(e) => setArtPrice(e.target.value)}
                          placeholder="e.g. $4,800 or On Request"
                          className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Artistic Medium / Materials *
                      </label>
                      <input
                        type="text"
                        required
                        value={artMedium}
                        onChange={(e) => setArtMedium(e.target.value)}
                        placeholder="e.g. Carved Carrara Marble & Granite Base"
                        className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Dimensions (Height x Width x Depth) *
                      </label>
                      <input
                        type="text"
                        required
                        value={artDimensions}
                        onChange={(e) => setArtDimensions(e.target.value)}
                        placeholder="e.g. 24 x 16 x 12 inches"
                        className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Description / Behind the Canvas
                      </label>
                      <textarea
                        rows={4}
                        value={artDescription}
                        onChange={(e) => setArtDescription(e.target.value)}
                        placeholder="Detail the conceptual narrative, physical processes, or lighting conditions best suited for display."
                        className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Right Column Inputs */}
                  <div className="space-y-6">
                    {/* Visual Image Uploader Selector */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Artwork Image Source *
                      </label>
                      
                      <div className="border border-dashed border-art-border/60 dark:border-art-darkBorder/60 p-6 bg-art-bg/50 dark:bg-art-darkBg/50 flex flex-col items-center justify-center text-center space-y-4">
                        {artworkImageFile ? (
                          <div className="relative w-full aspect-[4/3] max-h-48 overflow-hidden border border-art-border/60">
                            <img
                              src={artworkImageFile}
                              alt="Upload preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setArtworkImageFile(null)}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-700"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload size={28} className="text-art-accent" />
                            <div>
                              <p className="text-xs font-semibold mb-1">Upload Local Image File</p>
                              <p className="text-[10px] text-art-muted">Select high-quality png or jpg from your device.</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'artwork')}
                              className="hidden"
                              id="artwork-file-input"
                            />
                            <label
                              htmlFor="artwork-file-input"
                              className="cursor-pointer bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white px-4 py-2 text-[10px] uppercase tracking-widest font-semibold transition-all duration-300"
                            >
                              Choose Image File
                            </label>
                          </>
                        )}
                      </div>

                      {/* URL Fallback Option */}
                      <div className="mt-4">
                        <p className="text-[10px] font-sans tracking-wide text-art-muted text-center mb-3">
                          — OR PASTE REMOTE URL —
                        </p>
                        <input
                          type="text"
                          value={artImageUrl}
                          disabled={!!artworkImageFile}
                          onChange={(e) => setArtImageUrl(e.target.value)}
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none disabled:opacity-40"
                        />
                      </div>
                    </div>

                    {/* Status badges selector */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Availability Status *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['available', 'sold', 'reserved'] as const).map((status) => (
                          <button
                            type="button"
                            key={status}
                            onClick={() => setArtStatus(status)}
                            className={`py-2 text-[10px] uppercase tracking-wider font-semibold border ${
                              artStatus === status
                                ? 'bg-art-accent border-art-accent text-white'
                                : 'border-art-border/60 dark:border-art-darkBorder/60 text-art-dark/70 dark:text-art-bg/70 hover:border-art-accent hover:text-art-accent bg-transparent'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Page visibility Checkboxes */}
                    <div className="flex flex-col space-y-3 p-4 bg-art-bg/40 dark:bg-art-darkBg/40 border border-art-border/60 dark:border-art-darkBorder/60">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="art-is-gallery"
                          checked={artIsGallery}
                          onChange={(e) => setArtIsGallery(e.target.checked)}
                          className="h-4 w-4 text-art-accent focus:ring-art-accent border-art-border rounded-none"
                        />
                        <label htmlFor="art-is-gallery" className="text-xs font-semibold uppercase tracking-wide">
                          Show in Public Gallery Page
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="art-is-featured"
                          checked={artIsFeatured}
                          onChange={(e) => setArtIsFeatured(e.target.checked)}
                          className="h-4 w-4 text-art-accent focus:ring-art-accent border-art-border rounded-none"
                        />
                        <label htmlFor="art-is-featured" className="text-xs font-semibold uppercase tracking-wide">
                          Feature on Landing Page Showcase
                        </label>
                      </div>
                    </div>

                    {/* Collection Tags Selector */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Tag to Collections
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto border border-art-border/40 p-3 bg-art-bg/20">
                        {collections.map((colName) => {
                          const isTagged = artSelectedCollections.includes(colName);
                          return (
                            <button
                              type="button"
                              key={colName}
                              onClick={() => handleTagToggle(colName)}
                              className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-medium border flex items-center space-x-1.5 transition-all duration-300 ${
                                isTagged
                                  ? 'bg-art-accent/15 border-art-accent text-art-accent font-semibold'
                                  : 'border-art-border/50 text-art-dark/60 dark:text-art-bg/60 hover:border-art-accent'
                              }`}
                            >
                              <span>{colName}</span>
                              {isTagged && <Check size={10} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Messages Feedback */}
                    {artworkFormError && (
                      <div className="text-xs text-red-600 bg-red-500/10 p-3 border border-red-500/20 font-medium">
                        {artworkFormError}
                      </div>
                    )}
                    {artworkSuccessMsg && (
                      <div className="text-xs text-emerald-600 bg-emerald-500/10 p-3 border border-emerald-500/20 font-medium">
                        {artworkSuccessMsg}
                      </div>
                    )}

                    {/* Submit Actions */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="submit"
                        id="artwork-form-save-btn"
                        className="flex-1 bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white py-3 text-[11px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <Plus size={14} />
                        <span>{editingArtworkId ? 'Apply Database Edits' : 'Commit to Database'}</span>
                      </button>
                    </div>

                  </div>
                </form>

                {/* List Table of All Existing Artworks */}
                <div className="border-t border-art-border/40 dark:border-art-darkBorder/40 pt-10">
                  <h3 className="text-xl font-serif mb-6">Database Catalog ({totalArtworks} pieces)</h3>
                  
                  {artworks.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-art-border/60">
                      <p className="text-xs text-art-muted font-serif italic">Catalog is empty.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-art-border dark:border-art-darkBorder text-art-muted uppercase tracking-widest text-[10px]">
                            <th className="py-4 font-semibold w-16">Thumbnail</th>
                            <th className="py-4 font-semibold px-4">Title / Year</th>
                            <th className="py-4 font-semibold px-4 hidden sm:table-cell">Medium</th>
                            <th className="py-4 font-semibold px-4">Price</th>
                            <th className="py-4 font-semibold px-4 text-center">Status</th>
                            <th className="py-4 font-semibold px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-art-border/45 dark:divide-art-darkBorder/45">
                          {artworks.map((art) => (
                            <tr key={art.id} className="hover:bg-art-card/25 dark:hover:bg-art-darkCard/25 transition-colors">
                              <td className="py-3">
                                <div className="h-12 w-12 bg-art-card border overflow-hidden">
                                  <img
                                    src={art.imageUrl}
                                    alt={art.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-serif text-sm font-semibold">{art.title}</p>
                                <p className="text-[10px] text-art-muted dark:text-art-darkMuted mt-0.5">{art.year}</p>
                              </td>
                              <td className="py-3 px-4 hidden sm:table-cell text-art-muted dark:text-art-darkMuted">
                                {art.medium}
                              </td>
                              <td className="py-3 px-4 font-semibold text-art-accent">
                                {art.price}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest ${
                                  art.status === 'available'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : art.status === 'sold'
                                    ? 'bg-red-500/10 text-red-600'
                                    : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                  {art.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleArtworkEdit(art)}
                                    id={`art-edit-${art.id}`}
                                    className="p-2 text-art-muted hover:text-art-accent hover:bg-art-card rounded"
                                    title="Edit details"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleArtworkDelete(art.id)}
                                    id={`art-delete-${art.id}`}
                                    className="p-2 text-art-muted hover:text-red-600 hover:bg-art-card rounded"
                                    title="Delete from database"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* 3. TAB: COLLECTIONS EDITOR */}
            {activeTab === 'collections' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-serif mb-2">Collections & Tags Manager</h2>
                  <p className="text-xs text-art-muted dark:text-art-darkMuted font-sans">
                    Create custom thematic or aesthetic categories. Artworks can be tagged with multiple collections.
                  </p>
                </div>

                {/* Add collection Form */}
                <form onSubmit={handleCollectionAdd} className="flex gap-4 max-w-md">
                  <input
                    type="text"
                    required
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="New Collection name (e.g. Charcoal Series)"
                    className="flex-1 bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    id="collection-create-btn"
                    className="px-6 bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white text-xs uppercase tracking-widest font-semibold transition-all duration-300 flex items-center space-x-1"
                  >
                    <Plus size={12} />
                    <span>Create</span>
                  </button>
                </form>

                {/* Active Collections List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-art-border/40 dark:border-art-darkBorder/40 pt-8">
                  {collections.map((colName) => {
                    const linkedArtworksCount = artworks.filter(a => a.collections.includes(colName)).length;
                    return (
                      <div 
                        key={colName}
                        className="bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 p-4 flex justify-between items-center hover:border-art-accent transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-xs tracking-wider uppercase">{colName}</p>
                          <p className="text-[10px] text-art-muted dark:text-art-darkMuted mt-1">
                            {linkedArtworksCount} pieces tagged
                          </p>
                        </div>
                        <button
                          onClick={() => handleCollectionDelete(colName)}
                          id={`col-delete-${colName.toLowerCase().replace(/\s+/g, '-')}`}
                          className="p-2 text-art-muted hover:text-red-500 rounded hover:bg-art-card dark:hover:bg-art-darkCard transition-colors"
                          title="Delete collection category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 4. TAB: SITE PAGES CMS CUSTOMIZER */}
            {activeTab === 'pages' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div>
                  <h2 className="text-2xl font-serif mb-2">Page CMS Editor</h2>
                  <p className="text-xs text-art-muted dark:text-art-darkMuted font-sans">
                    Edit the copywriting, portraits, hero graphics, and CV lists dynamically without writing code.
                  </p>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-12">
                  
                  {/* Phase 1: LANDING PAGE CMS */}
                  <div className="space-y-6 bg-art-bg/25 dark:bg-art-darkBg/25 p-6 border border-art-border/50 dark:border-art-darkBorder/50">
                    <h3 className="text-lg font-serif border-b border-art-border/40 dark:border-art-darkBorder/40 pb-2">
                      Landing Page Customizer
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                          Artist Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                          Primary Art Tagline *
                        </label>
                        <input
                          type="text"
                          required
                          value={profileTagline}
                          onChange={(e) => setProfileTagline(e.target.value)}
                          className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Conceptual / Philosophy Statement *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={profilePhilosophy}
                        onChange={(e) => setProfilePhilosophy(e.target.value)}
                        className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Hero Banner Graphics *
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {profileHeroImage && (
                          <div className="h-24 w-40 bg-black border overflow-hidden">
                            <img src={profileHeroImage} alt="Hero banner" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 space-y-3 w-full">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'hero')}
                            className="hidden"
                            id="hero-file-input"
                          />
                          <label
                            htmlFor="hero-file-input"
                            className="cursor-pointer bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white px-4 py-2 text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 inline-block"
                          >
                            Upload Custom Hero Image
                          </label>
                          <input
                            type="text"
                            value={profileHeroImage.startsWith('data:') ? '' : profileHeroImage}
                            onChange={(e) => setProfileHeroImage(e.target.value)}
                            placeholder="Or paste remote Hero URL..."
                            className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2: ABOUT PAGE & BIO CMS */}
                  <div className="space-y-6 bg-art-bg/25 dark:bg-art-darkBg/25 p-6 border border-art-border/50 dark:border-art-darkBorder/50">
                    <h3 className="text-lg font-serif border-b border-art-border/40 dark:border-art-darkBorder/40 pb-2">
                      About & Biography Customizer
                    </h3>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Biography Text (Use double line breaks for paragraph breaks)
                      </label>
                      <textarea
                        rows={10}
                        required
                        value={profileBioText}
                        onChange={(e) => setProfileBioText(e.target.value)}
                        className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-2 font-semibold">
                        Artist Portrait Photo *
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {profilePortraitImage && (
                          <div className="h-28 w-24 bg-black border overflow-hidden">
                            <img src={profilePortraitImage} alt="Artist portrait" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 space-y-3 w-full">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'portrait')}
                            className="hidden"
                            id="portrait-file-input"
                          />
                          <label
                            htmlFor="portrait-file-input"
                            className="cursor-pointer bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white px-4 py-2 text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 inline-block"
                          >
                            Upload Portrait File
                          </label>
                          <input
                            type="text"
                            value={profilePortraitImage.startsWith('data:') ? '' : profilePortraitImage}
                            onChange={(e) => setProfilePortraitImage(e.target.value)}
                            placeholder="Or paste remote Portrait URL..."
                            className="w-full bg-art-bg dark:bg-art-darkBg border border-art-border/60 dark:border-art-darkBorder/60 px-4 py-2.5 text-xs focus:border-art-accent focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {profileSuccessMsg && (
                    <div className="text-xs text-emerald-600 bg-emerald-500/10 p-3 border border-emerald-500/20 font-medium">
                      {profileSuccessMsg}
                    </div>
                  )}

                  {/* Submit Identity Profile */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      id="profile-form-save-btn"
                      className="w-full bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white py-3.5 text-[11px] uppercase tracking-widest font-bold transition-all duration-300"
                    >
                      Save All Primary Page Configurations
                    </button>
                  </div>
                </form>

                {/* Phase 3: INTERACTIVE CV ROW BUILDER */}
                <div className="space-y-6 bg-art-bg/25 dark:bg-art-darkBg/25 p-6 border border-art-border/50 dark:border-art-darkBorder/50">
                  <h3 className="text-lg font-serif border-b border-art-border/40 dark:border-art-darkBorder/40 pb-2">
                    Curriculum Vitae (CV) Builders
                  </h3>

                  {profileCV.length === 0 ? (
                    <p className="text-xs text-art-muted font-serif italic">No CV sections configured.</p>
                  ) : (
                    <div className="space-y-8">
                      {/* Section Picker Tab */}
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-art-muted block mb-3 font-semibold">
                          1. Select CV Category to Edit
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {profileCV.map((sec) => (
                            <button
                              type="button"
                              key={sec.id}
                              onClick={() => setCvActiveSectionId(sec.id)}
                              className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold border ${
                                cvActiveSectionId === sec.id
                                  ? 'bg-art-accent border-art-accent text-white'
                                  : 'border-art-border/60 dark:border-art-darkBorder/60 text-art-dark/70 dark:text-art-bg/70 hover:border-art-accent'
                              }`}
                            >
                              {sec.category}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Add Item form */}
                      <form onSubmit={handleAddCvItem} className="border border-art-border/40 p-4 bg-art-bg/20 space-y-4">
                        <h4 className="text-xs uppercase tracking-extra font-semibold text-art-accent">
                          Add Row to "{profileCV.find(s => s.id === cvActiveSectionId)?.category}"
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <input
                            type="text"
                            required
                            value={newCvYear}
                            onChange={(e) => setNewCvYear(e.target.value)}
                            placeholder="Year (e.g. 2025)"
                            className="bg-art-bg dark:bg-art-darkBg border border-art-border/60 px-3 py-2 text-xs focus:border-art-accent focus:outline-none"
                          />
                          <input
                            type="text"
                            required
                            value={newCvTitle}
                            onChange={(e) => setNewCvTitle(e.target.value)}
                            placeholder="Exhibition Title"
                            className="bg-art-bg dark:bg-art-darkBg border border-art-border/60 px-3 py-2 text-xs focus:border-art-accent focus:outline-none sm:col-span-2"
                          />
                          <input
                            type="text"
                            required
                            value={newCvDetail}
                            onChange={(e) => setNewCvDetail(e.target.value)}
                            placeholder="Gallery Name / Location"
                            className="bg-art-bg dark:bg-art-darkBg border border-art-border/60 px-3 py-2 text-xs focus:border-art-accent focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          id="cv-add-item-btn"
                          className="px-4 py-2 bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 flex items-center space-x-1"
                        >
                          <Plus size={12} />
                          <span>Append Row</span>
                        </button>
                      </form>

                      {/* Displaying selected Section Rows for edit/deletes */}
                      <div className="border border-art-border/40 p-4 bg-art-bg/25">
                        <h4 className="text-xs uppercase tracking-extra font-semibold mb-4 text-art-dark dark:text-art-bg">
                          Active Rows in Selected Category
                        </h4>
                        
                        {(() => {
                          const activeSec = profileCV.find(s => s.id === cvActiveSectionId);
                          if (!activeSec || activeSec.items.length === 0) {
                            return <p className="text-xs text-art-muted font-sans italic">Category has no entries.</p>;
                          }
                          return (
                            <div className="space-y-2">
                              {activeSec.items.map((item) => (
                                <div 
                                  key={item.id}
                                  className="flex justify-between items-center text-xs p-2.5 bg-art-bg dark:bg-art-darkBg border border-art-border/40 hover:border-art-accent transition-colors"
                                >
                                  <div>
                                    <span className="font-semibold text-art-accent mr-3">{item.year}</span>
                                    <span className="font-serif italic font-medium">{item.title}</span>
                                    <span className="text-art-muted dark:text-art-darkMuted ml-3 font-sans">— {item.detail}</span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteCvItem(activeSec.id, item.id)}
                                    id={`cv-item-delete-${item.id}`}
                                    className="p-1 text-art-muted hover:text-red-500"
                                    title="Delete row"
                                  >
                                    <Trash size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Final button to commit complete CV changes back to profile store */}
                      <div className="pt-2">
                        <button
                          onClick={async () => {
                            try {
                              const updatedProfile = { ...profile, cv: profileCV };
                              await saveProfile(updatedProfile);
                              setProfile(updatedProfile);
                              alert('CV list committed to browser storage successfully!');
                            } catch (err) {
                              alert('Failed to save CV changes.');
                            }
                          }}
                          id="cv-commit-changes-btn"
                          className="px-6 py-2.5 border border-art-accent text-art-accent hover:bg-art-accent hover:text-white text-xs font-semibold uppercase tracking-widest transition-all duration-300 w-full"
                        >
                          Commit Stored CV Database Modifications
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* 5. TAB: ACQUISITION INQUIRIES */}
            {activeTab === 'inquiries' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-serif mb-2">Acquisition Inquiry Logs</h2>
                  <p className="text-xs text-art-muted dark:text-art-darkMuted font-sans">
                    Manage buying inquiries received from interested art collectors on your website.
                  </p>
                </div>

                {inquiries.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-art-border/60">
                    <p className="text-xs text-art-muted font-serif italic">No inquiry logs available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inq) => (
                      <div 
                        key={inq.id}
                        className={`border p-6 relative transition-colors ${
                          inq.status === 'unread'
                            ? 'bg-blue-500/5 border-blue-500/20 shadow-md'
                            : 'bg-art-bg dark:bg-art-darkBg border-art-border/60'
                        }`}
                      >
                        {/* Upper Details row */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-semibold text-art-dark dark:text-art-bg">
                                {inq.name}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest ${
                                inq.status === 'unread'
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : 'bg-art-border/40 text-art-muted'
                              }`}>
                                {inq.status}
                              </span>
                            </div>
                            <a 
                              href={`mailto:${inq.email}`} 
                              className="text-[11px] text-art-accent hover:underline block mt-0.5 font-sans"
                            >
                              {inq.email}
                            </a>
                          </div>
                          <span className="text-[10px] text-art-muted dark:text-art-darkMuted font-sans">
                            {new Date(inq.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Middle Text Box */}
                        <div className="bg-art-card dark:bg-art-darkCard border border-art-border/40 p-4 mb-4 text-xs leading-relaxed italic whitespace-pre-line text-art-dark/85 dark:text-art-bg/90">
                          {inq.message}
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex justify-between items-center text-xs pt-2">
                          <p className="font-sans text-[10px] text-art-muted">
                            Regarding Artwork: <span className="font-serif italic font-semibold text-art-dark dark:text-art-bg">{inq.artworkTitle}</span>
                          </p>
                          
                          <div className="flex space-x-3">
                            <button
                               onClick={() => handleInquiryToggleRead(inq)}
                               id={`inq-read-${inq.id}`}
                               className="text-art-accent hover:underline text-[10px] uppercase tracking-widest font-semibold"
                            >
                              Mark {inq.status === 'unread' ? 'Read' : 'Unread'}
                            </button>
                            <span className="text-art-border">|</span>
                            <button
                               onClick={() => handleInquiryDelete(inq.id)}
                               id={`inq-delete-${inq.id}`}
                               className="text-red-500 hover:underline text-[10px] uppercase tracking-widest font-semibold"
                            >
                              Delete Log
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 6. TAB: SYSTEM / BACKUP */}
            {activeTab === 'system' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-serif mb-2">Backup & Cloud Transfer</h2>
                  <p className="text-xs text-art-muted dark:text-art-darkMuted font-sans">
                    Transfer your entire portfolio data between your local computer and your Cloudflare live website.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Export Card */}
                  <div className="bg-art-card dark:bg-art-darkCard border border-art-border/40 p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-serif">1. Export Portfolio Backup</h3>
                      <p className="text-xs text-art-muted leading-relaxed">
                        Download a single backup file (`.json`) containing all your biography, CV, collections list, and high-definition artworks with their image files. Keep this file safe as a personal backup or to copy it to your live website!
                      </p>
                    </div>
                    <button
                      onClick={handleExport}
                      className="w-full bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white dark:hover:bg-art-accent dark:hover:text-white py-3 text-xs uppercase tracking-widest font-semibold transition-all duration-300 cursor-pointer"
                    >
                      Download Backup File
                    </button>
                  </div>

                  {/* Import Card */}
                  <div className="bg-art-card dark:bg-art-darkCard border border-art-border/40 p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-serif">2. Import / Restore Backup</h3>
                      <p className="text-xs text-art-muted leading-relaxed">
                        Upload a previously exported backup file (`.json`). This will completely overwrite your current browser's database with the profile settings and artworks from the backup file. Perfect for publishing your local work online!
                      </p>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept=".json"
                        id="import-backup-file"
                        onChange={handleImport}
                        className="hidden"
                      />
                      <button
                        onClick={() => document.getElementById('import-backup-file')?.click()}
                        className="w-full border border-art-border dark:border-art-darkBorder text-art-dark dark:text-art-bg hover:border-art-accent hover:text-art-accent py-3 text-xs uppercase tracking-widest font-semibold transition-all duration-300 cursor-pointer"
                      >
                        Select & Upload Backup
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 border border-amber-500/20 text-xs flex items-start space-x-3">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">How to Deploy & Synchronize Your Changes:</p>
                    <ol className="list-decimal list-inside space-y-1.5 mt-1.5 leading-relaxed font-sans">
                      <li>Make all your changes, add new pictures, and write your CV on this local dashboard.</li>
                      <li>Go to this **Backup & Transfer** tab, click **Download Backup File** and save the JSON file to your computer.</li>
                      <li>Upload your project code to **Cloudflare** (or build/push changes to your repository).</li>
                      <li>Open your live Cloudflare website, navigate to the private **Studio** dashboard (using the key shortcut `Ctrl + Shift + S` or triple-clicking the copyright text), and log in with your passcode.</li>
                      <li>Go to the **Backup & Transfer** tab on the live Cloudflare site, select the JSON file you downloaded in Step 2, and upload it. **Your live site is now fully updated and live!**</li>
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}

          </main>
        </div>

      </div>
    </motion.div>
  );
};
