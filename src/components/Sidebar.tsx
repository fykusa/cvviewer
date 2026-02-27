import { X, Database, Copy, Layers, GitMerge, ArrowRightCircle, Settings, Shuffle } from 'lucide-react';
import { Node } from 'reactflow';
import { NodeData } from '../types';

interface SidebarProps {
  node: Node<NodeData['data']> | null;
  onClose: () => void;
}

export default function Sidebar({ node, onClose }: SidebarProps) {
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
              <h3 className="font-semibold text-gray-900">{data.label}</h3>
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

        {/* Join Type */}
        {data.joinType && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-purple-600" />
              Join Configuration
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Type:</span>
              <span className="font-semibold text-purple-700">{data.joinType}</span>
            </div>
          </div>
        )}

        {/* Attributes */}
        {data.attributes && data.attributes.length > 0 && (() => {
          const regular = data.attributes.filter((a: { id: string; datatype?: string; isCalculated?: boolean; formula?: string }) => !a.isCalculated);
          const calculated = data.attributes.filter((a: { id: string; datatype?: string; isCalculated?: boolean; formula?: string }) => a.isCalculated);
          return (
            <div className="space-y-4">
              {regular.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    View Attributes ({regular.length})
                  </h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {regular.map((attr: { id: string; datatype?: string }, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-100">
                              <td className="px-3 py-2 font-mono text-gray-900">{attr.id}</td>
                              <td className="px-3 py-2 text-gray-600">{attr.datatype || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {calculated.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-indigo-700 mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    Calculated Attributes ({calculated.length})
                  </h4>
                  <div className="bg-indigo-50 rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-indigo-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-indigo-700">Name</th>
                            <th className="px-3 py-2 text-left font-medium text-indigo-700">Formula</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-200">
                          {calculated.map((attr: { id: string; formula?: string }, idx: number) => (
                            <tr key={idx} className="hover:bg-indigo-100">
                              <td className="px-3 py-2 font-mono text-indigo-900 whitespace-nowrap">{attr.id}</td>
                              <td className="px-3 py-2 font-mono text-xs text-indigo-700 max-w-[140px] truncate" title={attr.formula}>{attr.formula || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
    </div>
  );
}