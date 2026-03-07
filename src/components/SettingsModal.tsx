import React, { useState, useMemo } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useTheme, ThemeContext } from '../context/ThemeContext';
import { AppTheme } from '../types/theme';
import { ErrorBoundary } from '../ErrorBoundary';
import ReactFlow, { ReactFlowProvider, Background } from 'reactflow';
import 'reactflow/dist/style.css';

import ProjectionNode from './nodes/ProjectionNode';
import JoinNode from './nodes/JoinNode';
import UnionNode from './nodes/UnionNode';
import AggregationNode from './nodes/AggregationNode';
import DataSourceNode from './nodes/DataSourceNode';
import OutputNode from './nodes/OutputNode';
import GroupNode from './nodes/GroupNode';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES: { id: keyof AppTheme, label: string, properties: { key: string, label: string }[] }[] = [
    { id: 'projection', label: 'Projection', properties: [{ key: 'border', label: 'Border' }, { key: 'bg', label: 'Background' }, { key: 'text', label: 'Title / Text' }, { key: 'icon', label: 'Icon' }] },
    { id: 'join', label: 'Join', properties: [{ key: 'border', label: 'Border' }, { key: 'bg', label: 'Background' }, { key: 'text', label: 'Title / Text' }, { key: 'icon', label: 'Icon' }] },
    { id: 'union', label: 'Union', properties: [{ key: 'border', label: 'Border' }, { key: 'bg', label: 'Background' }, { key: 'text', label: 'Title / Text' }, { key: 'icon', label: 'Icon' }] },
    { id: 'aggregation', label: 'Aggregation', properties: [{ key: 'border', label: 'Border' }, { key: 'bg', label: 'Background' }, { key: 'text', label: 'Title / Text' }, { key: 'icon', label: 'Icon' }] },
    { id: 'dataSource', label: 'Data Source', properties: [{ key: 'border', label: 'Border' }, { key: 'bg', label: 'Background' }, { key: 'text', label: 'Title / Text' }, { key: 'icon', label: 'Icon' }] },
    { id: 'output', label: 'Output', properties: [{ key: 'border', label: 'Border' }, { key: 'bg', label: 'Background' }, { key: 'text', label: 'Title / Text' }, { key: 'icon', label: 'Icon' }] },
    { id: 'group', label: 'Group', properties: [{ key: 'border', label: 'Dashed border' }, { key: 'bg', label: 'Background color' }, { key: 'title', label: 'Title color' }, { key: 'comment', label: 'Description color' }] }
];

const nodeTypesArray = {
    projection: ProjectionNode,
    join: JoinNode,
    union: UnionNode,
    aggregation: AggregationNode,
    dataSource: DataSourceNode,
    output: OutputNode,
    groupNode: GroupNode
};

const parseColorToHexAndAlpha = (val: string) => {
    let hex = '#000000';
    let alpha = 1;
    if (!val) return { hex, alpha };
    if (val.startsWith('#')) {
        hex = val.slice(0, 7);
        if (val.length === 9) {
            alpha = parseInt(val.slice(7, 9), 16) / 255;
        }
    } else if (val.startsWith('rgba') || val.startsWith('rgb')) {
        const match = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            alpha = match[4] ? parseFloat(match[4]) : 1;
        }
    }
    return { hex, alpha };
};

const hexAndAlphaToRgbaString = (hex: string, alpha: number) => {
    if (alpha === 1) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
};

const ColorPickerWithAlpha = ({ label, value = '#000000', onChange }: { label: string, value: string, onChange: (v: string) => void }) => {
    const { hex, alpha } = parseColorToHexAndAlpha(value);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div
                    className="w-6 h-6 rounded border border-gray-300 shadow-sm transition-colors"
                    style={{ backgroundColor: value }}
                />
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={hex}
                        onChange={(e) => onChange(hexAndAlphaToRgbaString(e.target.value, alpha))}
                        className="h-8 w-12 cursor-pointer border-0 bg-transparent p-0"
                    />
                    <div className="flex-1 font-mono text-xs text-gray-500 truncate uppercase mt-0.5">{hex}</div>
                </div>
                <div className="flex items-center gap-3 pt-1 border-t border-gray-200/60">
                    <span className="text-xs text-gray-500 w-[70px]">Opacity:</span>
                    <input
                        type="range"
                        min="0" max="1" step="0.05"
                        value={alpha}
                        onChange={(e) => onChange(hexAndAlphaToRgbaString(hex, parseFloat(e.target.value)))}
                        className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{Math.round(alpha * 100)}%</span>
                </div>
            </div>
        </div>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    return (
        <ErrorBoundary>
            <SettingsModalInner {...props} />
        </ErrorBoundary>
    );
};

