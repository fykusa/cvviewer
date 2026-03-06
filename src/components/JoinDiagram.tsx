import { useMemo } from 'react';
import { InputConnection } from '../types';

interface JoinPair {
    leftSource: string;
    rightSource: string;
    target: string;
}

interface JoinDiagramProps {
    inputs: InputConnection[];
    joinType?: string;
}

// Row heights must match exactly between left/right columns and SVG Y calc
const COL_HDR_H = 34; // px — table name header row
const ROW_H = 26;     // px — each pair data row
const SVG_W = 40;     // px — fixed width of the SVG connector zone
const DOT_R = 3;      // px — radius of connector dots

type JTypeCfg = {
    label: string;
    lineColor: string;
    dotColor: string;
    badgeCls: string;
    headerCls: string;
};

const JTYPE_MAP: Record<string, JTypeCfg> = {
    leftOuter: {
        label: 'LEFT OUTER JOIN',
        lineColor: '#93c5fd', // blue-300
        dotColor: '#2563eb',  // blue-600
        badgeCls: 'bg-blue-100 text-blue-800 border-blue-200',
        headerCls: 'bg-blue-50/60 border-blue-100',
    },
    rightOuter: {
        label: 'RIGHT OUTER JOIN',
        lineColor: '#d8b4fe', // purple-300
        dotColor: '#9333ea',  // purple-600
        badgeCls: 'bg-purple-100 text-purple-800 border-purple-200',
        headerCls: 'bg-purple-50/60 border-purple-100',
    },
    inner: {
        label: 'INNER JOIN',
        lineColor: '#86efac', // green-300
        dotColor: '#16a34a',  // green-600
        badgeCls: 'bg-green-100 text-green-800 border-green-200',
        headerCls: 'bg-green-50/60 border-green-100',
    },
    fullOuter: {
        label: 'FULL OUTER JOIN',
        lineColor: '#fcd34d', // amber-300
        dotColor: '#d97706',  // amber-600
        badgeCls: 'bg-amber-100 text-amber-800 border-amber-200',
        headerCls: 'bg-amber-50/60 border-amber-100',
    },
};

const FALLBACK_CFG: JTypeCfg = {
    label: 'JOIN',
    lineColor: '#cbd5e1',
    dotColor: '#64748b',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200',
    headerCls: 'bg-slate-50 border-slate-100',
};

// Small Venn-diagram icon that visualises the join type
function JoinIcon({ joinType, dotColor }: { joinType?: string; dotColor: string }) {
    const fill = dotColor + '55';
    if (joinType === 'leftOuter') {
        return (
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <circle cx="7" cy="7" r="5" fill={dotColor} fillOpacity="0.8" />
                <circle cx="13" cy="7" r="5" fill="white" stroke={dotColor} strokeWidth="1" />
                <path d="M10.7 2.3 A5 5 0 0 1 10.7 11.7 A5 5 0 0 1 10.7 2.3Z" fill={fill} />
            </svg>
        );
    }
    if (joinType === 'rightOuter') {
        return (
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <circle cx="7" cy="7" r="5" fill="white" stroke={dotColor} strokeWidth="1" />
                <circle cx="13" cy="7" r="5" fill={dotColor} fillOpacity="0.8" />
                <path d="M9.3 2.3 A5 5 0 0 0 9.3 11.7 A5 5 0 0 0 9.3 2.3Z" fill={fill} />
            </svg>
        );
    }
    if (joinType === 'inner') {
        return (
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <circle cx="7" cy="7" r="5" fill="white" stroke={dotColor} strokeWidth="1" />
                <circle cx="13" cy="7" r="5" fill="white" stroke={dotColor} strokeWidth="1" />
                <path d="M10 2.8 A5 5 0 0 1 13 7 A5 5 0 0 1 10 11.2 A5 5 0 0 1 7 7 A5 5 0 0 1 10 2.8Z" fill={dotColor} fillOpacity="0.7" />
            </svg>
        );
    }
    // fullOuter or unknown
    return (
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <circle cx="7" cy="7" r="5" fill={dotColor} fillOpacity="0.6" />
            <circle cx="13" cy="7" r="5" fill={dotColor} fillOpacity="0.6" />
        </svg>
    );
}

