import { useState, useMemo } from 'react';
import { X, Database, Copy, Layers, ArrowRightCircle, Settings, MessageSquare, Tag, Calculator, Filter } from 'lucide-react';
import { Node } from 'reactflow';
import { NodeData } from '../types';
import FilterViewer from './FilterViewer';
import JoinModal from './JoinModal';
import UnionModal from './UnionModal';
import { VennIcon } from './VennIcon';

interface SidebarProps {
  node: Node<NodeData['data']> | null;
  allNodes?: Node[];
  onClose: () => void;
  isCommentModalOpen: boolean;
  setIsCommentModalOpen: (open: boolean) => void;
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: (open: boolean) => void;
  isJoinModalOpen: boolean;
  setIsJoinModalOpen: (open: boolean) => void;
  isUnionModalOpen: boolean;
  setIsUnionModalOpen: (open: boolean) => void;
  isProjectionModalOpen: boolean;
  setIsProjectionModalOpen: (open: boolean) => void;
  onColumnClick?: (nodeId: string, columnId: string) => void;
  activeColumnFlow?: { nodeId: string; columnId: string } | null;
  searchQuery?: string;
}

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function Sidebar({
  node, allNodes, onClose,
  isCommentModalOpen, setIsCommentModalOpen,
  isFilterModalOpen, setIsFilterModalOpen,
  isJoinModalOpen, setIsJoinModalOpen,
  isUnionModalOpen, setIsUnionModalOpen,
  isProjectionModalOpen, setIsProjectionModalOpen,
  onColumnClick, activeColumnFlow, searchQuery
}: SidebarProps) {
  const [selectedFormula, setSelectedFormula] = useState<{ name: string, formula: string } | null>(null);

  if (!node) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 p-6 flex items-center justify-center">
        <p className="text-gray-400 text-sm text-center">Select a node to view details</p>
      </div>
    );
  }

  const data = node.data;

  // Build the combined list of attributes for the sidebar
  const combinedAttributes = useMemo(() => {
    if (!data) return { list: [], hasInputs: false };

    // Output target set
    const outputTargetSet = new Set((data.attributes || []).map((a: any) => a.id));
    const outMap = new Map();
    const isJoin = data.type === 'JoinView';

    // 1. If we have input sources, get their columns and mappings
    if (data.inputs && data.inputs.length > 0) {
      data.inputs.forEach((inp: any) => {
        const srcNode = allNodes?.find(n => n.id === inp.nodeId);
        const srcCols = srcNode?.data?.attributes?.map((a: any) => a.id) || [];
        const mapping = inp.mapping || [];
        const sourcePrefix = inp.nodeId ? `${inp.nodeId}.` : '';

        // Add from all source columns
        srcCols.forEach((src: string) => {
          const m = mapping.find((x: any) => x.source === src);
          const target = m ? m.target : undefined;
          const outKey = target || src;
          const sourceName = `${sourcePrefix}${src}`;

          if (!outMap.has(outKey)) {
            outMap.set(outKey, {
              id: outKey,
              target: target,
              sources: new Set([sourceName]),
              isMapped: target ? outputTargetSet.has(target) : false,
              isCalculated: false,
            });
          } else {
            if (!isJoin) {
              outMap.get(outKey).sources.add(sourceName);
            }
          }
        });

        // Add from any mappings not caught by source columns
        mapping.forEach((m: any) => {
          if (!srcCols.includes(m.source)) {
            const outKey = m.target || m.source;
            const sourceName = `${sourcePrefix}${m.source}`;
            if (!outMap.has(outKey)) {
              outMap.set(outKey, {
                id: outKey,
                target: m.target,
                sources: new Set([sourceName]),
                isMapped: m.target ? outputTargetSet.has(m.target) : false,
                isCalculated: false,
              });
            } else {
              if (!isJoin) {
                outMap.get(outKey).sources.add(sourceName);
              }
            }
          }
        });
      });
    }

    // 2. Add natively defined attributes (e.g. calculated fields or fields for base tables)
    (data.attributes || []).forEach((attr: any) => {
      if (attr.isCalculated) {
        outMap.set(attr.id, {
          id: attr.id,
          target: attr.id,
          sources: new Set([]),
          isMapped: true,
          isCalculated: true,
          formula: attr.formula,
          datatype: attr.datatype
        });
      } else {
        if (!outMap.has(attr.id)) {
          outMap.set(attr.id, {
            id: attr.id,
            target: attr.id,
            sources: new Set([attr.id]),
            isMapped: true, // It is in local attributes, so it is mapped
            isCalculated: false,
            datatype: attr.datatype
          });
        } else {
          outMap.get(attr.id).datatype = attr.datatype;
        }
      }
    });

    return { list: Array.from(outMap.values()), hasInputs: !!(data.inputs && data.inputs.length > 0) };
  }, [data, allNodes]);

  const getIcon = () => {
    switch (data.type) {
      case 'DATA_BASE_TABLE': return <Database className="w-5 h-5 text-gray-600" />;
      case 'ProjectionView': return <Copy className="w-5 h-5 text-blue-600" />;
      case 'JoinView': return <VennIcon vennType={data.joinType === 'leftOuter' ? 'left' : data.joinType === 'rightOuter' ? 'right' : data.joinType === 'fullOuter' ? 'full' : 'inner'} className="w-5 h-5 text-purple-600" />;
      case 'AggregationView': return <Layers className="w-5 h-5 text-green-600" />;
      case 'UnionView': return <VennIcon vennType="union" className="w-5 h-5 text-indigo-600" />;
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
            {data.type === 'JoinView' && data.inputs && data.inputs.length >= 2 ? (
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors cursor-pointer"
                title="View Join Diagram"
              >
                {getIcon()}
              </button>
            ) : data.type === 'UnionView' && data.inputs && data.inputs.length >= 1 ? (
              <button
                onClick={() => setIsUnionModalOpen(true)}
                className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors cursor-pointer"
                title="View Union Diagram"
              >
                {getIcon()}
              </button>
            ) : data.type === 'ProjectionView' && data.inputs && data.inputs.length >= 1 ? (
              <button
                onClick={() => setIsProjectionModalOpen(true)}
                className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
                title="View Projection Diagram"
              >
                {getIcon()}
              </button>
            ) : (
              <div className="p-2 bg-gray-100 rounded-lg">{getIcon()}</div>
            )}
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

              </div>
              <p className="text-sm text-gray-500">{getTypeLabel()}</p>
            </div>
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
              <VennIcon vennType={data.joinType === 'leftOuter' ? 'left' : data.joinType === 'rightOuter' ? 'right' : data.joinType === 'fullOuter' ? 'full' : 'inner'} className="w-3.5 h-3.5" />
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
        {combinedAttributes.list.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Attributes ({combinedAttributes.list.length})
            </h4>
            <div className="max-h-[55vh] overflow-y-auto custom-scrollbar pr-1">
              <div className="space-y-1">
                {combinedAttributes.list.map((attr, idx) => {
                  const isGray = !attr.isMapped && !attr.isCalculated;
                  const isActiveFlow = !!(activeColumnFlow && activeColumnFlow.nodeId === node!.id && activeColumnFlow.columnId === attr.id);

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-colors ${isActiveFlow
                        ? 'bg-purple-50 border-purple-400 ring-1 ring-purple-400 cursor-pointer'
                        : attr.isCalculated
                          ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 cursor-pointer'
                          : isGray
                            ? 'bg-slate-50/30 border-slate-100 text-slate-400'
                            : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-purple-200 cursor-pointer text-slate-800'
                        }`}
                      onClick={() => {
                        if (!isGray) onColumnClick?.(node!.id, attr.id);
                      }}
                      title={isActiveFlow ? 'Click to hide flow' : attr.isCalculated ? 'Click to trace column flow' : isGray ? 'Dropped (Not mapped to output)' : 'Click to trace column flow'}
                    >
                      {attr.isCalculated ? (
                        <Calculator className={`w-3.5 h-3.5 shrink-0 text-indigo-500`} />
                      ) : (
                        <Tag className={`w-3.5 h-3.5 shrink-0 ${isGray ? 'text-slate-300' : 'text-blue-400'}`} />
                      )}

                      <span className={`font-mono text-xs truncate ${attr.isCalculated ? 'text-indigo-900 font-medium' : isGray ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
                        <HighlightText text={attr.id} query={searchQuery} />
                      </span>

                      {/* Right aligned source columns for mapped columns, only if node has inputs */}
                      {!isGray && !attr.isCalculated && attr.sources.size > 0 && combinedAttributes.hasInputs && (
                        <span className="ml-auto font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={Array.from(attr.sources).join(', ')}>
                          ← {Array.from(attr.sources).join(', ')}
                        </span>
                      )}

                      {/* Datatype indicator (only if not gray, but maybe useful for all?) */}
                      {attr.datatype === 'measure' && !isGray && (
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 shadow-sm bg-orange-100 text-orange-700 border border-orange-200">
                          Measure
                        </span>
                      )}

                      {attr.isCalculated && (
                        <span
                          className="ml-auto px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-200 cursor-pointer"
                          title="Click to see formula"
                          onClick={(e) => { e.stopPropagation(); if (attr.formula) setSelectedFormula({ name: attr.id, formula: attr.formula }); }}
                        >
                          Calculated
                        </span>
                      )}
                    </div>
                  );
                })}
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
      {isJoinModalOpen && data.inputs && data.inputs.length >= 2 && (() => {
        // Build map of sourceNodeId → attributes for the two input nodes
        const sourceNodesData: Record<string, { id: string }[]> = {};
        if (allNodes) {
          data.inputs.forEach((inp: { nodeId: string }) => {
            const srcNode = allNodes.find(n => n.id === inp.nodeId);
            if (srcNode?.data?.attributes) {
              sourceNodesData[inp.nodeId] = srcNode.data.attributes;
            }
          });
        }
        return (
          <JoinModal
            inputs={data.inputs}
            joinType={data.joinType}
            nodeLabel={data.label}
            viewAttributes={data.attributes}
            sourceNodesData={sourceNodesData}
            onClose={() => setIsJoinModalOpen(false)}
          />
        );
      })()}

      {/* Union Modal */}
      {isUnionModalOpen && data.inputs && (() => {
        // Build map of sourceNodeId → attributes for the input nodes
        const sourceNodesData: Record<string, { id: string }[]> = {};
        if (allNodes) {
          data.inputs.forEach((inp: { nodeId: string }) => {
            const srcNode = allNodes.find(n => n.id === inp.nodeId);
            if (srcNode?.data?.attributes) {
              sourceNodesData[inp.nodeId] = srcNode.data.attributes;
            }
          });
        }
        return (
          <UnionModal
            inputs={data.inputs}
            nodeLabel={data.label}
            viewAttributes={data.attributes}
            sourceNodesData={sourceNodesData}
            onClose={() => setIsUnionModalOpen(false)}
          />
        );
      })()}

      {/* Projection Modal */}
      {isProjectionModalOpen && data.inputs && (() => {
        // Build map of sourceNodeId → attributes for the input nodes
        const sourceNodesData: Record<string, { id: string }[]> = {};
        if (allNodes) {
          data.inputs.forEach((inp: { nodeId: string }) => {
            const srcNode = allNodes.find(n => n.id === inp.nodeId);
            if (srcNode?.data?.attributes) {
              sourceNodesData[inp.nodeId] = srcNode.data.attributes;
            }
          });
        }
        return (
          <UnionModal
            inputs={data.inputs}
            nodeLabel={data.label}
            nodeType="ProjectionView"
            viewAttributes={data.attributes}
            sourceNodesData={sourceNodesData}
            onClose={() => setIsProjectionModalOpen(false)}
          />
        );
      })()}
    </div>
  );
}