const SettingsModalInner: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, updateTheme, resetTheme } = useTheme();
    const [localTheme, setLocalTheme] = useState<AppTheme>(theme);
    const [selectedCategory, setSelectedCategory] = useState<keyof AppTheme>('projection');

    const handleColorChange = (category: keyof AppTheme, property: string, value: string) => {
        const updated = {
            ...localTheme,
            [category]: {
                ...(localTheme[category] as any),
                [property]: value
            }
        };
        setLocalTheme(updated);
    };

    const handleSave = () => {
        updateTheme(localTheme);
        onClose();
    };

    const handleReset = () => {
        if (confirm('Do you really want to reset all colors to default values?')) {
            resetTheme();
            setLocalTheme(theme); // Sync back
        }
    };

    const selectedCatParams = CATEGORIES.find(c => c.id === selectedCategory);

    const getPreviewNodeData = () => {
        const baseData = {
            id: 'preview-node',
            label: `Example ${selectedCatParams?.label}`,
            comment: 'This is a sample comment to show a real preview of the visualization element...',
            filter: selectedCategory === 'group' ? undefined : 'MANDT = 100',
            joinType: 'inner',
            attributes: [{ isCalculated: false }, { isCalculated: true }],
            inputs: [{ nodeId: 'SOURCE_1' }, { nodeId: 'SOURCE_2' }],
            dataSourceInfo: { schemaName: 'SYS_BI', columnObjectName: 'M_TIME_DIMENSION' },
            type: 'Semantics'
        };

        if (selectedCategory === 'group') {
            return {
                id: 'preview-group',
                label: 'Sample Group',
                comment: 'Group information...\nMultiple lines of text.',
                // Pro preview nepotřebujeme další vlastnosti
            };
        }

        return baseData;
    };

    const dummyNodes = useMemo(() => {
        const rawTypes: Record<string, string> = {
            projection: 'projection', join: 'join', union: 'union',
            aggregation: 'aggregation', dataSource: 'dataSource', output: 'output', group: 'groupNode'
        };

        return [{
            id: 'preview-node',
            type: rawTypes[selectedCategory],
            position: { x: 0, y: 0 },
            data: getPreviewNodeData(),
            style: selectedCategory === 'group' ? { width: 320, height: 260 } : undefined,
            selected: true // forced selection to see highlighting
        }];
    }, [selectedCategory, localTheme, selectedCatParams]);

    // !isOpen condition MUST be below all hooks (like useMemo)
    if (!isOpen) return null;



    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] max-h-[850px]">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                    <h2 className="text-xl font-bold tracking-wide">Appearance Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Split */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Settings Controls */}
                    <div className="w-[360px] bg-white border-r border-gray-200 flex flex-col pt-6 pb-2 px-6 overflow-y-auto">
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Select Element</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as keyof AppTheme)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-sm font-medium"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 space-y-4 pr-1">
                            {selectedCatParams?.properties.map(p => (
                                <ColorPickerWithAlpha
                                    key={`${selectedCategory}-${p.key}`}
                                    label={p.label}
                                    value={(localTheme[selectedCategory] as any)[p.key]}
                                    onChange={(val) => handleColorChange(selectedCategory, p.key, val)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Live Preview */}
                    <div className="flex-1 bg-slate-50 flex flex-col p-6 relative">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest absolute top-6 left-6 z-10">Live Preview (Selected type)</h3>

                        <div className="flex-1 rounded-2xl border border-slate-300/60 bg-white shadow-inner overflow-hidden shadow-sm mt-8">
                            {/* Inject localTheme manually to the preview context */}
                            <ThemeContext.Provider value={{ theme: localTheme, updateTheme: () => { }, resetTheme: () => { } }}>
                                <ReactFlowProvider>
                                    <ReactFlow
                                        nodes={dummyNodes}
                                        edges={[]}
                                        nodeTypes={nodeTypesArray}
                                        fitView
                                        fitViewOptions={{ padding: 0.8, maxZoom: 1.5 }}
                                        panOnDrag={false}
                                        zoomOnScroll={false}
                                        zoomOnPinch={false}
                                        nodesDraggable={false}
                                        elementsSelectable={false}
                                        proOptions={{ hideAttribution: true }}
                                    >
                                        <Background color="#cbd5e1" gap={16} />
                                    </ReactFlow>
                                </ReactFlowProvider>
                            </ThemeContext.Provider>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white flex items-center justify-between border-t border-gray-200 shrink-0">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold shadow-sm"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset all to default
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-semibold shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-bold shadow-md hover:shadow-lg shadow-indigo-200"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
