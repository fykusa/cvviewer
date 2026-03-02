import { useState } from 'react';

interface GroupModalProps {
  isOpen: boolean;
  selectedCount: number;
  onConfirm: (title: string, comment: string) => void;
  onCancel: () => void;
}

export default function GroupModal({ isOpen, selectedCount, onConfirm, onCancel }: GroupModalProps) {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!title.trim()) return;
    onConfirm(title.trim(), comment.trim());
    setTitle('');
    setComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-96 max-w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Seskupit uzly</h2>
        <p className="text-sm text-gray-500 mb-4">Vybrané uzly: {selectedCount}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Název skupiny <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Zadejte název skupiny..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onCancel();
            }}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Komentář <span className="text-gray-400">(volitelný)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            placeholder="Popis skupiny..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={handleConfirm}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Vytvořit
          </button>
        </div>
      </div>
    </div>
  );
}
