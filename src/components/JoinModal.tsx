import { useMemo } from 'react';
import { X, GitMerge } from 'lucide-react';
import { InputConnection } from '../types';

// ─── Layout constants ───────────────────────────────────────────────────────
const ROW_H = 28;  // px – height of each column row
const HDR_H = 48;  // px – height of the table-name header row
const SVG_W = 110; // px – width of the SVG connector zone
const DOT_R = 4.5; // px – radius of colored join-key dots
const RING_R = 3;   // px – radius of passthrough-column ring

// ─── Join-type visual config ────────────────────────────────────────────────
type JTypeCfg = {
    label: string;
    dotColor: string;   // filled circle / bezier line colour
    lineColor: string;   // softer shade for the glow / shadow
    badgeCls: string;
    headerBg: string;
};

const JTYPE_MAP: Record<string, JTypeCfg> = {
    leftOuter: {
        label: 'LEFT OUTER JOIN',
        dotColor: '#2563eb',
        lineColor: '#93c5fd',
        badgeCls: 'bg-blue-100 text-blue-800 border-blue-200',
        headerBg: 'bg-blue-50 border-blue-200',
    },
    rightOuter: {
        label: 'RIGHT OUTER JOIN',
        dotColor: '#9333ea',
        lineColor: '#d8b4fe',
        badgeCls: 'bg-purple-100 text-purple-800 border-purple-200',
        headerBg: 'bg-purple-50 border-purple-200',
    },
    inner: {
        label: 'INNER JOIN',
        dotColor: '#16a34a',
        lineColor: '#86efac',
        badgeCls: 'bg-green-100 text-green-800 border-green-200',
        headerBg: 'bg-green-50 border-green-200',
    },
    fullOuter: {
        label: 'FULL OUTER JOIN',
        dotColor: '#d97706',
        lineColor: '#fcd34d',
        badgeCls: 'bg-amber-100 text-amber-800 border-amber-200',
        headerBg: 'bg-amber-50 border-amber-200',
    },
};
const FALLBACK_CFG: JTypeCfg = {
    label: 'JOIN',
    dotColor: '#64748b',
    lineColor: '#cbd5e1',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200',
    headerBg: 'bg-slate-50 border-slate-200',
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface ColEntry {
    source: string;   // column name in the source node
    target: string;   // column name forwarded to this JoinView's output
    isJoinKey: boolean;  // same target exists in both inputs → join condition
}

interface Connection {
    leftIdx: number;
    rightIdx: number;
    target: string;
}

// ─── Small Venn icon ─────────────────────────────────────────────────────────
function VennIcon({ joinType, color }: { joinType?: string; color: string }) {
    const fill = color + '60';
    if (joinType === 'leftOuter') return (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <circle cx="7.5" cy="8" r="6" fill={color} fillOpacity="0.85" />
            <circle cx="14.5" cy="8" r="6" fill="white" stroke={color} strokeWidth="1.2" />
            <path d="M11.1 2.5 A6 6 0 0 1 11.1 13.5 A6 6 0 0 1 11.1 2.5Z" fill={fill} />
        </svg>
    );
    if (joinType === 'rightOuter') return (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <circle cx="7.5" cy="8" r="6" fill="white" stroke={color} strokeWidth="1.2" />
            <circle cx="14.5" cy="8" r="6" fill={color} fillOpacity="0.85" />
            <path d="M10.9 2.5 A6 6 0 0 0 10.9 13.5 A6 6 0 0 0 10.9 2.5Z" fill={fill} />
        </svg>
    );
    if (joinType === 'inner') return (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <circle cx="7.5" cy="8" r="6" fill="white" stroke={color} strokeWidth="1.2" />
            <circle cx="14.5" cy="8" r="6" fill="white" stroke={color} strokeWidth="1.2" />
            <ellipse cx="11" cy="8" rx="3.5" ry="5.5" fill={color} fillOpacity="0.85" />
        </svg>
    );
    return (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <circle cx="7.5" cy="8" r="6" fill={color} fillOpacity="0.7" />
            <circle cx="14.5" cy="8" r="6" fill={color} fillOpacity="0.7" />
        </svg>
    );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface JoinModalProps {
    inputs: InputConnection[];
    joinType?: string;
    nodeLabel: string;
    onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function JoinModal({ inputs, joinType, nodeLabel, onClose }: JoinModalProps) {
    const data = useMemo(() => {
        if (!inputs || inputs.length < 2) return null;

        const left = inputs[0];
        const right = inputs[1];

        // target-name sets per side
        const leftTargets = new Set((left.mapping ?? []).map(m => m.target));
        const rightTargets = new Set((right.mapping ?? []).map(m => m.target));

        // A target present in BOTH inputs → it is a join-key column
        const joinKeyTargets = new Set([...leftTargets].filter(t => rightTargets.has(t)));

        const leftCols: ColEntry[] = (left.mapping ?? []).map(m => ({
            source: m.source,
            target: m.target,
            isJoinKey: joinKeyTargets.has(m.target),
        }));

        const rightCols: ColEntry[] = (right.mapping ?? []).map(m => ({
            source: m.source,
            target: m.target,
            isJoinKey: joinKeyTargets.has(m.target),
        }));

        // Build (leftIdx, rightIdx) connection pairs
        const connections: Connection[] = [];
        leftCols.forEach((col, leftIdx) => {
            if (col.isJoinKey) {
                const rightIdx = rightCols.findIndex(rc => rc.target === col.target);
                if (rightIdx !== -1) connections.push({ leftIdx, rightIdx, target: col.target });
            }
        });

        return {
            leftTable: left.nodeId,
            rightTable: right.nodeId,
            leftCols,
            rightCols,
            connections,
        };
    }, [inputs]);

    if (!data) return null;

    const cfg = JTYPE_MAP[joinType ?? ''] ?? FALLBACK_CFG;
    const { leftTable, rightTable, leftCols, rightCols, connections } = data;

    // SVG must be tall enough to cover the longer of the two lists
    const totalH = HDR_H + Math.max(leftCols.length, rightCols.length) * ROW_H;
    const midX = SVG_W / 2;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col"
                style={{ border: `1px solid ${cfg.dotColor}30` }}
                onClick={e => e.stopPropagation()}
            >

                {/* ─── Modal header ──────────────────────────────────────────────── */}
                <div className={`flex items-center justify-between px-5 py-3.5 border-b rounded-t-xl ${cfg.headerBg}`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <VennIcon joinType={joinType} color={cfg.dotColor} />
                        <h2 className="text-base font-semibold text-slate-800 whitespace-nowrap">Join Diagram:</h2>
                        <span
                            className="font-mono text-sm px-2 py-0.5 rounded border bg-white/80 text-slate-700 truncate max-w-[220px]"
                            title={nodeLabel}
                        >
                            {nodeLabel}
                        </span>
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded border whitespace-nowrap ${cfg.badgeCls}`}>
                            {cfg.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                        <span className="text-xs text-slate-500">
                            {connections.length} join condition{connections.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/80 rounded-md transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* ─── Legend ────────────────────────────────────────────────────── */}
                <div className="flex items-center gap-6 px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <svg width="10" height="10">
                            <circle cx="5" cy="5" r="4" fill={cfg.dotColor} />
                        </svg>
                        Join condition (mapped to both sides)
                    </div>
                    <div className="flex items-center gap-1.5">
                        <svg width="10" height="10">
                            <circle cx="5" cy="5" r="3.5" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                        </svg>
                        Passthrough (only one side)
                    </div>
                </div>

                {/* ─── Diagram ───────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex" style={{ minHeight: `${totalH}px` }}>

                        {/* LEFT COLUMN */}
                        <div className="flex-1 min-w-0">
                            {/* Table name header */}
                            <div
                                className="sticky top-0 z-10 flex items-center justify-end gap-2 px-4 bg-slate-100 border-b border-r border-slate-200"
                                style={{ height: `${HDR_H}px` }}
                                title={leftTable}
                            >
                                <span className="font-mono text-sm font-bold text-slate-600 truncate">{leftTable}</span>
                                <div className="shrink-0 w-5 h-5 rounded bg-slate-600/10 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-300">
                                    L
                                </div>
                            </div>

                            {/* Rows */}
                            {leftCols.map((col, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-end gap-2 px-4 border-b border-r border-slate-100 transition-colors ${col.isJoinKey
                                            ? 'bg-white hover:bg-blue-50/40'
                                            : 'bg-slate-50/40 hover:bg-slate-100/60'
                                        }`}
                                    style={{ height: `${ROW_H}px` }}
                                    title={`→ ${col.target}`}
                                >
                                    <span
                                        className={`font-mono text-xs truncate ${col.isJoinKey
                                                ? 'text-slate-800 font-semibold'
                                                : 'text-slate-400'
                                            }`}
                                    >
                                        {col.source}
                                    </span>
                                    {/* Dot anchored to the right edge (faces the SVG) */}
                                    <div className="shrink-0 flex items-center justify-center" style={{ width: `${DOT_R * 2 + 2}px` }}>
                                        {col.isJoinKey ? (
                                            <svg width={DOT_R * 2 + 2} height={DOT_R * 2 + 2}>
                                                <circle
                                                    cx={DOT_R + 1} cy={DOT_R + 1} r={DOT_R}
                                                    fill={cfg.dotColor}
                                                />
                                            </svg>
                                        ) : (
                                            <svg width={RING_R * 2 + 2} height={RING_R * 2 + 2}>
                                                <circle
                                                    cx={RING_R + 1} cy={RING_R + 1} r={RING_R}
                                                    fill="white" stroke="#cbd5e1" strokeWidth="1.5"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SVG CONNECTOR ZONE ─────────────────────────────────────────── */}
                        <div className="shrink-0 bg-white" style={{ width: `${SVG_W}px` }}>
                            <svg width={SVG_W} height={totalH}>
                                {/* Subtle vertical axis guide */}
                                <line
                                    x1={midX} y1={HDR_H}
                                    x2={midX} y2={totalH}
                                    stroke="#f1f5f9" strokeWidth="1"
                                />

                                {connections.map((conn, i) => {
                                    const y1 = HDR_H + conn.leftIdx * ROW_H + ROW_H / 2;
                                    const y2 = HDR_H + conn.rightIdx * ROW_H + ROW_H / 2;

                                    // Cubic Bezier: horizontal tangents on both sides, curve in the middle
                                    const path = `M 0 ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${SVG_W} ${y2}`;

                                    return (
                                        <g key={i}>
                                            {/* Glow / shadow layer */}
                                            <path
                                                d={path}
                                                stroke={cfg.lineColor}
                                                strokeWidth="5"
                                                fill="none"
                                                strokeLinecap="round"
                                                opacity="0.45"
                                            />
                                            {/* Main line */}
                                            <path
                                                d={path}
                                                stroke={cfg.dotColor}
                                                strokeWidth="1.8"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex-1 min-w-0">
                            {/* Table name header */}
                            <div
                                className="sticky top-0 z-10 flex items-center gap-2 px-4 bg-slate-100 border-b border-l border-slate-200"
                                style={{ height: `${HDR_H}px` }}
                                title={rightTable}
                            >
                                <div className="shrink-0 w-5 h-5 rounded bg-slate-600/10 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-300">
                                    R
                                </div>
                                <span className="font-mono text-sm font-bold text-slate-600 truncate">{rightTable}</span>
                            </div>

                            {/* Rows */}
                            {rightCols.map((col, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-2 px-4 border-b border-l border-slate-100 transition-colors ${col.isJoinKey
                                            ? 'bg-white hover:bg-blue-50/40'
                                            : 'bg-slate-50/40 hover:bg-slate-100/60'
                                        }`}
                                    style={{ height: `${ROW_H}px` }}
                                    title={`← ${col.target}`}
                                >
                                    {/* Dot anchored to the left edge (faces the SVG) */}
                                    <div className="shrink-0 flex items-center justify-center" style={{ width: `${DOT_R * 2 + 2}px` }}>
                                        {col.isJoinKey ? (
                                            <svg width={DOT_R * 2 + 2} height={DOT_R * 2 + 2}>
                                                <circle
                                                    cx={DOT_R + 1} cy={DOT_R + 1} r={DOT_R}
                                                    fill={cfg.dotColor}
                                                />
                                            </svg>
                                        ) : (
                                            <svg width={RING_R * 2 + 2} height={RING_R * 2 + 2}>
                                                <circle
                                                    cx={RING_R + 1} cy={RING_R + 1} r={RING_R}
                                                    fill="white" stroke="#cbd5e1" strokeWidth="1.5"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <span
                                        className={`font-mono text-xs truncate ${col.isJoinKey
                                                ? 'text-slate-800 font-semibold'
                                                : 'text-slate-400'
                                            }`}
                                    >
                                        {col.source}
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* ─── Footer stats ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50 rounded-b-xl text-xs text-slate-400">
                    <span className="font-mono truncate">{leftTable}</span>
                    <span className="mx-4 shrink-0">
                        <GitMerge className="w-3.5 h-3.5 inline mr-1" style={{ color: cfg.dotColor }} />
                        {connections.length} / {Math.max(leftCols.length, rightCols.length)} columns joined
                    </span>
                    <span className="font-mono truncate text-right">{rightTable}</span>
                </div>

            </div>
        </div>
    );
}
