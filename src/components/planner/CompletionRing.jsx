import { motion } from 'framer-motion';

function CompletionRing({ percent = 0, size = 80, strokeWidth = 6, className = '' }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;

    const getColor = () => {
        if (percent >= 80) return 'text-emerald-500';
        if (percent >= 50) return 'text-blue-500';
        if (percent >= 25) return 'text-amber-500';
        return 'text-muted-foreground';
    };

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/30"
                />
                {/* Progress ring */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    strokeLinecap="round"
                    className={getColor()}
                />
            </svg>
            <span className={`absolute text-sm font-bold ${getColor()}`}>
                {Math.round(percent)}%
            </span>
        </div>
    );
}

export default CompletionRing;
