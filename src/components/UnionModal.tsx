import { useMemo, useState } from 'react';
import { X, ChevronDown, ChevronRight, Shuffle } from 'lucide-react';
import { InputConnection } from '../types';

// ─── Layout constants ────────────────────────────────────────────────────────
const ROW_H = 26;   // px – column row height
const HDR_H = 36;   // px – input table header height
const OUT_HDR = 48;   // px – output panel sticky header height
const SVG_W = 90;   // px – connector zone width

// ─── Per-input colour palette ────────────────────────────────────────────────
const INPUT_COLORS = [
    { line: '#6366f1', bg: 'bg-indigo-50', hdr: 'bg-indigo-100 border-indigo-200', text: 'text-indigo-700' },
    { line: '#0ea5e9', bg: 'bg-sky-50', hdr: 'bg-sky-100 border-sky-200', text: 'text-sky-700' },
    { line: '#10b981', bg: 'bg-emerald-50', hdr: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700' },
    { line: '#f59e0b', bg: 'bg-amber-50', hdr: 'bg-amber-100 border-amber-200', text: 'text-amber-700' },
    { line: '#ec4899', bg: 'bg-pink-50', hdr: 'bg-pink-100 border-pink-200', text: 'text-pink-700' },
    { line: '#8b5cf6', bg: 'bg-violet-50', hdr: 'bg-violet-100 border-violet-200', text: 'text-violet-700' },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface SrcCol {
    source: string;
    target?: string;   // output column this maps to (if any)
    isMappedToOutput: boolean;
}

interface InputBlock {
    nodeId: string;
    cols: SrcCol[];
    colIdx: number;   // local colour index
}



// ─── Props ───────────────────────────────────────────────────────────────────
interface UnionModalProps {
    inputs: InputConnection[];
    nodeLabel: string;
    viewAttributes?: { id: string }[];
    sourceNodesData?: Record<string, { id: string }[]>;
    onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function UnionModal({
    inputs,
    nodeLabel,
    viewAttributes,
    sourceNodesData,
    onClose,
}: UnionModalProps) {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const toggle = (nodeId: string) =>
        setCollapsed(prev => {
            const next = new Set(prev);
            next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
            return next;
        });

    const { blocks, outputCols } = useMemo(() => {
        const outputCols = (viewAttributes ?? []).map(a => a.id);
        const outIdx = new Map(outputCols.map((id, i) => [id, i]));

        const blocks: InputBlock[] = (inputs ?? []).map((inp, i) => {
            // mapping: source → target
            const mapping = new Map((inp.mapping ?? []).map(m => [m.source, m.target]));

            // full column list from source node if available, else from mapping
            const srcAttrs = sourceNodesData?.[inp.nodeId];
            const allSrcs = srcAttrs ? srcAttrs.map(a => a.id) : [...mapping.keys()];

            const cols: SrcCol[] = allSrcs.map(source => {
                const target = mapping.get(source);
                return {
                    source,
                    target,
                    isMappedToOutput: target !== undefined && outIdx.has(target),
                };
            });

            return { nodeId: inp.nodeId, cols, colIdx: i % INPUT_COLORS.length };
        });

        // Build connections — only when NOT collapsed (computed at render from collapse state)
        // We'll compute connections in component body (needs collapsed state)
        return { blocks, outputCols };
    }, [inputs, viewAttributes, sourceNodesData]);

    // Recompute connections & Y positions based on current collapsed state
    const { svgConns, svgH } = useMemo(() => {
        const conns: Array<{ srcY: number; dstY: number; color: string }> = [];

        let y = 0; // tracks cumulative height of the LEFT panel
        const outYArr = outputCols.map((_, i) => OUT_HDR + i * ROW_H + ROW_H / 2);

        blocks.forEach((blk) => {
            const isCollapsed = collapsed.has(blk.nodeId);
            const color = INPUT_COLORS[blk.colIdx].line;
            y += HDR_H;

            if (!isCollapsed) {
                blk.cols.forEach((col, ri) => {
                    const rowCentreY = y + ri * ROW_H + ROW_H / 2;
                    if (col.isMappedToOutput && col.target) {
                        const dstIdx = outputCols.indexOf(col.target);
                        if (dstIdx !== -1) {
                            conns.push({ srcY: rowCentreY, dstY: outYArr[dstIdx], color });
                        }
                    }
                });
                y += blk.cols.length * ROW_H;
            }
        });

        // SVG must cover the taller of left or right
        const leftH = y;
        const rightH = OUT_HDR + outputCols.length * ROW_H;
        const svgH = Math.max(leftH, rightH);

        return { svgConns: conns, svgH };
    }, [blocks, outputCols, collapsed]);

    const mappedCounts = useMemo(() =>
        blocks.map(blk => blk.cols.filter(c => c.isMappedToOutput).length),
        [blocks]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl flex flex-col"
                style={{ width: '780px', maxHeight: '88vh', border: '1px solid #6366f130' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3 border-b bg-indigo-50 rounded-t-xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <Shuffle className="w-5 h-5 text-indigo-600 shrink-0" />
                        <h2 className="text-base font-semibold text-slate-800 whitespace-nowrap">Union Diagram:</h2>
                        <span
                            className="font-mono text-sm px-2 py-0.5 rounded border bg-white/80 text-slate-700 truncate max-w-[220px]"
                            title={nodeLabel}
                        >
                            {nodeLabel}
                        </span>
                        <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded border bg-indigo-100 text-indigo-800 border-indigo-200 whitespace-nowrap">
                            UNION
                        </span>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="text-xs text-slate-500">{inputs.length} inputs · {outputCols.length} output cols</span>
                        <button onClick={onClose} className="p-1 hover:bg-white/80 rounded-md transition-colors" title="Close">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* ── Diagram ────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex" style={{ minHeight: `${svgH}px` }}>

                        {/* LEFT — input tables stacked */}
                        <div className="flex-1 min-w-0 border-r border-slate-200">
                            {blocks.map((blk) => {
                                const clr = INPUT_COLORS[blk.colIdx];
                                const isCollapsed = collapsed.has(blk.nodeId);
                                return (
                                    <div key={blk.nodeId}>
                                        {/* Table header / toggle */}
                                        <button
                                            className={`w-full flex items-center gap-2 px-3 border-b text-left sticky top-0 z-10 ${clr.hdr}`}
                                            style={{ height: `${HDR_H}px` }}
                                            onClick={() => toggle(blk.nodeId)}
                                            title={blk.nodeId}
                                        >
                                            {isCollapsed
                                                ? <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${clr.text}`} />
                                                : <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${clr.text}`} />
                                            }
                                            <span className={`font-mono text-xs font-bold truncate ${clr.text}`}>
                                                {blk.nodeId}
                                            </span>
                                            <span className="ml-auto font-mono text-[10px] text-slate-400 shrink-0">
                                                {mappedCounts[blocks.indexOf(blk)]}/{blk.cols.length}
                                            </span>
                                        </button>

                                        {/* Rows */}
                                        {!isCollapsed && blk.cols.map((col, ri) => (
                                            <div
                                                key={ri}
                                                className={`flex items-center justify-end px-3 border-b border-slate-100 ${col.isMappedToOutput ? 'bg-white' : 'bg-slate-50/30'}`}
                                                style={{ height: `${ROW_H}px` }}
                                                title={col.target ? `→ ${col.target}` : col.source}
                                            >
                                                <span className={`font-mono text-xs truncate ${col.isMappedToOutput ? 'text-slate-800 font-medium' : 'text-slate-300'}`}>
                                                    {col.source}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* CENTRE — SVG connector zone */}
                        <div className="shrink-0 bg-white relative" style={{ width: `${SVG_W}px` }}>
                            <svg
                                width={SVG_W}
                                height={svgH}
                                style={{ display: 'block' }}
                            >
                                {/* Subtle mid guide */}
                                <line
                                    x1={SVG_W / 2} y1={0}
                                    x2={SVG_W / 2} y2={svgH}
                                    stroke="#f1f5f9" strokeWidth="1"
                                />
                                {svgConns.map((conn, i) => {
                                    const x1 = 0;
                                    const x2 = SVG_W;
                                    const mid = SVG_W / 2;
                                    const path = `M ${x1} ${conn.srcY} C ${mid} ${conn.srcY}, ${mid} ${conn.dstY}, ${x2} ${conn.dstY}`;
                                    return (
                                        <g key={i}>
                                            <path d={path} stroke={conn.color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.18" />
                                            <path d={path} stroke={conn.color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.9" />
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* RIGHT — output columns */}
                        <div className="flex-1 min-w-0">
                            {/* Sticky header */}
                            <div
                                className="sticky top-0 z-10 flex items-center gap-2 px-3 bg-slate-100 border-b border-slate-200"
                                style={{ height: `${OUT_HDR}px` }}
                            >
                                <div className="shrink-0 w-5 h-5 rounded bg-slate-600/10 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-300">
                                    OUT
                                </div>
                                <span className="font-mono text-sm font-bold text-slate-600 truncate">{nodeLabel}</span>
                            </div>

                            {outputCols.map((col, i) => (
                                <div
                                    key={i}
                                    className="flex items-center px-3 border-b border-slate-100 bg-white"
                                    style={{ height: `${ROW_H}px` }}
                                >
                                    <span className="font-mono text-xs text-slate-800 truncate">{col}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Footer ─────────────────────────────────────────────────── */}
                <div className="flex items-center px-5 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl text-xs text-slate-400 gap-4">
                    {blocks.map((blk, i) => {
                        const clr = INPUT_COLORS[blk.colIdx];
                        return (
                            <span key={i} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: clr.line }} />
                                <span className="font-mono truncate max-w-[100px]" title={blk.nodeId}>{blk.nodeId}</span>
                                <span className="font-semibold" style={{ color: clr.line }}>
                                    {mappedCounts[i]}/{blk.cols.length}
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
