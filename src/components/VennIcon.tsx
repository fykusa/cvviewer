import React from 'react';

type VennType = 'inner' | 'left' | 'right' | 'full' | 'union' | 'projection';

interface VennIconProps extends React.SVGProps<SVGSVGElement> {
    vennType?: VennType;
}

export const VennIcon: React.FC<VennIconProps> = ({ vennType = 'inner', className, ...props }) => {
    // If it's a projection, just draw a single circle or standard icon shape
    if (vennType === 'projection') {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2" fill="currentColor" fillOpacity="0.2" />
                <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
        );
    }

    // Determine fill opacities based on join/union type
    const leftFill = ['left', 'full', 'union'].includes(vennType) ? 'currentColor' : 'none';
    const rightFill = ['right', 'full', 'union'].includes(vennType) ? 'currentColor' : 'none';
    const intersectionFill = ['inner', 'left', 'right', 'full', 'union'].includes(vennType) ? 'currentColor' : 'none';

    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
            <g>
                {/* Left Circle */}
                <circle cx="8.5" cy="12" r="6.5" fill={leftFill} fillOpacity={leftFill !== 'none' ? "0.4" : "0"} />
                {/* Right Circle */}
                <circle cx="15.5" cy="12" r="6.5" fill={rightFill} fillOpacity={rightFill !== 'none' ? "0.4" : "0"} />

                {/* Intersection path (an approximation for the overlapping area) */}
                {intersectionFill !== 'none' && (
                    <path
                        d="M12 6.5C10.5 8 10.5 16 12 17.5C13.5 16 13.5 8 12 6.5Z"
                        fill="currentColor"
                        stroke="none"
                    />
                )}
            </g>
        </svg>
    );
};
