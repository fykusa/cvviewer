import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Download, ArrowLeft, LayoutGrid, RefreshCw, BoxSelect, Search, X, Settings, HelpCircle } from 'lucide-react';
import { Node, Edge } from 'reactflow';

import FileUpload from './components/FileUpload';
import FlowViewer, { FlowViewerHandle } from './components/FlowViewer';
import GroupModal from './components/GroupModal';
import GroupSidebar from './components/GroupSidebar';
import Sidebar from './components/Sidebar';
import LeftSidebar from './components/LeftSidebar';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { parseCalculationView, transformToReactFlow, exportToXml } from './utils/xmlParser';
import { computeAutoLayout } from './utils/autoLayout';
import { GroupData, LayoutShape } from './types';

function App() {
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [layoutShapes, setLayoutShapes] = useState<LayoutShape[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isUnionModalOpen, setIsUnionModalOpen] = useState(false);
  const [isProjectionModalOpen, setIsProjectionModalOpen] = useState(false);
  const [groupSelectedCount, setGroupSelectedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const flowRef = useRef<FlowViewerHandle>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = useCallback(
    (content: string, name: string) => {
      try {
        setError(null);
        const parsed = parseCalculationView(content);
        const { nodes: flowNodes, edges: flowEdges } = transformToReactFlow(parsed);

        setXmlContent(content);
        setFileName(name);
        setNodes(flowNodes);
        setEdges(flowEdges);
        setLayoutShapes(parsed.layoutShapes);
        setSelectedNode(null);
        setIsSidebarOpen(false);
        setIsCommentModalOpen(false);
      } catch (err) {
        console.error('Failed to parse XML:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse the Calculation View file');
      }
    },
    []
  );

  const handleFileMerge = useCallback(
    (content: string, name: string) => {
      if (!flowRef.current) return;
      try {
        setError(null);
        const parsed = parseCalculationView(content);
        const { nodes: newNodes, edges: newEdges } = transformToReactFlow(parsed);

        const currentNodes = flowRef.current.getCurrentNodes();
        const currentPositionMap = new Map<string, { x: number; y: number }>();
        currentNodes.forEach((n) => {
          const pos = (n as any).positionAbsolute ?? n.position;
          currentPositionMap.set(n.id, pos);
        });

        const mergedNodes: Node[] = newNodes.map((newNode) => {
          if (currentPositionMap.has(newNode.id)) {
            return { ...newNode, position: currentPositionMap.get(newNode.id)! };
          }
          return newNode;
        });

        flowRef.current.applyLayout(mergedNodes);
        flowRef.current.applyEdges(newEdges);

        setNodes(mergedNodes);
        setEdges(newEdges);
        setXmlContent(content);
        setFileName(name);
        setLayoutShapes(parsed.layoutShapes);

        setSelectedNode((prev) => {
          if (!prev) return null;
          const updated = mergedNodes.find((n) => n.id === prev.id);
          if (!updated) {
            setIsSidebarOpen(false);
            setIsCommentModalOpen(false);
            setIsFilterModalOpen(false);
            return null;
          }
          return updated;
        });
      } catch (err) {
        console.error('Failed to merge XML:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse the Calculation View file');
      }
    },
    []
  );

  const handleMergeFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = '';
      const reader = new FileReader();
      reader.onload = (e) => {
        handleFileMerge(e.target?.result as string, file.name);
      };
      reader.readAsText(file);
    },
    [handleFileMerge]
  );

  useEffect(() => {
    const handleOpenCustom = (type: 'comment' | 'filter' | 'join' | 'union' | 'projection') => (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string }>;
      const targetNode = nodes.find(n => n.id === customEvent.detail.nodeId);
      if (targetNode) {
        setSelectedNode(targetNode);
        setIsSidebarOpen(true);
        setIsCommentModalOpen(type === 'comment');
        setIsFilterModalOpen(type === 'filter');
        setIsJoinModalOpen(type === 'join');
        setIsUnionModalOpen(type === 'union');
        setIsProjectionModalOpen(type === 'projection');
      }
    };

    const hc = handleOpenCustom('comment');
    const hf = handleOpenCustom('filter');
    const hj = handleOpenCustom('join');
    const hu = handleOpenCustom('union');
    const hp = handleOpenCustom('projection');

    window.addEventListener('open-node-comment', hc);
    window.addEventListener('open-node-filter', hf);
    window.addEventListener('open-node-join', hj);
    window.addEventListener('open-node-union', hu);
    window.addEventListener('open-node-projection', hp);

    return () => {
      window.removeEventListener('open-node-comment', hc);
      window.removeEventListener('open-node-filter', hf);
      window.removeEventListener('open-node-join', hj);
      window.removeEventListener('open-node-union', hu);
      window.removeEventListener('open-node-projection', hp);
    };
  }, [nodes]);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
    setIsSidebarOpen(true);
    setIsCommentModalOpen(false);
    setIsFilterModalOpen(false);
    setIsJoinModalOpen(false);
    setIsUnionModalOpen(false);
    setIsProjectionModalOpen(false);
  }, []);

  const handleReset = useCallback(() => {
    setXmlContent(null);
    setFileName(null);
    setNodes([]);
    setEdges([]);
    setLayoutShapes([]);
    setSelectedNode(null);
    setIsSidebarOpen(false);
    setError(null);
    setSearchQuery('');
    setIsCommentModalOpen(false);
    setIsFilterModalOpen(false);
    setIsJoinModalOpen(false);
    setIsUnionModalOpen(false);
    setIsProjectionModalOpen(false);
  }, []);

  const handleAutoLayout = useCallback(() => {
    if (!flowRef.current) return;
    const currentNodes = flowRef.current.getCurrentNodes();
    const selectedCount = currentNodes.filter(n => n.selected).length;

    const msg = selectedCount > 0
      ? `Apply auto-layout ONLY to the ${selectedCount} selected nodes?`
      : 'Overwrite the current layout of all nodes using Auto-Layout?';

    if (!window.confirm(msg)) return;

    const laidOutNodes = computeAutoLayout(currentNodes, edges);
    flowRef.current.applyLayout(laidOutNodes);
  }, [edges]);

  const handleCreateGroup = useCallback(() => {
    if (!flowRef.current) return;
    const selected = flowRef.current.getCurrentNodes()
      .filter(n => n.selected && n.type !== 'groupNode');
    if (selected.length < 1) {
      alert('Select at least one node to group.');
      return;
    }
    setGroupSelectedCount(selected.length);
    setIsGroupModalOpen(true);
  }, []);

  const handleGroupUpdate = useCallback((newData: Partial<GroupData>) => {
    if (!flowRef.current || !selectedNode) return;
    const newNodes = flowRef.current.getCurrentNodes().map(n =>
      n.id === selectedNode.id ? { ...n, data: { ...n.data, ...newData } } : n
    );
    flowRef.current.applyLayout(newNodes);
    setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
  }, [selectedNode]);

  const handleGroupDelete = useCallback(() => {
    if (!flowRef.current || !selectedNode) return;
    const allNodes = flowRef.current.getCurrentNodes();
    const newNodes = allNodes
      .filter(n => n.id !== selectedNode.id)
      .map(n => {
        if (n.parentId === selectedNode.id) {
          const absPos = (n as any).positionAbsolute ?? n.position;
          const { parentId, ...rest } = n;
          return { ...rest, position: absPos };
        }
        return n;
      });
    flowRef.current.applyLayout(newNodes);
    setSelectedNode(null);
    setIsSidebarOpen(false);
  }, [selectedNode]);

  const handleRemoveMemberFromGroup = useCallback((memberId: string) => {
    if (!flowRef.current) return;
    const allNodes = flowRef.current.getCurrentNodes();
    const member = allNodes.find(n => n.id === memberId);
    if (!member) return;
    const absPos = (member as any).positionAbsolute ?? member.position;
    const { parentId, ...rest } = member;
    const newNodes = allNodes.map(n => n.id === memberId ? { ...rest, position: absPos } : n);
    flowRef.current.applyLayout(newNodes);
  }, []);

  const handleGroupConfirm = useCallback((title: string, comment: string) => {
    if (!flowRef.current) return;
    const allNodes = flowRef.current.getCurrentNodes();
    const selected = allNodes.filter(n => n.selected && n.type !== 'groupNode');

    const PADDING = 50;
    const xs = selected.map(n => ((n as any).positionAbsolute ?? n.position).x);
    const ys = selected.map(n => ((n as any).positionAbsolute ?? n.position).y);
    const x2s = selected.map(n => ((n as any).positionAbsolute ?? n.position).x + (n.width ?? 220));
    const y2s = selected.map(n => ((n as any).positionAbsolute ?? n.position).y + (n.height ?? 120));

    const gx = Math.min(...xs) - PADDING;
    const gy = Math.min(...ys) - PADDING;
    const gw = Math.max(...x2s) - gx + PADDING;
    const gh = Math.max(...y2s) - gy + PADDING;

    const groupId = `group_${Date.now()}`;

    const groupNode: Node = {
      id: groupId,
      type: 'groupNode',
      position: { x: gx, y: gy },
      style: { width: gw, height: gh },
      zIndex: -1,
      selectable: true,
      data: { id: groupId, label: title, comment } as GroupData,
    };

    const updatedNodes = allNodes.map(n => {
      if (!selected.find(s => s.id === n.id)) return n;
      const abs = (n as any).positionAbsolute ?? n.position;
      return { ...n, parentId: groupId, position: { x: abs.x - gx, y: abs.y - gy } };
    });

    const newNodes = [groupNode, ...updatedNodes];
    flowRef.current.applyLayout(newNodes);
    setNodes(newNodes);
    setIsGroupModalOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!xmlContent || !fileName || !flowRef.current) return;
    const currentNodes = flowRef.current.getCurrentNodes();
    const updatedXml = exportToXml(xmlContent, currentNodes, layoutShapes);
    const blob = new Blob([updatedXml], { type: 'application/xml' });

    // Use File System Access API when available — avoids the browser adding "(1)" duplicates
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'Calculation View XML',
              accept: { 'application/xml': ['.calculationview', '.xml'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setXmlContent(updatedXml);
        return;
      } catch (err: any) {
        // User cancelled the dialog — abort silently
        if (err?.name === 'AbortError') return;
        // Other error: fall through to legacy download
        console.warn('showSaveFilePicker failed, falling back:', err);
      }
    }

    // Legacy fallback: trigger <a download> — browser may append "(1)" if file already exists in Downloads
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update in-memory XML so subsequent saves include latest positions
    setXmlContent(updatedXml);
  }, [xmlContent, fileName, layoutShapes]);

  // Aktualizuje vlastnost searchMatch na uzlech na základě searchQuery
  const nodesWithSearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return nodes.map(node => {
        if (node.data && node.data.searchMatch !== undefined) {
          const { searchMatch, ...restData } = node.data;
          return { ...node, data: restData };
        }
        return node;
      });
    }

    const lowerQuery = searchQuery.toLowerCase();

    return nodes.map(node => {
      let currentMatch: 'node' | 'attribute' | null = null;
      const d = node.data;

      if (!d) return node;

      if ((d.id && d.id.toLowerCase().includes(lowerQuery)) ||
        (d.label && d.label.toLowerCase().includes(lowerQuery))) {
        currentMatch = 'node';
      } else if (d.attributes && d.attributes.length > 0) {
        const hasAttrMatch = d.attributes.some((attr: any) => attr.id && attr.id.toLowerCase().includes(lowerQuery));
        if (hasAttrMatch) {
          currentMatch = 'attribute';
        }
      }

      // Vždy vrátit novou referenci node objektu, aby React Flow zaregistroval změnu, i když je null (pokud předtím nebyla)
      if (d.searchMatch !== currentMatch) {
        return {
          ...node,
          data: {
            ...d,
            searchMatch: currentMatch
          }
        };
      }
      return node;
    });
  }, [nodes, searchQuery]);

  if (!xmlContent) {
    return <FileUpload onFileLoad={handleFileLoad} error={error} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">HANA CV Viewer <span className="text-sm font-normal text-gray-400">v{__APP_VERSION__}</span></h1>
            {fileName && <p className="text-xs text-gray-500">{fileName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Field */}
          <div className="relative flex items-center bg-gray-100 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all border border-gray-200">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search nodes and columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gray-700 w-48 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 p-0.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => mergeFileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
            title="Update from a new file while keeping existing node positions"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Update from file</span>
          </button>
          <input
            ref={mergeFileInputRef}
            type="file"
            accept=".calculationview,.xml"
            className="hidden"
            onChange={handleMergeFileChange}
          />
          <button
            onClick={handleCreateGroup}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
            title="Select nodes and click to group them"
          >
            <BoxSelect className="w-4 h-4" />
            <span className="text-sm font-medium">Group Nodes</span>
          </button>
          <button
            onClick={handleAutoLayout}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-sm font-medium">Auto-Layout</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Save Layout</span>
          </button>

          <div className="h-6 w-px bg-gray-300 ml-2" />
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="View settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Help & documentation"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar
          nodes={nodesWithSearch}
          selectedNodeId={selectedNode?.id}
          onNodeSelect={(nodeId) => {
            const node = nodesWithSearch.find(n => n.id === nodeId);
            if (node) {
              flowRef.current?.focusNode(nodeId);
              handleNodeClick(node);
            }
          }}
        />

        <div className={`flex-1 transition-all relative overflow-hidden ${isSidebarOpen ? 'w-[calc(100%-576px)]' : 'w-[calc(100%-256px)]'}`}>
          <FlowViewer
            ref={flowRef}
            initialNodes={nodesWithSearch}
            initialEdges={edges}
            onNodeClick={handleNodeClick}
            onGroupDeleted={(gId) => {
              if (selectedNode?.id === gId) {
                setSelectedNode(null);
                setIsSidebarOpen(false);
              }
            }}
          />
        </div>

        {/* Sidebar */}
        {isSidebarOpen && selectedNode?.type === 'groupNode' ? (
          <div className="w-80 flex-shrink-0">
            <GroupSidebar
              groupNode={selectedNode}
              memberNodes={
                flowRef.current?.getCurrentNodes().filter(n => n.parentId === selectedNode.id) ?? []
              }
              onClose={() => setIsSidebarOpen(false)}
              onUpdate={handleGroupUpdate}
              onDelete={handleGroupDelete}
              onRemoveMember={handleRemoveMemberFromGroup}
            />
          </div>
        ) : isSidebarOpen && (
          <div className="w-80 flex-shrink-0">
            <Sidebar
              node={selectedNode}
              allNodes={nodesWithSearch}
              onClose={() => setIsSidebarOpen(false)}
              isCommentModalOpen={isCommentModalOpen}
              setIsCommentModalOpen={setIsCommentModalOpen}
              isFilterModalOpen={isFilterModalOpen}
              setIsFilterModalOpen={setIsFilterModalOpen}
              isJoinModalOpen={isJoinModalOpen}
              setIsJoinModalOpen={setIsJoinModalOpen}
              isUnionModalOpen={isUnionModalOpen}
              setIsUnionModalOpen={setIsUnionModalOpen}
              isProjectionModalOpen={isProjectionModalOpen}
              setIsProjectionModalOpen={setIsProjectionModalOpen}
            />
          </div>
        )}
      </div>
      {isGroupModalOpen && (
        <GroupModal
          isOpen={isGroupModalOpen}
          selectedCount={groupSelectedCount}
          onConfirm={handleGroupConfirm}
          onCancel={() => setIsGroupModalOpen(false)}
        />
      )}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

export default App;