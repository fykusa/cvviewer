
export interface NodeTheme {
    border: string;
    bg: string;
    text: string;
    icon: string;
}

export interface GroupTheme {
    border: string;
    bg: string;
    title: string;
    comment: string;
}

export interface AppTheme {
    projection: NodeTheme;
    union: NodeTheme;
    join: NodeTheme;
    aggregation: NodeTheme;
    dataSource: NodeTheme;
    output: NodeTheme;
    group: GroupTheme;
}

export const DEFAULT_THEME: AppTheme = {
    projection: {
        border: '#3b82f6', // blue-500
        bg: '#ffffff',
        text: '#1e293b', // slate-800
        icon: '#2563eb', // blue-600
    },
    union: {
        border: '#10b981', // emerald-500
        bg: '#ecfdf5', // emerald-50
        text: '#064e3b', // emerald-900
        icon: '#059669', // emerald-600
    },
    join: {
        border: '#6366f1', // indigo-500
        bg: '#f5f3ff', // indigo-50
        text: '#1e1b4b', // indigo-950
        icon: '#4f46e5', // indigo-600
    },
    aggregation: {
        border: '#f59e0b', // amber-500
        bg: '#fffbeb', // amber-50
        text: '#451a03', // amber-950
        icon: '#d97706', // amber-600
    },
    dataSource: {
        border: '#64748b', // slate-500
        bg: '#f8fafc', // slate-50
        text: '#0f172a', // slate-900
        icon: '#475569', // slate-600
    },
    output: {
        border: '#ec4899', // pink-500
        bg: '#fdf2f8', // pink-50
        text: '#500724', // pink-950
        icon: '#db2777', // pink-600
    },
    group: {
        border: '#fbbf24',
        bg: 'rgba(255, 251, 235, 0.4)',
        title: '#92400e',
        comment: '#d97706',
    }
};
