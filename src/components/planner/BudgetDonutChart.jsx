import React, { useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = [
    'hsl(142, 71%, 45%)',  // emerald
    'hsl(217, 91%, 60%)',  // blue
    'hsl(25, 95%, 53%)',   // orange
    'hsl(280, 67%, 55%)',  // purple
    'hsl(47, 96%, 53%)',   // amber
    'hsl(346, 77%, 50%)',  // rose
    'hsl(173, 58%, 39%)',  // teal
    'hsl(221, 83%, 53%)',  // indigo
    'hsl(0, 72%, 51%)',    // red
    'hsl(160, 60%, 45%)',  // green
];

function BudgetDonutChart({ categories = [], totalIncome = 0, size = 220 }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    const totalActual = categories.reduce((acc, c) => acc + (parseFloat(c?.actual) || 0), 0);
    const remaining = Math.max(0, totalIncome - totalActual);

    // Build segments
    const segments = categories
        .map((cat, i) => {
            if (!cat) return null;
            return {
                name: cat.name || 'Unknown',
                emoji: cat.emoji || '📦',
                value: parseFloat(cat.actual) || 0,
                color: COLORS[i % COLORS.length],
                index: i,
            };
        })
        .filter(s => s && s.value > 0);

    if (segments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={size / 2} cy={size / 2}
                        r={size / 2 - 20}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="24"
                        className="text-muted/20"
                    />
                    <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="fill-muted-foreground text-[11px] font-black uppercase tracking-widest">
                        No Spending
                    </text>
                    <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="fill-muted-foreground/40 text-[9px] font-mono">
                        yet
                    </text>
                </svg>
            </div>
        );
    }

    const total = totalActual || 1;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 20;
    const strokeWidth = 28;

    // Calculate arc paths
    let cumulativeAngle = -90; // Start from top

    const arcs = segments.map((seg, i) => {
        const angle = (seg.value / total) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle = endAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        return {
            ...seg,
            path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            percentage: ((seg.value / total) * 100).toFixed(1),
        };
    });

    const centerInfo = hoveredIdx !== null ? arcs[hoveredIdx] : null;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background ring */}
                    <circle
                        cx={cx} cy={cy} r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-muted/10"
                    />

                    {/* Segments */}
                    {arcs.map((arc, i) => (
                        <motion.path
                            key={arc.name}
                            d={arc.path}
                            fill="none"
                            stroke={arc.color}
                            strokeWidth={hoveredIdx === i ? strokeWidth + 6 : strokeWidth}
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.35 : 1 }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className="cursor-pointer transition-all duration-200"
                            style={{ filter: hoveredIdx === i ? `drop-shadow(0 0 8px ${arc.color}40)` : 'none' }}
                        />
                    ))}
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {centerInfo ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <span className="text-2xl">{centerInfo.emoji}</span>
                            <span className="text-lg font-black font-mono text-foreground">${centerInfo.value.toLocaleString()}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{centerInfo.percentage}%</span>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black font-mono text-foreground">${totalActual.toLocaleString()}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Total Spent</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full max-w-[260px]">
                {arcs.map((arc, i) => (
                    <div
                        key={arc.name}
                        className={`flex items-center gap-2 cursor-pointer transition-opacity py-0.5 ${hoveredIdx !== null && hoveredIdx !== i ? 'opacity-30' : 'opacity-100'}`}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                    >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
                        <span className="text-[10px] font-bold text-muted-foreground truncate">{arc.emoji} {arc.name}</span>
                        <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto">{arc.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BudgetDonutChart;