export default function JoinDiagram({ inputs, joinType }: JoinDiagramProps) {
    const data = useMemo(() => {
        if (!inputs || inputs.length < 2) return null;

        const left = inputs[0];
        const right = inputs[1];

        // Build target → source maps for each side
        const leftMap = new Map<string, string>();
        (left.mapping ?? []).forEach((m) => {
            if (m.target) leftMap.set(m.target, m.source);
        });

        const rightMap = new Map<string, string>();
        (right.mapping ?? []).forEach((m) => {
            if (m.target) rightMap.set(m.target, m.source);
        });

        // Pairs: targets present in BOTH inputs → those define the join relationship
        const pairs: JoinPair[] = [];
        leftMap.forEach((leftSource, target) => {
            const rightSource = rightMap.get(target);
            if (rightSource !== undefined) {
                pairs.push({ leftSource, rightSource, target });
            }
        });

        return {
            leftTable: left.nodeId,
            rightTable: right.nodeId,
            pairs,
        };
    }, [inputs]);

    if (!data) return null;

    const cfg = JTYPE_MAP[joinType ?? ''] ?? FALLBACK_CFG;
    const { leftTable, rightTable, pairs } = data;
    const totalH = COL_HDR_H + pairs.length * ROW_H;

    return (
        <div className="rounded-lg border border-slate-200 overflow-hidden text-xs shadow-sm">

            {/* ── Title bar ── */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${cfg.headerCls}`}>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <JoinIcon joinType={joinType} dotColor={cfg.dotColor} />
                    Join Diagram
                </span>
                <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${cfg.badgeCls}`}>
                    {cfg.label}
                </span>
            </div>

            {/* ── Empty state ── */}
            {pairs.length === 0 && (
                <div className="px-3 py-5 text-center text-slate-400 bg-white text-xs">
                    No matched join columns found
                </div>
            )}

            {/* ── Diagram ── */}
            {pairs.length > 0 && (
                <>
                    <div className="flex bg-white overflow-hidden" style={{ height: `${totalH}px` }}>

                        {/* Left column */}
                        <div className="flex-1 min-w-0 flex flex-col border-r border-slate-100">
                            {/* Table name */}
                            <div
                                className="flex items-center justify-end px-2 bg-slate-50 border-b border-slate-100 shrink-0"
                                style={{ height: `${COL_HDR_H}px` }}
                                title={leftTable}
                            >
                                <span className="font-mono text-[10px] font-semibold text-slate-500 truncate">
                                    {leftTable}
                                </span>
                            </div>

                            {/* Pair rows */}
                            {pairs.map((pair, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-end px-2 shrink-0 border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}`}
                                    style={{ height: `${ROW_H}px` }}
                                >
                                    <span
                                        className="font-mono text-[11px] text-slate-700 truncate leading-none"
                                        title={pair.leftSource}
                                    >
                                        {pair.leftSource}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* ── SVG connector zone (fixed width) ── */}
                        <svg
                            width={SVG_W}
                            height={totalH}
                            style={{ flexShrink: 0 }}
                            overflow="visible"
                        >
                            {pairs.map((_, i) => {
                                // Y centre of this row (same formula as the div rows above)
                                const y = COL_HDR_H + i * ROW_H + ROW_H / 2;
                                return (
                                    <g key={i}>
                                        {/* Connector line */}
                                        <line
                                            x1={DOT_R + 1}
                                            y1={y}
                                            x2={SVG_W - DOT_R - 1}
                                            y2={y}
                                            stroke={cfg.lineColor}
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                        {/* Left dot */}
                                        <circle
                                            cx={DOT_R + 1}
                                            cy={y}
                                            r={DOT_R}
                                            fill={cfg.dotColor}
                                        />
                                        {/* Right dot */}
                                        <circle
                                            cx={SVG_W - DOT_R - 1}
                                            cy={y}
                                            r={DOT_R}
                                            fill={cfg.dotColor}
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Right column */}
                        <div className="flex-1 min-w-0 flex flex-col border-l border-slate-100">
                            {/* Table name */}
                            <div
                                className="flex items-center px-2 bg-slate-50 border-b border-slate-100 shrink-0"
                                style={{ height: `${COL_HDR_H}px` }}
                                title={rightTable}
                            >
                                <span className="font-mono text-[10px] font-semibold text-slate-500 truncate">
                                    {rightTable}
                                </span>
                            </div>

                            {/* Pair rows */}
                            {pairs.map((pair, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center px-2 shrink-0 border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}`}
                                    style={{ height: `${ROW_H}px` }}
                                >
                                    <span
                                        className="font-mono text-[11px] text-slate-700 truncate leading-none"
                                        title={pair.rightSource}
                                    >
                                        {pair.rightSource}
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                        <span className="font-mono text-[10px] text-slate-500 truncate">{leftTable}</span>
                        <span>{pairs.length} join condition{pairs.length !== 1 ? 's' : ''}</span>
                        <span className="font-mono text-[10px] text-slate-500 truncate text-right">{rightTable}</span>
                    </div>
                </>
            )}
        </div>
    );
}
