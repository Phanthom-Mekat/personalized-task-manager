import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, TrendingDown, Flame, Zap } from 'lucide-react';
import dayjs from 'dayjs';

const COLORS = [
    'hsl(142, 71%, 45%)',
    'hsl(217, 91%, 60%)',
    'hsl(25, 95%, 53%)',
    'hsl(280, 67%, 55%)',
    'hsl(47, 96%, 53%)',
    'hsl(346, 77%, 50%)',
    'hsl(173, 58%, 39%)',
    'hsl(221, 83%, 53%)',
];

function BudgetInsights({ categories = [], totalIncome = 0, dailyEntries = [], year, month }) {
    const totalActual = categories.reduce((acc, c) => acc + (parseFloat(c?.actual) || 0), 0);

    const alerts = useMemo(() => {
        const result = [];
        categories.forEach((cat) => {
            if (!cat) return;
            const planned = parseFloat(cat.planned) || 0;
            const actual = parseFloat(cat.actual) || 0;
            if (planned <= 0) return;

            const pct = (actual / planned) * 100;
            if (pct > 100) {
                result.push({ type: 'danger', emoji: cat.emoji, name: cat.name, message: `Over by $${(actual - planned).toFixed(0)}`, pct });
            } else if (pct >= 80) {
                result.push({ type: 'warning', emoji: cat.emoji, name: cat.name, message: `${pct.toFixed(0)}% used`, pct });
            }
        });
        return result;
    }, [categories]);

    // Daily average burn
    const daysElapsed = useMemo(() => {
        const now = dayjs();
        const startOfMonth = dayjs().year(year).month(month - 1).startOf('month');
        if (now.year() === year && now.month() + 1 === month) {
            return Math.max(1, now.date());
        }
        return startOfMonth.daysInMonth();
    }, [year, month]);

    const dailyAvg = totalActual > 0 ? (totalActual / daysElapsed).toFixed(0) : 0;
    const daysInMonth = dayjs().year(year).month(month - 1).daysInMonth();
    const projectedTotal = dailyAvg * daysInMonth;
    const projectedDiff = totalIncome - projectedTotal;

    const isOnTrack = alerts.length === 0 && totalActual <= totalIncome;

    return (
        <div className="space-y-6">
            {/* Smart Alerts */}
            <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-3">
                    Alerts
                </h3>
                {isOnTrack ? (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    >
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-[11px] font-bold text-emerald-400">All good — you're within budget</span>
                    </motion.div>
                ) : (
                    alerts.map((alert, i) => (
                        <motion.div
                            key={alert.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
                                alert.type === 'danger' 
                                    ? 'bg-red-500/10 border-red-500/20' 
                                    : 'bg-amber-500/10 border-amber-500/20'
                            }`}
                        >
                            <span className="text-sm">{alert.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-black uppercase tracking-tight text-foreground">{alert.name}</span>
                                <span className={`text-[10px] font-mono ml-2 ${alert.type === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                                    {alert.message}
                                </span>
                            </div>
                            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${alert.type === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                        </motion.div>
                    ))
                )}
            </div>

            {/* Burn Rate Bars */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    Spending Progress
                </h3>
                {categories.filter(c => c && (parseFloat(c.planned) || 0) > 0).map((cat, i) => {
                    const planned = parseFloat(cat.planned) || 0;
                    const actual = parseFloat(cat.actual) || 0;
                    const pct = Math.min((actual / planned) * 100, 150);
                    const isOver = actual > planned;
                    const color = COLORS[i % COLORS.length];

                    return (
                        <div key={cat.name} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
                                    <span className="text-xs">{cat.emoji}</span> {cat.name}
                                </span>
                                <span className={`text-[10px] font-mono font-bold ${isOver ? 'text-red-400' : 'text-muted-foreground'}`}>
                                    ${actual.toLocaleString()} / ${planned.toLocaleString()}
                                </span>
                            </div>
                            <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(pct, 100)}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{ backgroundColor: isOver ? 'hsl(0, 72%, 51%)' : color }}
                                />
                                {isOver && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(pct - 100, 50)}%` }}
                                        transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                                        className="absolute inset-y-0 right-0 rounded-full bg-red-500/30"
                                        style={{ left: '100%', marginLeft: `-${Math.min(pct - 100, 50)}%` }}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Velocity Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-muted/10 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Daily Avg</span>
                    </div>
                    <p className="text-xl font-black font-mono text-foreground">${Number(dailyAvg).toLocaleString()}</p>
                    <p className="text-[9px] font-mono text-muted-foreground/40 mt-0.5">per day</p>
                </div>
                <div className={`rounded-xl p-4 border ${projectedDiff >= 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className={`w-3.5 h-3.5 ${projectedDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Month End Estimate</span>
                    </div>
                    <p className={`text-xl font-black font-mono ${projectedDiff >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                        ${Math.abs(projectedTotal).toLocaleString()}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground/40 mt-0.5">
                        {projectedDiff >= 0 ? `$${projectedDiff.toLocaleString()} under` : `$${Math.abs(projectedDiff).toLocaleString()} over`}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default BudgetInsights;
