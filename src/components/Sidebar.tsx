import { useState } from 'react';
import { X, Database, Copy, Layers, GitMerge, ArrowRightCircle, Settings, Shuffle, MessageSquare, Tag, Calculator, Filter } from 'lucide-react';
import { Node } from 'reactflow';
import { NodeData } from '../types';
import FilterViewer from './FilterViewer';
import JoinModal from './JoinModal';

interface SidebarProps {
  node: Node<NodeData['data']> | null;
  onClose: () => void;
  isCommentModalOpen: boolean;
  setIsCommentModalOpen: (open: boolean) => void;
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: (open: boolean) => void;
}

export default function Sidebar({ node, onClose, isCommentModalOpen, setIsCommentModalOpen, isFilterModalOpen, setIsFilterModalOpen }: SidebarProps) {
  const [selectedFormula, setSelectedFormula] = useState<{ name: string, formula: string } | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  if (!node) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 p-6 flex items-center justify-center">
        <p className="text-gray-400 text-sm text-center">Select a node to view details</p>
      </div>
    );
  }

  const data = node.data;

  const getIcon = () => {
    switch (data.type) {
      case 'DATA_BASE_TABLE': return <Database className="w-5 h-5 text-gray-600" />;
      case 'ProjectionView': return <Copy className="w-5 h-5 text-blue-600" />;
      case 'JoinView': return <GitMerge className="w-5 h-5 text-purple-600" />;
      case 'AggregationView': return <Layers className="w-5 h-5 text-green-600" />;
      case 'UnionView': return <Shuffle className="w-5 h-5 text-indigo-600" />;
      default: return <ArrowRightCircle className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (data.type) {
      case 'DATA_BASE_TABLE': return 'Database Table';
      case 'ProjectionView': return 'Projection View';
      case 'JoinView': return 'Join View';
      case 'AggregationView': return 'Aggregation View';
      case 'UnionView': return 'Union View';
      default: return data.type;
    }
  };

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Node Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">{getIcon()}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{data.label}</h3>
                {data.comment && (
                  <button
                    onClick={() => { setIsCommentModalOpen(true); setIsFilterModalOpen(false); }}
                    className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
                    title="View Comments"
                  >
                    <MessageSquare className="w-4 h-4 text-yellow-600" />
                  </button>
                )}
                {data.filter && (
                  <button
                    onClick={() => { setIsFilterModalOpen(true); setIsCommentModalOpen(false); }}
                    className="p-1 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors"
                    title="View Filter"
                  >
                    <Filter className="w-4 h-4 text-orange-600" />
                  </button>
                )}
                {data.type === 'JoinView' && data.inputs && data.inputs.length >= 2 && (
                  <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="p-1 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
                    title="View Join Diagram"
                  >
                    <GitMerge className="w-4 h-4 text-purple-600" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500">{getTypeLabel()}</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-md">
            ID: {data.id}
          </div>
        </div>



        {/* DataSource Info */}
        {data.isDataSource && data.dataSourceInfo && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Source
            </h4>
            <div className="space-y-1 text-sm">
              {data.dataSourceInfo.schemaName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Schema:</span>
                  <span className="font-mono text-gray-900">{data.dataSourceInfo.schemaName}</span>
                </div>
              )}
              {data.dataSourceInfo.columnObjectName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Table:</span>
                  <span className="font-mono text-gray-900">{data.dataSourceInfo.columnObjectName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join type quick-info badge — click the icon above to see full diagram */}
        {data.joinType && (
          <div className="bg-purple-50 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-purple-600 font-medium flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5" />
              {data.joinType}
            </span>
            {data.inputs && data.inputs.length >= 2 && (
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="text-[10px] text-purple-500 hover:text-purple-700 hover:underline transition-colors"
              >
                View diagram →
              </button>
            )}
          </div>
        )}

        {/* Attributes */}
        {data.attributes && data.attributes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Attributes ({data.attributes.length})
            </h4>
            <div className="max-h-[55vh] overflow-y-auto custom-scrollbar pr-1">
              <div className="space-y-1">
                {data.attributes.map((attr: { id: string; datatype?: string; isCalculated?: boolean; formula?: string }, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-colors ${attr.isCalculated
                      ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 cursor-pointer'
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                      }`}
                    onClick={() => attr.isCalculated && attr.formula ? setSelectedFormula({ name: attr.id, formula: attr.formula }) : undefined}
                  >
                    {attr.isCalculated ? (
                      <Calculator className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    ) : (
                      <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}

                    <span className={`font-mono text-xs truncate flex-1 ${attr.isCalculated ? 'text-indigo-900' : 'text-gray-700'}`} title={attr.id}>
                      {attr.id}
                    </span>

                    {!attr.isCalculated && (attr.datatype === 'attribute' || attr.datatype === 'measure') && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 shadow-sm ${attr.datatype === 'measure' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                        {attr.datatype === 'measure' ? 'Measure' : 'Attribute'}
                      </span>
                    )}

                    {attr.isCalculated && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                        Calculated
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inputs */}
        {data.inputs && data.inputs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Input Nodes ({data.inputs.length})</h4>
            <div className="space-y-2">
              {data.inputs.map((input: { nodeId: string; mapping?: unknown[] }, idx: number) => (
                <div key={idx} className="bg-blue-50 rounded-lg px-3 py-2">
                  <div className="font-mono text-sm text-blue-900">← {input.nodeId}</div>
                  {input.mapping && input.mapping.length > 0 && (
                    <div className="text-xs text-blue-700 mt-1">
                      {input.mapping.length} mappings
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Position Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-400">
          Position: X: {node.position.x}, Y: {node.position.y}
        </div>
      </div>

      {/* Comment Modal */}
      {
        isCommentModalOpen && data.comment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsCommentModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-yellow-500 fill-yellow-100" />
                  Comments: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{data.label}</span>
                </h2>
                <button
                  onClick={() => setIsCommentModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title="Close"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
                  {data.comment}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Filter Modal */}
      {
        isFilterModalOpen && data.filter && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsFilterModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-orange-100 bg-orange-50/40">
                <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-orange-500 fill-orange-100" />
                  Filter: <span className="font-mono text-sm bg-white border border-orange-100 px-2 py-1 rounded shadow-sm text-orange-700">{data.label}</span>
                </h2>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-1 hover:bg-orange-100 rounded-md transition-colors"
                  title="Close"
                >
                  <X className="w-6 h-6 text-orange-400" />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900 rounded-b-xl">
                <FilterViewer code={data.filter} />
              </div>
            </div>
          </div>
        )
      }

      {/* Formula Modal */}
      {selectedFormula && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedFormula(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-indigo-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-indigo-100 bg-indigo-50/30">
              <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-500" />
                Expression: <span className="font-mono text-sm bg-white border border-indigo-100 px-2 py-1 rounded shadow-sm text-indigo-700">{selectedFormula.name}</span>
              </h2>
              <button
                onClick={() => setSelectedFormula(null)}
                className="p-1 hover:bg-indigo-100 rounded-md transition-colors"
                title="Close"
              >
                <X className="w-6 h-6 text-indigo-400" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900 rounded-b-xl">
              <FilterViewer code={selectedFormula.formula} />
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {isJoinModalOpen && data.inputs && data.inputs.length >= 2 && (
        <JoinModal
          inputs={data.inputs}
          joinType={data.joinType}
          nodeLabel={data.label}
          onClose={() => setIsJoinModalOpen(false)}
        />
      )}
    </div>
  );
}