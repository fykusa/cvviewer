import { useState, useCallback, useRef } from 'react';
import { Download, ArrowLeft, LayoutGrid } from 'lucide-react';
import { Node, Edge } from 'reactflow';

import FileUpload from './components/FileUpload';
import FlowViewer, { FlowViewerHandle } from './components/FlowViewer';
import Sidebar from './components/Sidebar';
import { parseCalculationView, transformToReactFlow, exportToXml } from './utils/xmlParser';
import { computeAutoLayout } from './utils/autoLayout';
import { LayoutShape } from './types';

function App() {
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [layoutShapes, setLayoutShapes] = useState<LayoutShape[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const flowRef = useRef<FlowViewerHandle>(null);

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
      } catch (err) {
        console.error('Failed to parse XML:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse the Calculation View file');
      }
    },
    []
  );

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
    setIsSidebarOpen(true);
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
  }, []);

  const handleAutoLayout = useCallback(() => {
    if (!flowRef.current) return;
    const currentNodes = flowRef.current.getCurrentNodes();
    const selectedCount = currentNodes.filter(n => n.selected).length;

    const msg = selectedCount > 0
      ? `Aplikovat auto-layout POUZE na ${selectedCount} vybraných uzlů?`
      : 'Přepsat aktuální rozmístění všech uzlů pomocí Auto-Layout?';

    if (!window.confirm(msg)) return;

    const laidOutNodes = computeAutoLayout(currentNodes, edges);
    flowRef.current.applyLayout(laidOutNodes);
  }, [edges]);

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
            <h1 className="text-lg font-semibold text-gray-900">HANA Calculation View Viewer</h1>
            {fileName && <p className="text-xs text-gray-500">{fileName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 transition-all ${isSidebarOpen ? 'w-[calc(100%-320px)]' : 'w-full'}`}>
          <FlowViewer
            ref={flowRef}
            initialNodes={nodes}
            initialEdges={edges}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="w-80 flex-shrink-0">
            <Sidebar
              node={selectedNode}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;