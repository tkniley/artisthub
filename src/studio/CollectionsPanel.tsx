import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Artwork } from '../types';
import { addCollection, removeCollection, renameCollection } from '../db';

interface CollectionsPanelProps {
  collections: string[];
  artworks: Artwork[];
  onChanged: () => Promise<void>;
}

export const CollectionsPanel: React.FC<CollectionsPanelProps> = ({
  collections,
  artworks,
  onChanged,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await addCollection(name);
      setName('');
      await onChanged();
      setSuccess('Collection added — it’s ready to use.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add collection.');
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (oldName: string) => {
    const next = window.prompt('New name for this collection:', oldName);
    if (!next || next.trim() === oldName) return;
    try {
      await renameCollection(oldName, next.trim());
      await onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not rename collection.');
    }
  };

  const handleDelete = async (colName: string) => {
    if (
      !window.confirm(
        `Delete collection “${colName}”? Paintings stay on the site; they just lose this label.`
      )
    ) {
      return;
    }
    try {
      await removeCollection(colName);
      await onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete collection.');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-3xl font-serif">Collections</h2>
        <p className="text-base text-art-muted mt-2">
          Groups for your paintings (for example a show name). Visitors can filter by these.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New collection name"
          className="flex-1 border border-art-border dark:border-art-darkBorder bg-art-bg dark:bg-art-darkBg px-4 py-3 text-lg focus:border-art-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="inline-flex items-center justify-center gap-2 bg-art-dark dark:bg-art-bg text-art-bg dark:text-art-dark hover:bg-art-accent hover:text-white px-6 py-3 text-lg font-semibold disabled:opacity-50"
        >
          <Plus size={20} />
          Add
        </button>
      </form>

      {error && (
        <div className="text-base text-red-700 bg-red-500/10 border border-red-500/20 p-4">{error}</div>
      )}
      {success && (
        <div className="text-base text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 p-4">
          {success}
        </div>
      )}

      <div className="space-y-3">
        {collections.length === 0 ? (
          <p className="text-lg text-art-muted">No collections yet.</p>
        ) : (
          collections.map((colName) => {
            const count = artworks.filter((a) => a.collections.includes(colName)).length;
            return (
              <div
                key={colName}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-art-border/60 p-4"
              >
                <div>
                  <p className="text-xl font-serif">{colName}</p>
                  <p className="text-base text-art-muted mt-1">
                    {count} painting{count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRename(colName)}
                    className="px-4 py-3 border border-art-border text-base hover:border-art-accent"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(colName)}
                    className="inline-flex items-center gap-2 px-4 py-3 border border-art-border text-base text-red-600 hover:border-red-500"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
