import { useMemo, useState } from 'react';
import { Node } from 'reactflow';
import { Search, X, ChevronLeft, ChevronRight, LayoutList } from 'lucide-react';

interface LeftSidebarProps {
    nodes: Node[];
    selectedNodeId?: string;
    onNodeSelect: (nodeId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export default function LeftSidebar({ nodes, selectedNodeId, onNodeSelect, isOpen, onToggle }: LeftSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter out group nodes and sort alphabetically by label (or id)
    const sortedNodes = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return nodes
            .filter(n => n.type !== 'groupNode')
            .filter(n => {
                if (!query) return true;
                const name = (n.data?.label || n.id).toLowerCase();
                return name.includes(query);
            })
            .sort((a, b) => {
                const nameA = (a.data?.label || a.id).toLowerCase();
                const nameB = (b.data?.label || b.id).toLowerCase();
                return nameA.localeCompare(nameB);
            });
    }, [nodes, searchQuery]);

    return (
        <div className={`h-full bg-white border-r border-gray-200 flex flex-col items-stretch flex-shrink-0 transition-all duration-300 ${isOpen ? 'w-64' : 'w-12 bg-gray-50'}`}>
            {isOpen ? (
                <>
                    <div className="p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex items-center justify-between gap-1">
                        <button onClick={onToggle} className="p-1 -ml-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors flex-shrink-0" title="Collapse side panel">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="relative flex-1 flex items-center bg-white rounded border border-gray-300 px-2 py-1 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                            <Search className="w-3 h-3 text-gray-400 mr-1.5 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Filter list..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-gray-700 w-full placeholder-gray-400 min-w-0"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="ml-1 p-0.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors flex-shrink-0"
                                    title="Clear filter"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <span
                            className="text-xs font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full flex-shrink-0"
                            title={searchQuery ? `${sortedNodes.length} nodes found` : `Total active nodes: ${sortedNodes.length}`}
                        >
                            {sortedNodes.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 py-1">
                        {sortedNodes.map((node) => {
                            const isSelected = node.id === selectedNodeId;
                            return (
                                <button
                                    key={node.id}
                                    onClick={() => onNodeSelect(node.id)}
                                    className={`w-full text-left px-2 py-0.5 text-xs font-medium transition-colors truncate ${isSelected
                                        ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-2 border-transparent'
                                        }`}
                                    title={node.data?.label || node.id}
                                >
                                    {node.data?.label || node.id}
                                </button>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center py-3">
                    <button onClick={onToggle} className="p-1.5 mb-6 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition-colors shadow-sm bg-indigo-50 border border-indigo-300" title="Expand side panel">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="flex-col flex items-center gap-3 text-gray-400">
                        <LayoutList className="w-4 h-4" />
                        <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>Nodes ({sortedNodes.length})</span>
                    </div>
                </div>
            )}
        </div>
    );
}
