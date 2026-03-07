import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Node } from 'reactflow';
import { GroupData } from '../types';

interface GroupSidebarProps {
  groupNode: Node;
  memberNodes: Node[];
  onClose: () => void;
  onUpdate: (newData: Partial<GroupData>) => void;
  onDelete: () => void;
  onRemoveMember: (memberId: string) => void;
}

export default function GroupSidebar({
  groupNode,
  memberNodes: initialMembers,
  onClose,
  onUpdate,
  onDelete,
  onRemoveMember,
}: GroupSidebarProps) {
  const data = groupNode.data as GroupData;
  const [members, setMembers] = useState<Node[]>(initialMembers);

  const borderColor = data.borderColor || '#fbbf24';
  const bgColor = data.bgColor || '#fffbeb';
  const titleColor = data.titleColor || '#92400e';
  const commentColor = data.commentColor || '#d97706';

  const handleRemoveMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    onRemoveMember(memberId);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      {/* Záhlaví */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-amber-50">
        <span className="text-sm font-semibold text-amber-800">Group</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Obsah */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input
            type="text"
            defaultValue={data.label}
            onChange={e => onUpdate({ label: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            defaultValue={data.comment || ''}
            onChange={e => onUpdate({ comment: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>

        {/* Colors */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Colors</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                defaultValue={borderColor}
                onChange={e => onUpdate({ borderColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                title="Border color"
              />
              <span className="text-xs text-gray-600">Border</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                defaultValue={bgColor}
                onChange={e => onUpdate({ bgColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                title="Background color"
              />
              <span className="text-xs text-gray-600">Background</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                defaultValue={titleColor}
                onChange={e => onUpdate({ titleColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                title="Title color"
              />
              <span className="text-xs text-gray-600">Title</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                defaultValue={commentColor}
                onChange={e => onUpdate({ commentColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                title="Description color"
              />
              <span className="text-xs text-gray-600">Description</span>
            </div>
          </div>
        </div>

        {/* Members */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Members ({members.length})
          </label>
          {members.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Group is empty</p>
          ) : (
            <ul className="space-y-1">
              {members.map(member => (
                <li
                  key={member.id}
                  className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg"
                >
                  <span className="text-xs text-gray-700 truncate flex-1 mr-2">
                    {(member.data as any)?.label || member.id}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    title="Remove from group"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
