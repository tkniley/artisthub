import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { loginStudio } from '../db';

interface StudioLoginProps {
  onSuccess: () => void;
}

export const StudioLogin: React.FC<StudioLoginProps> = ({ onSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await loginStudio(passcode, rememberMe);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setPasscode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-art-bg dark:bg-art-darkBg py-12 px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-art-accent/5 rounded-full blur-3xl pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-art-card/90 dark:bg-art-darkCard/90 border border-art-border dark:border-art-darkBorder backdrop-blur-md p-8 sm:p-10 shadow-xl">
          <div className="h-16 w-16 bg-art-accent/10 rounded-full flex items-center justify-center mb-6 border border-art-accent/20 mx-auto">
            <Lock className="text-art-accent h-6 w-6" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif text-art-dark dark:text-art-bg">Studio</h1>
            <p className="text-base text-art-muted dark:text-art-darkMuted mt-3 leading-relaxed">
              Enter your passcode to add and edit paintings on your website.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="password"
              value={passcode}
              maxLength={24}
              autoFocus
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError('');
              }}
              placeholder="Passcode"
              className="w-full bg-art-bg/50 dark:bg-art-darkBg/50 border border-art-border dark:border-art-darkBorder px-4 py-4 text-center text-xl font-serif tracking-widest focus:border-art-accent focus:outline-none text-art-dark dark:text-art-bg"
            />
            <label className="flex items-center gap-3 text-base text-art-dark/80 dark:text-art-bg/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 accent-[var(--color-art-accent,#A88D65)]"
              />
              Stay signed in on this computer
            </label>
            {error && (
              <p className="text-base text-red-600 dark:text-red-400 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={busy || !passcode}
              className="w-full bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white py-4 text-lg font-semibold transition-colors disabled:opacity-50"
            >
              {busy ? 'Checking…' : 'Open Studio'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
