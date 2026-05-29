import React from 'react';
import { motion } from 'framer-motion';

function MiniBarChart({ data = [], height = 80, barWidth = 20, gap = 4 }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const totalWidth = data.length * (barWidth + gap) - gap;

    return (
        <svg 
            width={totalWidth} 
            height={height + 40} 
            viewBox={`0 -30 ${totalWidth} ${height + 60}`}
            className="overflow-visible"
        >
            {data.map((d, i) => {
                const barHeight = (d.value / max) * height;
                const x = i * (barWidth + gap);
                const y = height - barHeight;

                return (
                    <g key={i} className="group cursor-pointer">
                        {/* Tooltip background */}
                        <motion.rect
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            x={x - 4} y={-26}
                            width={barWidth + 8} height={20}
                            rx={6}
                            className="fill-zinc-800 shadow-xl pointer-events-none"
                        />
                        <motion.text
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            x={x + barWidth / 2} y={-12}
                            textAnchor="middle"
                            className="fill-white text-[11px] font-bold pointer-events-none tabular-nums"
                        >
                            {d.value}
                        </motion.text>

                        {/* Bar background */}
                        <rect
                            x={x} y={0}
                            width={barWidth} height={height}
                            rx={4}
                            className="fill-muted/10 group-hover:fill-muted/20 transition-colors"
                        />
                        
                        {/* Bar value */}
                        <motion.rect
                            initial={{ height: 0, y: height }}
                            animate={{ height: barHeight, y: y }}
                            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            x={x}
                            width={barWidth}
                            rx={4}
                            className={`${d.color || 'fill-primary'} shadow-sm`}
                        />

                        {/* Label */}
                        <text
                            x={x + barWidth / 2}
                            y={height + 16}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[10px] uppercase font-bold tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default MiniBarChart;
