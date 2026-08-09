import React from 'react';
import type { Inquiry } from '../types';
import { deleteInquiry, saveInquiry } from '../db';

interface MessagesPanelProps {
  inquiries: Inquiry[];
  onChanged: () => Promise<void>;
}

export const MessagesPanel: React.FC<MessagesPanelProps> = ({ inquiries, onChanged }) => {
  const toggleRead = async (inq: Inquiry) => {
    try {
      await saveInquiry({
        ...inq,
        status: inq.status === 'unread' ? 'read' : 'unread',
      });
      await onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update message.');
    }
  };

  const remove = async (inq: Inquiry) => {
    if (!window.confirm(`Delete message from ${inq.name}?`)) return;
    try {
      await deleteInquiry(inq.id);
      await onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete message.');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-3xl font-serif">Messages</h2>
        <p className="text-base text-art-muted mt-2">
          Notes from people who contacted you about a painting.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="border border-dashed border-art-border p-12 text-center text-lg text-art-muted">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className={`border p-5 ${
                inq.status === 'unread'
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : 'border-art-border/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-3">
                <div>
                  <p className="text-xl font-semibold">{inq.name}</p>
                  <a href={`mailto:${inq.email}`} className="text-base text-art-accent hover:underline">
                    {inq.email}
                  </a>
                </div>
                <p className="text-sm text-art-muted">
                  {new Date(inq.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="text-base text-art-muted mb-2">
                About: <span className="font-serif italic text-art-dark dark:text-art-bg">{inq.artworkTitle}</span>
              </p>
              <p className="text-lg leading-relaxed whitespace-pre-wrap border border-art-border/40 p-4 bg-art-bg/40 dark:bg-art-darkBg/40">
                {inq.message}
              </p>
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => toggleRead(inq)}
                  className="text-base text-art-accent hover:underline"
                >
                  Mark {inq.status === 'unread' ? 'read' : 'unread'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(inq)}
                  className="text-base text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
