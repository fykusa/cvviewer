import { useMemo } from 'react';
import Prism from 'prismjs';

// ─── HANA Column Engine custom grammar ────────────────────────────────────────
// Registered once; Prism is a singleton so this is safe even if the component
// is re-mounted multiple times.
if (!Prism.languages['column-engine']) {
    Prism.languages['column-engine'] = {

        // Single-line comments  -- like this
        'comment': /--[^\r\n]*/,

        // String literals  'hello world'
        'string': {
            pattern: /'(?:[^'\\]|\\.)*'/,
            greedy: true,
        },

        // Numeric literals  42  3.14  1e-5
        'number': /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,

        // ── Built-in scalar functions ──────────────────────────────────────────────
        'function': {
            pattern: /\b(?:ABS|ADD_DAYS|ADD_MONTHS|ADD_SECONDS|ADD_YEARS|ASCII|BETWEEN|CEILING|CHAR|COALESCE|CONCAT|CONVERT|COS|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DAYNAME|DAYOFMONTH|DAYOFWEEK|DAYOFYEAR|DAYS_BETWEEN|EXTRACT|FLOOR|GREATEST|HOUR|ISNULL|LAST_DAY|LEAST|LEFT|LENGTH|LOCATE|LOWER|LPAD|LTRIM|MINUTE|MOD|MONTH|MONTHNAME|MONTHS_BETWEEN|NANO100_BETWEEN|NOW|NULLIF|POWER|QUARTER|REPLACE|RIGHT|ROUND|RPAD|RTRIM|SECOND|SECONDS_BETWEEN|SIGN|SIN|SQRT|STRTOBIN|SUBSTR|SUBSTRING|TAN|TO_BIGINT|TO_BINARY|TO_BLOB|TO_BOOLEAN|TO_CLOB|TO_DATE|TO_DAYSOFYEAR|TO_DECIMAL|TO_DOUBLE|TO_INT|TO_INTEGER|TO_NCLOB|TO_NVARCHAR|TO_REAL|TO_SECONDDATE|TO_SMALLDECIMAL|TO_SMALLINT|TO_TIME|TO_TIMESTAMP|TO_TINYINT|TO_VARCHAR|TRIM|UCASE|UNICODE|UPPER|WEEKDAY|YEAR|YEARS_BETWEEN)(?=\s*\()/i,
            alias: 'builtin',
        },

        // ── Language keywords ──────────────────────────────────────────────────────
        'keyword': {
            pattern: /\b(?:AND|AS|ASC|BETWEEN|BY|CASE|CAST|DESC|DISTINCT|ELSE|END|ESCAPE|EXISTS|FALSE|FROM|GROUP|HAVING|IF|IN|IS|LIKE|LIMIT|NOT|NULL|OR|ORDER|SELECT|THEN|TRUE|WHEN|WHERE|XOR)\b/i,
        },

        // ── Operators ──────────────────────────────────────────────────────────────
        'operator': /!=|<>|<=|>=|<|>|=|\+|-|\*|\/|%|!|\|\|/,

        // ── Punctuation ────────────────────────────────────────────────────────────
        'punctuation': /[(),;]/,

        // ── Identifiers in double-quotes  "MY COLUMN" ─────────────────────────────
        'quoted-identifier': {
            pattern: /"[^"]*"/,
            alias: 'variable',
            greedy: true,
        },

        // ── Unquoted plain identifiers (fallback for column / view names) ──────────
        'identifier': {
            pattern: /\b[A-Za-z_][A-Za-z0-9_$#]*\b/,
            alias: 'attr-name',
        },
    };
}

// ─── Colour palette (dark bg, high contrast) ──────────────────────────────────
// We inline the styles instead of importing a Prism CSS theme so we control the
// exact palette and don't pull in global stylesheets.
const STYLES: Record<string, React.CSSProperties> = {
    keyword: { color: '#f97316', fontWeight: 700 },          // orange-500
    function: { color: '#fb923c', fontWeight: 600 },          // orange-400 – builtin
    string: { color: '#86efac' },                           // green-300
    number: { color: '#67e8f9' },                           // cyan-300
    operator: { color: '#e879f9' },                           // fuchsia-400
    comment: { color: '#6b7280', fontStyle: 'italic' },      // gray-500
    punctuation: { color: '#94a3b8' },                           // slate-400
    variable: { color: '#fde68a' },                           // amber-200 (quoted id)
    'attr-name': { color: '#e2e8f0' },                           // slate-200  (plain id)
};

// ─── Token → React element ────────────────────────────────────────────────────
function renderTokens(tokens: (string | Prism.Token)[]): React.ReactNode[] {
    return tokens.map((token, i) => {
        if (typeof token === 'string') {
            return <span key={i}>{token}</span>;
        }
        const alias = Array.isArray(token.alias) ? token.alias[0] : token.alias;
        const style = STYLES[alias ?? ''] ?? STYLES[token.type] ?? {};
        const children = Array.isArray(token.content)
            ? renderTokens(token.content as (string | Prism.Token)[])
            : typeof token.content === 'string'
                ? token.content
                : String(token.content);
        return (
            <span key={i} style={style}>
                {children}
            </span>
        );
    });
}

// ─── Public component ─────────────────────────────────────────────────────────
interface FilterViewerProps {
    code: string;
}

export default function FilterViewer({ code }: FilterViewerProps) {
    const tokens = useMemo(
        () => Prism.tokenize(code, Prism.languages['column-engine']),
        [code]
    );

    return (
        <pre
            style={{
                margin: 0,
                padding: 0,
                background: 'transparent',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontSize: '0.8125rem',   // ~13 px
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#e2e8f0',        // slate-200 default
            }}
        >
            {renderTokens(tokens)}
        </pre>
    );
}
