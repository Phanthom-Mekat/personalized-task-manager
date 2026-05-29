import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Heart, Award, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function TrajectorySimulator({ apiCall }) {
    // Slider States
    const [savingsRate, setSavingsRate] = useState(500);
    const [sleepHours, setSleepHours] = useState(8);
    const [studyHours, setStudyHours] = useState(2);

    // Simulated mathematical curves state
    const [curves, setCurves] = useState({ netWorth: [], wellness: [], skillMastery: [] });
    const [activeYear, setActiveYear] = useState(10); // Default to Year 10

    // Narrative crystallized briefing states
    const [briefing, setBriefing] = useState('');
    const [loadingBrief, setLoadingBrief] = useState(false);

    // Compute mathematical curves deterministically in under 1ms
    const recalculateMath = () => {
        const rate = 0.08; // 8% annual returns
        const compoundingPeriods = 12; // Monthly
        const initialNW = 5000; // Starting starter net worth

        const netWorth = [];
        const wellness = [];
        const skillMastery = [];

        const wellnessBase = Math.round(100 * Math.exp(-0.04 * Math.pow(8 - sleepHours, 2)));
        const studyMinutes = studyHours * 60;

        for (let y = 1; y <= 10; y++) {
            // Compound interest formula: A = P(1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)]
            const nt = compoundingPeriods * y;
            const compoundFactor = Math.pow(1 + rate / compoundingPeriods, nt);
            const annuityFactor = (compoundFactor - 1) / (rate / compoundingPeriods);
            const nwVal = Math.round(initialNW * compoundFactor + savingsRate * annuityFactor);
            netWorth.push(nwVal);

            // Wellness Index
            const wellnessVal = Math.max(10, Math.min(100, Math.round(wellnessBase * (1 - (0.015 * (8 - sleepHours) * y)))));
            wellness.push(wellnessVal);

            // Skill Mastery
            const skillVal = Math.round(100 * (1 - Math.exp(-0.0005 * studyMinutes * 365 * y)));
            skillMastery.push(skillVal);
        }

        setCurves({ netWorth, wellness, skillMastery });
    };

    // Trigger recalculation on slider change
    useEffect(() => {
        recalculateMath();
    }, [savingsRate, sleepHours, studyHours]);

    // Lazy load the LLM narrative compilation
    const handleCrystallize = async () => {
        setLoadingBrief(true);
        setBriefing('');
        try {
            const data = await apiCall('POST', '/simulator/project', {
                savingsRate,
                sleepHours,
                studyHours,
                crystallize: true
            });
            if (data?.briefing) {
                setBriefing(data.briefing);
            }
        } catch (err) {
            console.error('Failed to crystallize trajectory:', err);
            setBriefing('Error compiles your future trajectory. Please check connection and try again.');
        } finally {
            setLoadingBrief(false);
        }
    };

    const nw = curves.netWorth[activeYear - 1] || 0;
    const well = curves.wellness[activeYear - 1] || 0;
    const skill = curves.skillMastery[activeYear - 1] || 0;

    // Helper to parse markdown
    const renderMarkdown = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                return <h3 key={i} className="text-sm font-extrabold text-foreground tracking-tight mt-4 mb-2 uppercase border-b border-border/30 pb-1">{trimmed.slice(2)}</h3>;
            }
            if (trimmed.startsWith('## ')) {
                return <h4 key={i} className="text-xs font-bold text-violet-400 mt-3 mb-1 uppercase">{trimmed.slice(3)}</h4>;
            }
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return <li key={i} className="text-[10px] text-muted-foreground ml-3 list-disc mb-0.5 leading-relaxed">{trimmed.slice(2)}</li>;
            }
            if (!trimmed) return <div key={i} className="h-1.5" />;
            return <p key={i} className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">{trimmed}</p>;
        });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 bg-card/25 backdrop-blur-md border border-border/40 rounded-3xl shadow-xl">
            {/* Split layout: Controls & SVG Dials */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Sliders Control Panel */}
                <div className="md:col-span-5 bg-secondary/15 rounded-2xl border border-border/20 p-5 space-y-5">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-foreground tracking-wider pb-2 border-b border-border/30">
                        <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin-slow" />
                        <span>Interactive Routines Simulator</span>
                    </div>

                    {/* Savings Rate Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground">Monthly Savings</span>
                            <span className="text-violet-400">${savingsRate.toLocaleString()}/mo</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="5000"
                            step="50"
                            value={savingsRate}
                            onChange={(e) => setSavingsRate(Number(e.target.value))}
                            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                    </div>

                    {/* Sleep Hours Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground">Sleep Allocation</span>
                            <span className="text-fuchsia-400">{sleepHours} Hours/night</span>
                        </div>
                        <input
                            type="range"
                            min="4"
                            max="10"
                            step="0.5"
                            value={sleepHours}
                            onChange={(e) => setSleepHours(Number(e.target.value))}
                            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                        />
                    </div>

                    {/* Study Hours Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground">Daily Focus & Study</span>
                            <span className="text-emerald-400">{studyHours} Hours/day</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="12"
                            step="0.5"
                            value={studyHours}
                            onChange={(e) => setStudyHours(Number(e.target.value))}
                            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    <button
                        onClick={handleCrystallize}
                        disabled={loadingBrief}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loadingBrief ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Crystallizing Futuring...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Crystallize Trajectory Briefing</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Concentric Year SVG Dial and Indices */}
                <div className="md:col-span-7 bg-secondary/10 border border-border/20 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* SVG Concentric Ring dials */}
                    <div className="relative w-56 h-56 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Dial 1: Net Worth */}
                            <circle cx="112" cy="112" r="90" className="stroke-secondary/30" strokeWidth="6" fill="transparent" />
                            <circle
                                cx="112"
                                cy="112"
                                r="90"
                                className="stroke-violet-500 transition-all duration-300"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 90}
                                strokeDashoffset={2 * Math.PI * 90 * (1 - Math.min(100, (nw / 600000)))}
                            />

                            {/* Dial 2: Wellness */}
                            <circle cx="112" cy="112" r="72" className="stroke-secondary/30" strokeWidth="6" fill="transparent" />
                            <circle
                                cx="112"
                                cy="112"
                                r="72"
                                className="stroke-fuchsia-500 transition-all duration-300"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 72}
                                strokeDashoffset={2 * Math.PI * 72 * (1 - well / 100)}
                            />

                            {/* Dial 3: Skill Mastery */}
                            <circle cx="112" cy="112" r="54" className="stroke-secondary/30" strokeWidth="6" fill="transparent" />
                            <circle
                                cx="112"
                                cy="112"
                                r="54"
                                className="stroke-emerald-400 transition-all duration-300"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 54}
                                strokeDashoffset={2 * Math.PI * 54 * (1 - skill / 100)}
                            />
                        </svg>

                        {/* Mid labels */}
                        <div className="absolute text-center flex flex-col items-center">
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Year</span>
                            <span className="text-3xl font-extrabold text-foreground">{activeYear}</span>
                            <span className="text-[9px] text-violet-400 font-bold uppercase tracking-wider">Milestone</span>
                        </div>
                    </div>

                    {/* Numeric indicators grid */}
                    <div className="grid grid-cols-3 gap-4 w-full mt-5">
                        <div className="bg-background/40 border border-border/20 rounded-xl p-2.5 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                                <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Net Worth</span>
                                <span className="text-[11px] font-bold">${nw.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="bg-background/40 border border-border/20 rounded-xl p-2.5 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
                                <Heart className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Wellness</span>
                                <span className="text-[11px] font-bold">{well}/100</span>
                            </div>
                        </div>

                        <div className="bg-background/40 border border-border/20 rounded-xl p-2.5 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Award className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Skill Mastery</span>
                                <span className="text-[11px] font-bold">{skill}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Year selector slider timeline */}
            <div className="space-y-2 bg-secondary/10 border border-border/20 rounded-xl p-4">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-muted-foreground pb-2 border-b border-border/20">
                    <span>Select Simulation Year</span>
                    <span className="text-violet-400 font-black">Year {activeYear} of 10</span>
                </div>
                <div className="flex justify-between items-center gap-1.5 pt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                        <button
                            key={y}
                            onClick={() => setActiveYear(y)}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-extrabold transition-all border ${
                                activeYear === y
                                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white scale-[1.04]'
                                    : 'bg-background hover:bg-secondary border-border/40 text-muted-foreground'
                            }`}
                        >
                            Y{y}
                        </button>
                    ))}
                </div>
            </div>

            {/* Briefing narrative display panel */}
            <AnimatePresence>
                {(loadingBrief || briefing) && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-secondary/15 border border-border/40 rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-0.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded text-[9px] font-black uppercase text-fuchsia-400 tracking-wider">
                            <span>Future Projection Narrative</span>
                        </div>

                        {loadingBrief ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" />
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Generating crystallized briefing...</span>
                            </div>
                        ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none pt-4">
                                {renderMarkdown(briefing)}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default TrajectorySimulator;
