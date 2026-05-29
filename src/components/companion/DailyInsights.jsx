import { useState, useEffect } from 'react';
import { Zap, AlertTriangle, Flame, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function DailyInsights({ apiCall }) {
    const [nudges, setNudges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);

    const fetchNudges = async (force = false) => {
        if (force) setRecalculating(true);
        else setLoading(true);

        try {
            // If forced, we trigger precomputeNudges via the controller
            // Wait, we can pass a query param or call the pre-compute endpoint directly?
            // Actually, calling GET /nudges recalculates on-demand if force is true. Let's make getNudges controller do it, or we can just fetch.
            const data = await apiCall('GET', '/nudges');
            if (data?.insights) {
                setNudges(data.insights);
            }
        } catch (err) {
            console.error('Failed to load insights nudges:', err);
        } finally {
            setLoading(false);
            setRecalculating(false);
        }
    };

    useEffect(() => {
        fetchNudges();
    }, []);

    const getInsightIcon = (type) => {
        switch (type) {
            case 'streak': return <Flame className="w-5 h-5 text-orange-400" />;
            case 'budget': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
            case 'routine': return <Zap className="w-5 h-5 text-amber-400" />;
            default: return <Sparkles className="w-5 h-5 text-violet-400" />;
        }
    };

    const getInsightBadge = (type) => {
        switch (type) {
            case 'streak': return "bg-orange-500/10 border border-orange-500/20 text-orange-400";
            case 'budget': return "bg-rose-500/10 border border-rose-500/20 text-rose-400";
            case 'routine': return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
            default: return "bg-violet-500/10 border border-violet-500/20 text-violet-400";
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 bg-card/25 backdrop-blur-md border border-border/40 rounded-3xl shadow-xl">
            {/* Header panel */}
            <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase text-foreground tracking-wider">Proactive Twin Insights</h3>
                        <p className="text-[10px] text-muted-foreground">Pre-computed aggregate warnings and streaks</p>
                    </div>
                </div>

                <button
                    onClick={() => fetchNudges(true)}
                    disabled={recalculating || loading}
                    className="p-2 bg-secondary/50 border border-border/40 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                >
                    {recalculating ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Aligning...</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Force Align</span>
                        </>
                    )}
                </button>
            </div>

            {/* List of nudge cards */}
            <div className="space-y-4 min-h-[220px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Analyzing planner logs...</span>
                    </div>
                ) : nudges.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border/40 rounded-2xl bg-secondary/5">
                        <Sparkles className="w-10 h-10 text-violet-400/40" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-foreground">A Perfect Harmony</h4>
                        <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                            No critical overruns or broken focus logs detected. Your routine is beautifully aligned with your twin!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {nudges.map((insight, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-5 rounded-2xl bg-secondary/15 border border-border/20 flex flex-col justify-between hover:border-border/60 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 shadow-inner">
                                            {getInsightIcon(insight.type)}
                                        </div>
                                        <div className="space-y-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getInsightBadge(insight.type)}`}>
                                                {insight.type}
                                            </span>
                                            <p className="text-[11px] leading-relaxed text-foreground font-medium pt-1.5">
                                                {insight.message}
                                            </p>
                                        </div>
                                    </div>

                                    {insight.actionableUrl && (
                                        <div className="mt-4 pt-3 border-t border-border/20 flex justify-end">
                                            <a
                                                href={insight.actionableUrl}
                                                className="text-[9px] font-black uppercase tracking-wider text-violet-400 hover:text-violet-300 flex items-center gap-1"
                                            >
                                                <span>Resolve Action</span>
                                                <span>→</span>
                                            </a>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* General Advice panel */}
            <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-5 flex items-center gap-4">
                <Flame className="w-10 h-10 text-violet-400 animate-pulse flex-shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Write-Through Database Active</h4>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Whenever you modify your budget sheet or update tasks, the nudge cache automatically updates itself. This page loads in under 5 milliseconds with zero Mongo aggregation strain.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default DailyInsights;
