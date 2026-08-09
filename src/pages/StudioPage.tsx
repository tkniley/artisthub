import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Layers, BookOpen, MessageSquare, LogOut } from 'lucide-react';
import {
  clearStudioToken,
  exportPortfolioData,
  getArtworks,
  getCollections,
  getInquiries,
  getProfile,
  hasStudioSession,
  refreshPortfolio,
} from '../db';
import type { Artwork, Inquiry, Profile } from '../types';
import { StudioLogin } from '../studio/StudioLogin';
import { PaintingsPanel } from '../studio/PaintingsPanel';
import { CollectionsPanel } from '../studio/CollectionsPanel';
import { AboutPanel } from '../studio/AboutPanel';
import { MessagesPanel } from '../studio/MessagesPanel';

type Tab = 'paintings' | 'collections' | 'about' | 'messages';

export const StudioPage: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('paintings');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const loadAll = useCallback(async () => {
    await refreshPortfolio();
    const [p, arts, cols] = await Promise.all([
      getProfile(),
      getArtworks(),
      getCollections(),
    ]);
    setProfile(p);
    setArtworks(arts);
    setCollections(cols);
    try {
      const inqs = await getInquiries();
      setInquiries(inqs);
    } catch {
      setInquiries([]);
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      if (!hasStudioSession()) {
        setLoading(false);
        return;
      }
      try {
        await loadAll();
        setAuthenticated(true);
      } catch {
        clearStudioToken();
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, [loadAll]);

  const handleLogout = () => {
    clearStudioToken();
    setAuthenticated(false);
    setProfile(null);
    setArtworks([]);
    setCollections([]);
    setInquiries([]);
  };

  const handleBackup = async () => {
    try {
      const data = await exportPortfolioData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `site-backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not download backup.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-art-bg dark:bg-art-darkBg">
        <p className="font-serif text-xl text-art-muted">Opening Studio…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <StudioLogin
        onSuccess={async () => {
          setLoading(true);
          try {
            await loadAll();
            setAuthenticated(true);
          } catch (err) {
            clearStudioToken();
            alert(err instanceof Error ? err.message : 'Could not open Studio.');
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-art-muted">Could not load your site data.</p>
      </div>
    );
  }

  const unread = inquiries.filter((i) => i.status === 'unread').length;

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'paintings', label: 'My Paintings', icon: <Image size={20} /> },
    { id: 'collections', label: 'Collections', icon: <Layers size={20} /> },
    { id: 'about', label: 'About my site', icon: <BookOpen size={20} /> },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare size={20} />,
      badge: unread || undefined,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-art-bg dark:bg-art-darkBg text-art-dark dark:text-art-bg py-10 px-4 sm:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 border-b border-art-border/40 pb-8">
          <div>
            <p className="text-base text-art-muted mb-2">Private Studio</p>
            <h1 className="text-4xl sm:text-5xl font-serif">{profile.name}</h1>
            <p className="text-lg text-art-muted mt-3 max-w-xl">
              Add and edit paintings here. When you save, your website updates immediately — no
              special steps needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/gallery"
              className="px-5 py-3 border border-art-border text-base hover:border-art-accent"
            >
              View gallery
            </Link>
            <button
              type="button"
              onClick={handleBackup}
              className="px-5 py-3 border border-art-border text-base hover:border-art-accent"
            >
              Download backup
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-3 border border-art-border text-base hover:border-red-500 hover:text-red-600"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <nav className="lg:col-span-3 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-4 text-left text-lg border-l-4 transition-colors ${
                  tab === item.id
                    ? 'border-art-accent bg-art-card/60 dark:bg-art-darkCard/60 text-art-accent'
                    : 'border-transparent hover:bg-art-card/30'
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="bg-art-accent text-white text-sm px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <main className="lg:col-span-9 border border-art-border/40 dark:border-art-darkBorder/40 bg-art-card/30 dark:bg-art-darkCard/30 p-6 sm:p-10">
            {tab === 'paintings' && (
              <PaintingsPanel
                artworks={artworks}
                collections={collections}
                onChanged={loadAll}
              />
            )}
            {tab === 'collections' && (
              <CollectionsPanel
                collections={collections}
                artworks={artworks}
                onChanged={loadAll}
              />
            )}
            {tab === 'about' && (
              <AboutPanel
                key={`${profile.name}|${profile.tagline}|${profile.heroImage}|${profile.portraitImage}`}
                profile={profile}
                onChanged={loadAll}
              />
            )}
            {tab === 'messages' && (
              <MessagesPanel inquiries={inquiries} onChanged={loadAll} />
            )}
          </main>
        </div>
      </div>
    </motion.div>
  );
};
