import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CVSection, Profile } from '../types';
import { compressImageFile, saveProfile, uploadImage } from '../db';

interface AboutPanelProps {
  profile: Profile;
  onChanged: () => Promise<void>;
}

function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export const AboutPanel: React.FC<AboutPanelProps> = ({ profile, onChanged }) => {
  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline);
  const [philosophy, setPhilosophy] = useState(profile.philosophy);
  const [bioText, setBioText] = useState(profile.bioText);
  const [heroImage, setHeroImage] = useState(profile.heroImage);
  const [portraitImage, setPortraitImage] = useState(profile.portraitImage);
  const [email, setEmail] = useState(profile.email || '');
  const [instagramUrl, setInstagramUrl] = useState(profile.instagramUrl || '');
  const [artsyUrl, setArtsyUrl] = useState(profile.artsyUrl || '');
  const [pinterestUrl, setPinterestUrl] = useState(profile.pinterestUrl || '');
  const [showCv, setShowCv] = useState(!!profile.showCv);
  const [cv, setCv] = useState<CVSection[]>(profile.cv || []);
  const [activeSectionId, setActiveSectionId] = useState(profile.cv?.[0]?.id || '');
  const [cvYear, setCvYear] = useState('');
  const [cvTitle, setCvTitle] = useState('');
  const [cvDetail, setCvDetail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const uploadField = async (file: File, setter: (url: string) => void) => {
    const compressed = await compressImageFile(file);
    const url = await uploadImage(compressed);
    setter(url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    const cleanEmail = email.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address, or leave it blank.');
      return;
    }
    setBusy(true);
    try {
      const next: Profile = {
        name: name.trim(),
        tagline: tagline.trim(),
        philosophy: philosophy.trim(),
        heroImage,
        bioText: bioText.trim(),
        portraitImage,
        email: cleanEmail,
        instagramUrl: normalizeUrl(instagramUrl),
        artsyUrl: normalizeUrl(artsyUrl),
        pinterestUrl: normalizeUrl(pinterestUrl),
        showCv,
        cv,
      };
      await saveProfile(next);
      setInstagramUrl(next.instagramUrl);
      setArtsyUrl(next.artsyUrl);
      setPinterestUrl(next.pinterestUrl);
      await onChanged();
      setSuccess('Saved — it’s on your website now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const addCvItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSectionId || !cvYear.trim() || !cvTitle.trim()) return;
    setCv((sections) =>
      sections.map((sec) =>
        sec.id === activeSectionId
          ? {
              ...sec,
              items: [
                ...sec.items,
                {
                  id: `cvi-${Date.now()}`,
                  year: cvYear.trim(),
                  title: cvTitle.trim(),
                  detail: cvDetail.trim(),
                },
              ],
            }
          : sec
      )
    );
    setCvYear('');
    setCvTitle('');
    setCvDetail('');
  };

  const deleteCvItem = (sectionId: string, itemId: string) => {
    setCv((sections) =>
      sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, items: sec.items.filter((item) => item.id !== itemId) }
          : sec
      )
    );
  };

  const activeSection = cv.find((s) => s.id === activeSectionId);

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h2 className="text-3xl font-serif">About my site</h2>
        <p className="text-base text-art-muted mt-2">
          Update your name, contact info, home page text, biography, photos, and CV.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <section className="space-y-5">
          <h3 className="text-2xl font-serif">Home page</h3>
          <div>
            <label className="block text-lg font-medium mb-2">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-art-border px-4 py-3 text-lg bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">Short tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full border border-art-border px-4 py-3 text-lg bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">Welcome statement</label>
            <textarea
              rows={3}
              value={philosophy}
              onChange={(e) => setPhilosophy(e.target.value)}
              className="w-full border border-art-border px-4 py-3 text-lg bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-3">Home page photo</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {heroImage && (
                <img src={heroImage} alt="" className="h-32 w-48 object-cover border border-art-border" />
              )}
              <div>
                <input
                  id="hero-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      await uploadField(file, setHeroImage);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Upload failed');
                    }
                  }}
                />
                <label
                  htmlFor="hero-upload"
                  className="inline-block cursor-pointer bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark px-5 py-3 text-base font-semibold hover:bg-art-accent hover:text-white"
                >
                  Choose photo
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-art-border/40 pt-8">
          <h3 className="text-2xl font-serif">Email & social links</h3>
          <p className="text-base text-art-muted">
            These show on your website footer and About page. Leave a field blank to hide that link.
          </p>
          <div>
            <label className="block text-lg font-medium mb-2">Contact email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="studio@example.com"
              className="w-full border border-art-border px-4 py-3 text-lg bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">Instagram</label>
            <input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/yourname"
              className="w-full border border-art-border px-4 py-3 text-lg bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">Artsy</label>
            <input
              value={artsyUrl}
              onChange={(e) => setArtsyUrl(e.target.value)}
              placeholder="https://www.artsy.net/artist/..."
              className="w-full border border-art-border px-4 py-3 text-lg bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">Pinterest</label>
            <input
              value={pinterestUrl}
              onChange={(e) => setPinterestUrl(e.target.value)}
              placeholder="https://www.pinterest.com/yourname"
              className="w-full border border-art-border px-4 py-3 text-lg bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
            />
          </div>
        </section>

        <section className="space-y-5 border-t border-art-border/40 pt-8">
          <h3 className="text-2xl font-serif">About page</h3>
          <div>
            <label className="block text-lg font-medium mb-2">Biography</label>
            <textarea
              rows={10}
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="w-full border border-art-border px-4 py-3 text-lg bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
            />
            <p className="text-sm text-art-muted mt-2">Leave a blank line between paragraphs.</p>
          </div>
          <div>
            <label className="block text-lg font-medium mb-3">Portrait photo</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {portraitImage && (
                <img
                  src={portraitImage}
                  alt=""
                  className="h-40 w-32 object-cover border border-art-border"
                />
              )}
              <div>
                <input
                  id="portrait-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      await uploadField(file, setPortraitImage);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Upload failed');
                    }
                  }}
                />
                <label
                  htmlFor="portrait-upload"
                  className="inline-block cursor-pointer bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark px-5 py-3 text-base font-semibold hover:bg-art-accent hover:text-white"
                >
                  Choose photo
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-art-border/40 pt-8">
          <h3 className="text-2xl font-serif">CV / exhibitions</h3>
          <label className="flex items-start gap-3 text-base cursor-pointer">
            <input
              type="checkbox"
              checked={showCv}
              onChange={(e) => setShowCv(e.target.checked)}
              className="h-5 w-5 mt-0.5"
            />
            <span>
              Show CV on the website
              <span className="block text-sm text-art-muted mt-1">
                Off by default. Turn on when you want visitors to see exhibitions and education.
              </span>
            </span>
          </label>

          {showCv && (
            <>
              {cv.length === 0 ? (
                <p className="text-base text-art-muted">No CV sections yet.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {cv.map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveSectionId(sec.id)}
                        className={`px-4 py-2 text-base border ${
                          activeSectionId === sec.id
                            ? 'bg-art-accent border-art-accent text-white'
                            : 'border-art-border'
                        }`}
                      >
                        {sec.category}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      value={cvYear}
                      onChange={(e) => setCvYear(e.target.value)}
                      placeholder="Year"
                      className="border border-art-border px-3 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                    />
                    <input
                      value={cvTitle}
                      onChange={(e) => setCvTitle(e.target.value)}
                      placeholder="Title"
                      className="sm:col-span-2 border border-art-border px-3 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                    />
                    <input
                      value={cvDetail}
                      onChange={(e) => setCvDetail(e.target.value)}
                      placeholder="Place"
                      className="border border-art-border px-3 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCvItem}
                    className="inline-flex items-center gap-2 border border-art-border px-4 py-3 text-base hover:border-art-accent"
                  >
                    <Plus size={18} />
                    Add to this list
                  </button>

                  <div className="space-y-2">
                    {(activeSection?.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between gap-3 items-start border border-art-border/50 p-3"
                      >
                        <p className="text-base">
                          <span className="text-art-accent font-semibold mr-2">{item.year}</span>
                          <span className="font-serif italic">{item.title}</span>
                          {item.detail && (
                            <span className="text-art-muted"> — {item.detail}</span>
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteCvItem(activeSectionId, item.id)}
                          className="text-red-600 p-2"
                          aria-label="Remove CV row"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {error && (
          <div className="text-base text-red-700 bg-red-500/10 border border-red-500/20 p-4">{error}</div>
        )}
        {success && (
          <div className="text-base text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 p-4">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white px-8 py-4 text-lg font-semibold disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save site info'}
        </button>
      </form>
    </div>
  );
};
