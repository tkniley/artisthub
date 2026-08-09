import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft, Check } from 'lucide-react';
import type { Artwork } from '../types';
import { compressImageFile, deleteArtwork, saveArtwork, uploadImage } from '../db';

interface PaintingsPanelProps {
  artworks: Artwork[];
  collections: string[];
  onChanged: () => Promise<void>;
}

const emptyForm = {
  title: '',
  year: String(new Date().getFullYear()),
  medium: '',
  dimensions: '',
  price: '',
  description: '',
  status: 'available' as Artwork['status'],
  collections: [] as string[],
  isGallery: true,
  isFeatured: false,
  imageUrl: '',
};

export const PaintingsPanel: React.FC<PaintingsPanelProps> = ({
  artworks,
  collections,
  onChanged,
}) => {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [mediumFocused, setMediumFocused] = useState(false);

  const sorted = useMemo(
    () => [...artworks].sort((a, b) => b.createdAt - a.createdAt),
    [artworks]
  );

  const knownMediums = useMemo(() => {
    const counts = new Map<string, number>();
    for (const art of artworks) {
      const value = (art.medium || '').trim();
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value]) => value);
  }, [artworks]);

  const mediumSuggestions = useMemo(() => {
    const query = form.medium.trim().toLowerCase();
    if (!query) return knownMediums;
    return knownMediums.filter(
      (m) => m.toLowerCase().includes(query) && m.toLowerCase() !== query
    );
  }, [knownMediums, form.medium]);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPreview('');
    setPendingFile(null);
    setShowDetails(false);
    setError('');
    setSuccess('');
    setMode('edit');
  };

  const startEdit = (art: Artwork) => {
    setEditingId(art.id);
    setForm({
      title: art.title,
      year: art.year,
      medium: art.medium,
      dimensions: art.dimensions,
      price: art.price,
      description: art.description,
      status: art.status,
      collections: [...(art.collections || [])],
      isGallery: art.isGallery,
      isFeatured: art.isFeatured,
      imageUrl: art.imageUrl,
    });
    setPreview(art.imageUrl);
    setPendingFile(null);
    setShowDetails(true);
    setError('');
    setSuccess('');
    setMode('edit');
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const toggleCollection = (name: string) => {
    setForm((prev) => ({
      ...prev,
      collections: prev.collections.includes(name)
        ? prev.collections.filter((c) => c !== name)
        : [...prev.collections, name],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError('Please enter a title for the painting.');
      return;
    }

    setBusy(true);
    try {
      let imageUrl = form.imageUrl;
      if (pendingFile) {
        const compressed = await compressImageFile(pendingFile);
        imageUrl = await uploadImage(compressed);
      }
      if (!imageUrl) {
        setError('Please add a photo of the painting.');
        setBusy(false);
        return;
      }

      const artwork: Artwork = {
        id: editingId || `art-${Date.now()}`,
        title: form.title.trim(),
        year: form.year.trim() || String(new Date().getFullYear()),
        medium: form.medium.trim(),
        dimensions: form.dimensions.trim(),
        price: form.price.trim(),
        status: form.status,
        description: form.description.trim(),
        imageUrl,
        collections: form.collections,
        isGallery: form.isGallery,
        isFeatured: form.isFeatured,
        createdAt:
          editingId
            ? artworks.find((a) => a.id === editingId)?.createdAt || Date.now()
            : Date.now(),
      };

      await saveArtwork(artwork);
      await onChanged();
      setSuccess('Saved — it’s on your website now.');
      setPendingFile(null);
      setForm((prev) => ({ ...prev, imageUrl }));
      setPreview(imageUrl);
      setEditingId(artwork.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save painting.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (art: Artwork) => {
    if (!window.confirm(`Delete “${art.title}”? This removes it from your website.`)) return;
    try {
      await deleteArtwork(art.id);
      await onChanged();
      if (editingId === art.id) setMode('list');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete painting.');
    }
  };

  if (mode === 'edit') {
    return (
      <div className="space-y-8">
        <button
          type="button"
          onClick={() => setMode('list')}
          className="inline-flex items-center gap-2 text-lg text-art-accent hover:underline"
        >
          <ArrowLeft size={20} />
          Back to paintings
        </button>

        <div>
          <h2 className="text-3xl font-serif">
            {editingId ? 'Edit painting' : 'Add a painting'}
          </h2>
          <p className="text-base text-art-muted mt-2">
            Add a photo and title. Everything else is optional.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
          <div>
            <label className="block text-lg font-medium mb-3">Photo *</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="h-48 w-48 bg-art-bg dark:bg-art-darkBg border border-art-border overflow-hidden flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-art-muted text-sm px-4 text-center">No photo yet</span>
                )}
              </div>
              <div>
                <input
                  id="painting-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickPhoto}
                />
                <label
                  htmlFor="painting-photo"
                  className="inline-block cursor-pointer bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark px-6 py-3 text-base font-semibold hover:bg-art-accent hover:text-white transition-colors"
                >
                  Choose photo
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-art-border dark:border-art-darkBorder bg-art-bg dark:bg-art-darkBg px-4 py-3 text-lg focus:border-art-accent focus:outline-none"
              placeholder="Name of the painting"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-base text-art-accent hover:underline"
          >
            {showDetails ? 'Hide extra details' : 'Show extra details (price, size, collections…)'}
          </button>

          {showDetails && (
            <div className="space-y-6 border-t border-art-border/40 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium mb-2">Year</label>
                  <input
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full border border-art-border px-4 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">Price</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="$2,400 or On Request"
                    className="w-full border border-art-border px-4 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-base font-medium mb-2">Medium</label>
                <input
                  value={form.medium}
                  onChange={(e) => setForm({ ...form, medium: e.target.value })}
                  onFocus={() => setMediumFocused(true)}
                  onBlur={() => {
                    // Delay so a suggestion click can register first
                    window.setTimeout(() => setMediumFocused(false), 150);
                  }}
                  placeholder="Type a new medium, or pick one you’ve used"
                  list="medium-suggestions"
                  autoComplete="off"
                  className="w-full border border-art-border px-4 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                />
                <datalist id="medium-suggestions">
                  {knownMediums.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                {mediumFocused && mediumSuggestions.length > 0 && (
                  <div className="mt-2 border border-art-border/60 bg-art-card dark:bg-art-darkCard max-h-48 overflow-y-auto">
                    <p className="px-3 py-2 text-sm text-art-muted border-b border-art-border/40">
                      Previously used
                    </p>
                    {mediumSuggestions.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setForm({ ...form, medium: m });
                          setMediumFocused(false);
                        }}
                        className="w-full text-left px-4 py-3 text-base hover:bg-art-accent/10 border-b border-art-border/30 last:border-b-0"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
                {!mediumFocused && knownMediums.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {knownMediums.slice(0, 8).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm({ ...form, medium: m })}
                        className={`px-3 py-2 text-sm border transition-colors ${
                          form.medium === m
                            ? 'border-art-accent bg-art-accent/15 text-art-accent'
                            : 'border-art-border text-art-dark/70 dark:text-art-bg/70 hover:border-art-accent'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-base font-medium mb-2">Size</label>
                <input
                  value={form.dimensions}
                  onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                  placeholder="36 x 48 inches"
                  className="w-full border border-art-border px-4 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-base font-medium mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Artwork['status'] })
                  }
                  className="w-full border border-art-border px-4 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-medium mb-2">Short description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-art-border px-4 py-3 text-base bg-art-bg dark:bg-art-darkBg focus:border-art-accent focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-base cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isGallery}
                    onChange={(e) => setForm({ ...form, isGallery: e.target.checked })}
                    className="h-5 w-5"
                  />
                  Show in the Gallery page
                </label>
                <label className="flex items-center gap-3 text-base cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="h-5 w-5"
                  />
                  Feature on the home page
                </label>
              </div>

              {collections.length > 0 && (
                <div>
                  <label className="block text-base font-medium mb-3">Collections</label>
                  <div className="flex flex-wrap gap-2">
                    {collections.map((name) => {
                      const on = form.collections.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleCollection(name)}
                          className={`px-4 py-2 text-base border inline-flex items-center gap-2 ${
                            on
                              ? 'bg-art-accent/15 border-art-accent text-art-accent'
                              : 'border-art-border text-art-dark/70 dark:text-art-bg/70'
                          }`}
                        >
                          {name}
                          {on && <Check size={16} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-base text-red-700 bg-red-500/10 border border-red-500/20 p-4">
              {error}
            </div>
          )}
          {success && (
            <div className="text-base text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 p-4">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full sm:w-auto min-w-[220px] bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white px-8 py-4 text-lg font-semibold disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save painting'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif">My Paintings</h2>
          <p className="text-base text-art-muted mt-2">
            Tap a painting to edit it. Changes appear on your website right away.
          </p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center justify-center gap-2 bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white px-6 py-4 text-lg font-semibold"
        >
          <Plus size={22} />
          Add a painting
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="border border-dashed border-art-border p-12 text-center text-lg text-art-muted">
          No paintings yet. Tap “Add a painting” to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((art) => (
            <div
              key={art.id}
              className="border border-art-border/60 dark:border-art-darkBorder/60 bg-art-card/40 dark:bg-art-darkCard/40 overflow-hidden"
            >
              <button type="button" onClick={() => startEdit(art)} className="block w-full text-left">
                <div className="aspect-square bg-art-bg overflow-hidden">
                  <img src={art.imageUrl} alt={art.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-xl">{art.title}</h3>
                  <p className="text-base text-art-muted mt-1 capitalize">{art.status}</p>
                </div>
              </button>
              <div className="px-4 pb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(art)}
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-art-border py-3 text-base hover:border-art-accent"
                >
                  <Pencil size={18} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(art)}
                  className="inline-flex items-center justify-center gap-2 border border-art-border px-4 py-3 text-base text-red-600 hover:border-red-500"
                  aria-label={`Delete ${art.title}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
