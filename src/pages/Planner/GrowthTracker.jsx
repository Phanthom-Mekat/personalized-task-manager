import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePlanner } from '../../provider/PlannerProvider';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Flame, Brain, Activity, Bed, BookOpen, Clock, Target, Shield, Zap,
    BatteryWarning, Coffee, Scale, Rocket, Crown, Plus, Sparkles, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useHaptics } from '../../hooks/useHaptics';

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import RitualQuickAction from '../../components/planner/RitualQuickAction';
import RitualChamber from '../../components/planner/RitualChamber';

const VIBES = [
  { id: 'burnt_out', label: 'Depleted', icon: <BatteryWarning />, bg: 'bg-white dark:bg-zinc-900', border: 'border-zinc-200 dark:border-zinc-800', textColor: 'text-zinc-400 dark:text-zinc-500', shadow: 'shadow-sm', values: { energyLevel: 1, moodLevel: 1, productivityScore: 2 }, prompt: "System low. Required action: Recovery." },
  { id: 'sluggish', label: 'Sluggish', icon: <Coffee />, bg: 'bg-white dark:bg-zinc-900', border: 'border-zinc-300 dark:border-zinc-700', textColor: 'text-zinc-600 dark:text-zinc-400', shadow: 'shadow-md', values: { energyLevel: 2, moodLevel: 2, productivityScore: 4 }, prompt: "Friction detected. Clear the blockage." },
  { id: 'steady', label: 'Steady', icon: <Scale />, bg: 'bg-white dark:bg-zinc-900', border: 'border-zinc-400 dark:border-zinc-600', textColor: 'text-zinc-800 dark:text-zinc-200', shadow: 'shadow-lg', values: { energyLevel: 3, moodLevel: 3, productivityScore: 6 }, prompt: "Equilibrium achieved. Maintain trajectory." },
  { id: 'driven', label: 'Driven', icon: <Rocket />, bg: 'bg-zinc-900 dark:bg-zinc-950', border: 'border-zinc-950 dark:border-zinc-900', textColor: 'text-white dark:text-zinc-100', shadow: 'shadow-xl', values: { energyLevel: 4, moodLevel: 4, productivityScore: 8 }, prompt: "Momentum secured. Outline the next strike." },
  { id: 'elite', label: 'Peak', icon: <Crown />, bg: 'bg-black dark:bg-zinc-950', border: 'border-black dark:border-zinc-800', textColor: 'text-white dark:text-zinc-100', shadow: 'shadow-2xl', values: { energyLevel: 5, moodLevel: 5, productivityScore: 10 }, prompt: "Optimal state. Document the catalyst." }
];

const DEEP_WORK_OPTS = [0.5, 1, 2, 4, 6, 8];
const SCREEN_TIME_OPTS = [0.5, 1, 1.5, 2, 4, 6, 8];

const MonoProgress = ({ value, invert = false }) => (
    <div className={`relative h-1.5 w-full rounded-none overflow-hidden border 
        ${invert 
            ? 'bg-zinc-800 dark:bg-zinc-200 border-zinc-700 dark:border-zinc-300' 
            : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700'}`}>
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
            className={`absolute top-0 left-0 h-full ${invert ? 'bg-white dark:bg-black' : 'bg-black dark:bg-white'}`}
        />
    </div>
);

const HourSelect = ({ label, icon: Icon, value, options, onChange, unit = "hrs" }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Icon className="w-3.5 h-3.5" /> {label}
        </label>
        <div className="flex flex-wrap gap-2">
            {options.map(opt => {
                const isActive = value === opt;
                return (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`min-w-[44px] px-3 py-2 rounded-xl border text-[11px] font-mono font-black transition-all active:scale-95
                        ${isActive 
                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-lg' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-650 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                        {opt}
                    </button>
                );
            })}
            <div className="relative flex items-center gap-2">
                <input
                    type="number"
                    step={0.5}
                    value={options.includes(value) ? "" : (value || "")}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    placeholder="..."
                    className="w-12 px-2 py-2 rounded-xl border border-dotted border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-mono font-black outline-none focus:border-black dark:focus:border-white focus:border-solid placeholder:text-zinc-350 dark:placeholder:text-zinc-600 text-center text-black dark:text-white"
                />
                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{unit}</span>
            </div>
        </div>
    </div>
);

const CorrelationCard = ({ title, value, positiveIsGood = true, tooltip, description }) => {
    const absVal = Math.abs(value || 0);
    const isStrong = absVal >= 0.5;
    const isModerate = absVal >= 0.3 && absVal < 0.5;
    const isWeak = absVal < 0.3 && absVal > 0.05;

    const isHealthy = (value >= 0 && positiveIsGood) || (value <= 0 && !positiveIsGood);
    
    let statusLabel = 'Neutral Link';
    let statusColor = 'text-zinc-450 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800';
    
    if (isStrong) {
        statusLabel = isHealthy ? 'Highly Synced ⚡' : 'Slight Blockage ⚠️';
        statusColor = isHealthy 
            ? 'text-emerald-800 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30 shadow-[0_2px_12px_rgba(16,185,129,0.02)]' 
            : 'text-rose-800 dark:text-rose-400 bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 dark:border-rose-500/30 shadow-[0_2px_12px_rgba(239,68,68,0.02)]';
    } else if (isModerate) {
        statusLabel = isHealthy ? 'Moderate Sync' : 'Mild Friction';
        statusColor = isHealthy 
            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' 
            : 'text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20';
    } else if (isWeak) {
        statusLabel = 'Weak Connection';
        statusColor = 'text-zinc-500 dark:text-zinc-450 bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800';
    } else {
        statusLabel = 'Not Yet Connected';
        statusColor = 'text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 border-dashed';
    }

    return (
        <motion.div 
            whileHover={{ scale: 1.01 }}
            className="p-5 rounded-[24px] border bg-card dark:bg-zinc-900/60 border-border dark:border-zinc-800 flex flex-col justify-between shadow-sm relative group hover:border-black dark:hover:border-white transition-all duration-300 min-h-[160px]"
        >
            <div className="absolute right-4 top-4 text-zinc-350 dark:text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer group/info">
                <span className="text-[10px] border border-zinc-200 dark:border-zinc-800 rounded-full w-4.5 h-4.5 flex items-center justify-center font-mono font-bold">?</span>
                <div className="absolute bottom-6 right-0 bg-zinc-950 dark:bg-zinc-900 text-white dark:text-zinc-100 border border-zinc-950 dark:border-zinc-800 text-[10px] font-medium p-3 rounded-2xl opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity duration-300 shadow-2xl w-48 z-50 normal-case leading-relaxed">
                    {tooltip}
                </div>
            </div>

            <div className="space-y-1 pr-6 text-left">
                <h4 className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-widest">{title}</h4>
                <p className="text-xs font-black text-black dark:text-white leading-snug">{description}</p>
            </div>

            <div className="mt-6 flex items-end justify-between">
                <div className="space-y-1">
                    <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColor}`}>
                        {statusLabel}
                    </span>
                </div>
                <div className="text-right">
                    <div className="font-mono text-2xl font-black text-black dark:text-white tracking-tighter leading-none">
                        {value > 0 ? `+${value.toFixed(2)}` : (value || 0).toFixed(2)}
                    </div>
                    <div className="text-[8px] font-mono font-black text-zinc-500 dark:text-zinc-450 uppercase tracking-widest mt-1">Pearson r</div>
                </div>
            </div>
        </motion.div>
    );
};

function GrowthTracker() {
    const { triggerSuccess, triggerSelection } = useHaptics();
    const {
        data, fetchGrowth, updateGrowth,
        getNoReelsStreak, getTodayDate, pendingRituals,
        fetchGrowthCoachInsights, fetchTrajectory
    } = usePlanner();

    const today = getTodayDate();
    const [selectedDate, setSelectedDate] = useState(today);
    const growth = data.growth[selectedDate];
    const [showChamber, setShowChamber] = useState(false);

    // Trajectory & Mathematical Correlation state
    const [trajectoryData, setTrajectoryData] = useState(null);
    const [loadingTrajectory, setLoadingTrajectory] = useState(false);

    // AI Coach State
    const [coachInsights, setCoachInsights] = useState(null);
    const [loadingCoach, setLoadingCoach] = useState(false);
    const coachLoaded = useRef(false);

    useEffect(() => {
        fetchGrowth(selectedDate);
    }, [selectedDate, fetchGrowth]);

    // Query 90 days correlations and trajectory stats on mount and log changes
    useEffect(() => {
        const loadTrajectory = async () => {
            setLoadingTrajectory(true);
            try {
                const start = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
                const end = dayjs().format('YYYY-MM-DD');
                const traj = await fetchTrajectory(start, end);
                setTrajectoryData(traj);
            } catch (err) {
                console.error("Failed to load trajectory / correlation analytics:", err);
            } finally {
                setLoadingTrajectory(false);
            }
        };
        loadTrajectory();
    }, [fetchTrajectory, data.growth]);


    // Query 7 days of logs to supply trend analysis to Gemini once on mount
    useEffect(() => {
        if (coachLoaded.current) return;
        const loadCoachInsights = async () => {
            coachLoaded.current = true; // Set IMMEDIATELY to prevent race conditions from duplicate renders
            setLoadingCoach(true);
            try {
                const start = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
                const end = dayjs().format('YYYY-MM-DD');
                const insights = await fetchGrowthCoachInsights(start, end);
                setCoachInsights(insights);
            } catch (err) {
                console.error("Failed to load growth coach insights:", err);
                coachLoaded.current = false; // Reset on failure so it can retry
            } finally {
                setLoadingCoach(false);
            }
        };

        if (data.growth && Object.keys(data.growth).length > 0) {
            loadCoachInsights();
        }
    }, [data.growth, fetchGrowthCoachInsights]);

    const streak = useMemo(() => getNoReelsStreak(), [data.growth, getNoReelsStreak]);

    const activeVibe = useMemo(() => {
        if (!growth) return null;
        const score = growth.productivityScore || 5; 
        if (score <= 2) return VIBES[0];
        if (score <= 4) return VIBES[1];
        if (score <= 6) return VIBES[2];
        if (score <= 8) return VIBES[3];
        return VIBES[4];
    }, [growth]);

    const rpgStats = useMemo(() => {
        if (!growth) return { vitality: 0, focus: 0, discipline: 0 };
        const habits = growth.habits || {};
        const eLvl = growth.energyLevel || 0;
        const pScore = growth.productivityScore || 0;
        const dpHr = growth.deepWorkHours || 0;

        // Vitality calculation: Sleep (up to 30) + Exercise (30) + Energy (40)
        const sleepHours = growth.sleepHours !== undefined ? growth.sleepHours : (habits.sleptWell ? 8 : 6);
        const sleepPoints = sleepHours >= 7 ? 30 : sleepHours >= 6 ? 20 : sleepHours >= 5 ? 10 : 0;
        const vitality = Math.min(100, Math.round((eLvl / 5) * 40 + sleepPoints + (habits.exercised ? 30 : 0)));

        // Focus calculation: Deep Work hours (up to 50) + Productivity Score (up to 50)
        const focus = Math.min(100, Math.round((dpHr / 4) * 50 + (pScore / 10) * 50));

        // Discipline calculation: Reels limit (up to 40) + Reading (up to 30) + Meditation (up to 30)
        const reelsTime = growth.reelsTime !== undefined ? growth.reelsTime : (habits.noReels ? 0 : 60);
        const reelsPoints = reelsTime === 0 ? 40 : reelsTime <= 30 ? 30 : reelsTime <= 60 ? 15 : 0;

        const readTime = growth.readTime !== undefined ? growth.readTime : (habits.readBook ? 20 : 0);
        const readPoints = readTime >= 20 ? 30 : readTime >= 10 ? 15 : 0;

        const meditateTime = growth.meditateTime !== undefined ? growth.meditateTime : (habits.meditatedOrPrayed ? 10 : 0);
        const meditatePoints = meditateTime >= 15 ? 30 : meditateTime >= 5 ? 15 : 0;

        const discipline = Math.min(100, Math.round(reelsPoints + readPoints + meditatePoints));

        return { vitality, focus, discipline };
    }, [growth]);

    const handleVibeSelect = (vibe) => {
        triggerSelection();
        updateGrowth(selectedDate, { 
            energyLevel: vibe.values.energyLevel,
            moodLevel: vibe.values.moodLevel,
            productivityScore: vibe.values.productivityScore
        });
    };

    const handleHabitToggle = (key) => {
        if (!growth) return;
        const currentHabits = growth.habits || {};
        const isCurrentlyActive = currentHabits[key];
        triggerSuccess();
        updateGrowth(selectedDate, { habits: { ...currentHabits, [key]: !isCurrentlyActive } });

        if (key === 'noReels' && !isCurrentlyActive) {
            toast('Flame protected.', { icon: '🔥', style: { background: '#fff', color: '#000', border: '1px solid #e4e4e7' } });
        }
    };

    const handleTimeAction = (field, val) => {
        // Backend stores screenTime in minutes
        const finalVal = field === 'screenTime' ? Math.round(val * 60) : val;
        updateGrowth(selectedDate, { [field]: finalVal });
    };

    const past30Days = useMemo(() => {
        const dates = [];
        for (let i = 29; i >= 0; i--) {
            dates.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
        }
        return dates;
    }, []);

    const statsSummary = useMemo(() => {
        let totalProd = 0;
        let loggedDays = 0;
        let totalDeepWork = 0;
        let totalReels = 0;
        let totalSleep = 0;
        let totalRead = 0;
        let totalMeditate = 0;
        const habitsCount = { exercised: 0 };
        const loggedWins = [];

        past30Days.forEach(date => {
            const log = data.growth[date];
            if (log) {
                loggedDays++;
                totalProd += log.productivityScore || 5;
                totalDeepWork += log.deepWorkHours || 0;
                
                // Fallbacks to handle legacy Mongoose logs gracefully
                const reels = log.reelsTime !== undefined ? log.reelsTime : (log.habits?.noReels ? 0 : 60);
                const sleep = log.sleepHours !== undefined ? log.sleepHours : (log.habits?.sleptWell ? 8 : 6);
                const read = log.readTime !== undefined ? log.readTime : (log.habits?.readBook ? 20 : 0);
                const meditate = log.meditateTime !== undefined ? log.meditateTime : (log.habits?.meditatedOrPrayed ? 10 : 0);

                totalReels += reels;
                totalSleep += sleep;
                totalRead += read;
                totalMeditate += meditate;

                if (log.habits?.exercised) habitsCount.exercised++;
                
                if (log.todayWin && log.todayWin.trim()) {
                    loggedWins.push({ date, win: log.todayWin });
                }
            }
        });

        return {
            avgProductivity: loggedDays > 0 ? (totalProd / loggedDays).toFixed(1) : '0.0',
            totalDeepWork: totalDeepWork.toFixed(1),
            loggedDays,
            avgReels: loggedDays > 0 ? Math.round(totalReels / loggedDays) : 0,
            avgSleep: loggedDays > 0 ? (totalSleep / loggedDays).toFixed(1) : '0.0',
            avgRead: loggedDays > 0 ? Math.round(totalRead / loggedDays) : 0,
            avgMeditate: loggedDays > 0 ? Math.round(totalMeditate / loggedDays) : 0,
            workoutRate: loggedDays > 0 ? Math.round((habitsCount.exercised / loggedDays) * 100) : 0,
            recentWins: loggedWins.slice(-3).reverse()
        };
    }, [data.growth, past30Days]);

    if (!growth) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen bg-transparent">
                <div className="animate-pulse text-zinc-400 dark:text-zinc-500 font-mono tracking-widest uppercase text-xs">Initializing Link...</div>
            </div>
        );
    }

    const isDarkVibe = activeVibe?.id === 'driven' || activeVibe?.id === 'elite';

    return (
        <div className="min-h-screen pb-24 md:pb-32 text-zinc-900 dark:text-zinc-100 flex flex-col relative overflow-hidden bg-transparent selection:bg-zinc-200 dark:selection:bg-zinc-800">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[1000px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-12 relative z-10"
            >
                {/* HEAD */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
                    <div className="text-left">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-black dark:text-white mb-2 tracking-tighter">
                            {selectedDate === today ? 'DAILY COMM' : 'HISTORICAL COMM'}
                        </h1>
                        <div className="text-xs sm:text-sm tracking-widest text-zinc-500 dark:text-zinc-400 uppercase font-bold pl-1 font-mono flex items-center flex-wrap gap-2">
                            {selectedDate === today ? (
                                'Mission parameter logging'
                            ) : (
                                <>
                                    <Calendar className="w-3.5 h-3.5 inline text-black dark:text-white" />
                                    <span>Inspecting archive: {dayjs(selectedDate).format('MMM D, YYYY')}</span>
                                    <button 
                                        onClick={() => setSelectedDate(today)}
                                        className="text-[9px] font-black text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-full px-2.5 py-1 ml-2 normal-case transition-all whitespace-nowrap active:scale-95 shadow-sm"
                                    >
                                        Back to Today
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Flame Streak HUD */}
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850 shadow-sm relative overflow-hidden group self-start sm:self-auto"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-100/0 via-zinc-100 to-zinc-100/0 dark:from-zinc-800/0 dark:via-zinc-800 dark:to-zinc-800/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <Flame className={`w-5 h-5 ${streak > 0 ? 'text-black dark:text-white' : 'text-zinc-300 dark:text-zinc-700'}`} />
                        <span className="font-black text-lg text-black dark:text-white">{streak} <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Days</span></span>
                    </motion.div>
                </div>

                {/* 🌿 AI MINDFUL TRENDS COACH */}
                <div className="mb-10 text-left">
                    {loadingCoach ? (
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[28px] animate-pulse flex flex-col gap-3 min-h-[120px]">
                            <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                        </div>
                    ) : coachInsights ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 sm:p-6 border-2 rounded-[24px] sm:rounded-[28px] text-left relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 transition-all duration-500
                            ${coachInsights.status === 'positive' 
                                ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 shadow-[0_4px_24px_rgba(16,185,129,0.04)]' 
                                : coachInsights.status === 'alert' 
                                ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 shadow-[0_4px_24px_rgba(245,158,11,0.04)]' 
                                : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 shadow-sm'}`}
                        >
                            {/* Decorative background logo */}
                            <div className="absolute right-4 top-4 opacity-5 pointer-events-none text-black dark:text-white">
                                <Brain className="w-20 h-20" />
                            </div>

                            <div className="space-y-2 flex-1 text-left relative z-10 font-sans">
                                <span className={`text-[9px] font-black uppercase tracking-[0.25em] flex items-center gap-1.5 leading-none
                                ${coachInsights.status === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : coachInsights.status === 'alert' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                    <Sparkles className="w-3 h-3" /> AI Mindfulness Coach
                                </span>
                                <h3 className="text-base font-black uppercase tracking-tight text-black dark:text-white flex items-center gap-2">{coachInsights.headline}</h3>
                                <p className="font-serif text-sm leading-relaxed text-zinc-600 dark:text-zinc-350 italic">
                                    "{coachInsights.coachingText}"
                                </p>
                            </div>

                            {coachInsights.actionItem && (
                                <div className="sm:max-w-xs w-full flex-shrink-0 relative z-10 flex flex-col gap-1.5 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Mindful Action</span>
                                    <p className="text-xs font-bold text-black dark:text-white leading-normal flex items-start gap-1.5">
                                        <Zap className="w-3.5 h-3.5 mt-0.5 text-zinc-800 dark:text-zinc-250 flex-shrink-0 fill-current" />
                                        {coachInsights.actionItem}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ) : null}
                </div>

                {/* 1. VIBE DOCK */}
                <div className="mb-14">
                    <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 pl-1 text-left">I. Select Vitality State</h2>
                    <div className="flex gap-3 overflow-x-auto pb-6 pt-2 px-1 snap-x hide-scrollbar">
                        {VIBES.map((vibe) => {
                            const isActive = activeVibe?.id === vibe.id;
                            return (
                                <button
                                    key={vibe.id}
                                    onClick={() => handleVibeSelect(vibe)}
                                    className={`snap-center flex-shrink-0 flex gap-4 items-center px-6 py-5 rounded-2xl border transition-all duration-500 ease-out active:scale-95
                                    ${isActive 
                                        ? `${vibe.bg} ${vibe.border} ${vibe.textColor} ${vibe.shadow} scale-[1.02]` 
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                >
                                    <span className={`w-6 h-6 stroke-[2.5px] ${isActive ? 'opacity-100' : 'opacity-40 dark:opacity-50'}`}>{vibe.icon}</span>
                                    <span className="font-bold tracking-wider text-sm uppercase">{vibe.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
                    {/* 2. CHARACTER RPG HUD */}
                    <div className="lg:col-span-5 relative group">
                        <div className="h-full bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-4 sm:p-8 shadow-sm relative overflow-hidden">
                            
                            <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6 sm:mb-8 text-left">II. System Diagnostic</h2>
                            
                            <div className="space-y-8">
                                {/* Vitality */}
                                <div className="space-y-3 group/stat">
                                    <div className="flex justify-between items-end">
                                        <span className="flex items-center gap-2 text-[11px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-widest">
                                            <Zap className="w-4 h-4 text-black dark:text-white" /> Vitality
                                        </span>
                                        <span className="font-mono text-xl font-black text-zinc-900 dark:text-zinc-100">{rpgStats.vitality}</span>
                                    </div>
                                    <MonoProgress value={rpgStats.vitality} />
                                </div>
                                {/* Focus */}
                                <div className="space-y-3 group/stat">
                                    <div className="flex justify-between items-end">
                                        <span className="flex items-center gap-2 text-[11px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-widest">
                                            <Target className="w-4 h-4 text-black dark:text-white" /> Focus
                                        </span>
                                        <span className="font-mono text-xl font-black text-zinc-900 dark:text-zinc-100">{rpgStats.focus}</span>
                                    </div>
                                    <MonoProgress value={rpgStats.focus} />
                                </div>
                                {/* Discipline */}
                                <div className="space-y-3 group/stat">
                                    <div className="flex justify-between items-end">
                                        <span className="flex items-center gap-2 text-[11px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-widest">
                                            <Shield className="w-4 h-4 text-black dark:text-white" /> Discipline
                                        </span>
                                        <span className="font-mono text-xl font-black text-zinc-900 dark:text-zinc-100">{rpgStats.discipline}</span>
                                    </div>
                                    <MonoProgress value={rpgStats.discipline} />
                                </div>
                            </div>
                            
                            <div className="space-y-10 mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-left">
                                <HourSelect 
                                    label="Deep Work" 
                                    icon={Brain} 
                                    value={growth.deepWorkHours} 
                                    options={DEEP_WORK_OPTS} 
                                    onChange={(v) => handleTimeAction('deepWorkHours', v)}
                                />
                                <HourSelect 
                                    label="Screen Time" 
                                    icon={Clock} 
                                    value={growth.screenTime / 60} 
                                    options={SCREEN_TIME_OPTS} 
                                    onChange={(v) => handleTimeAction('screenTime', v)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. WELLNESS BENTO & DETAILED METRICS */}
                    <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                        {/* Wellness Metrics Bento */}
                        <div>
                            <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 sm:mb-4 pl-1 text-left">III. Core Wellness Metrics</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                
                                {/* 1. REELS SCROLL LIMIT */}
                                <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-sm flex flex-col justify-between text-left">
                                    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[9px] font-black mb-3">
                                        <Flame className="w-4 h-4 text-black dark:text-white" /> Doom-Scrolling Limit
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-lg font-black text-black dark:text-white leading-none">
                                            {growth.reelsTime === 0 ? 'Clean Streak 🔥' : `${growth.reelsTime} mins`}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[0, 15, 30, 45, 60, 90, 120].map(mins => {
                                                const isActive = (growth.reelsTime ?? 0) === mins;
                                                return (
                                                    <button
                                                        key={mins}
                                                        onClick={() => {
                                                            if (mins === 0) triggerSuccess();
                                                            else triggerSelection();
                                                            updateGrowth(selectedDate, { 
                                                                reelsTime: mins,
                                                                habits: { ...(growth.habits || {}), noReels: mins === 0 }
                                                            });
                                                        }}
                                                        className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-black transition-all active:scale-95
                                                        ${isActive 
                                                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-sm' 
                                                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:border-zinc-350 dark:hover:border-zinc-650'}`}
                                                    >
                                                        {mins}m
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. RESTORATIVE SLEEP */}
                                <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-sm flex flex-col justify-between text-left">
                                    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[9px] font-black mb-3">
                                        <Bed className="w-4 h-4 text-black dark:text-white" /> Restorative Sleep
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-lg font-black text-black dark:text-white leading-none">
                                            {growth.sleepHours || 8} hrs
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[5, 6, 7, 8, 9, 10].map(hrs => {
                                                const isActive = (growth.sleepHours ?? 8) === hrs;
                                                return (
                                                    <button
                                                        key={hrs}
                                                        onClick={() => {
                                                            triggerSelection();
                                                            updateGrowth(selectedDate, { 
                                                                sleepHours: hrs,
                                                                habits: { ...(growth.habits || {}), sleptWell: hrs >= 7 }
                                                            });
                                                        }}
                                                        className={`px-2 py-1.5 rounded-xl border text-[10px] font-mono font-black transition-all active:scale-95
                                                        ${isActive 
                                                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-sm' 
                                                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:border-zinc-350 dark:hover:border-zinc-650'}`}
                                                    >
                                                        {hrs}h
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. READ DURATION */}
                                <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-sm flex flex-col justify-between text-left">
                                    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[9px] font-black mb-3">
                                        <BookOpen className="w-4 h-4 text-black dark:text-white" /> Mindful Reading
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-lg font-black text-black dark:text-white leading-none">
                                            {growth.readTime || 0} mins
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[0, 10, 20, 30, 45, 60].map(mins => {
                                                const isActive = (growth.readTime ?? 0) === mins;
                                                return (
                                                    <button
                                                        key={mins}
                                                        onClick={() => {
                                                            if (mins >= 20) triggerSuccess();
                                                            else triggerSelection();
                                                            updateGrowth(selectedDate, { 
                                                                readTime: mins,
                                                                habits: { ...(growth.habits || {}), readBook: mins >= 20 }
                                                            });
                                                        }}
                                                        className={`px-2 py-1.5 rounded-xl border text-[10px] font-mono font-black transition-all active:scale-95
                                                        ${isActive 
                                                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-sm' 
                                                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:border-zinc-350 dark:hover:border-zinc-650'}`}
                                                    >
                                                        {mins}m
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* 4. MEDITATION INTERVAL */}
                                <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-sm flex flex-col justify-between text-left">
                                    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-[9px] font-black mb-3">
                                        <Brain className="w-4 h-4 text-black dark:text-white" /> Breath & Meditation
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-lg font-black text-black dark:text-white leading-none">
                                            {growth.meditateTime || 0} mins
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[0, 5, 10, 15, 20, 30].map(mins => {
                                                const isActive = (growth.meditateTime ?? 0) === mins;
                                                return (
                                                    <button
                                                        key={mins}
                                                        onClick={() => {
                                                            if (mins >= 10) triggerSuccess();
                                                            else triggerSelection();
                                                            updateGrowth(selectedDate, { 
                                                                meditateTime: mins,
                                                                habits: { ...(growth.habits || {}), meditatedOrPrayed: mins >= 10 }
                                                            });
                                                        }}
                                                        className={`px-2 py-1.5 rounded-xl border text-[10px] font-mono font-black transition-all active:scale-95
                                                        ${isActive 
                                                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-sm' 
                                                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:border-zinc-350 dark:hover:border-zinc-650'}`}
                                                    >
                                                        {mins}m
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. PHYSICAL WORKOUT (TRAIN) */}
                            <div className="mt-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Physical Training Protocol</h4>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Strength session or active cardio</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleHabitToggle('exercised')}
                                    className={`w-full sm:w-auto px-6 py-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all active:scale-95
                                    ${growth.habits?.exercised
                                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-black dark:text-white shadow-sm'
                                        : 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-md'}`}
                                >
                                    {growth.habits?.exercised ? '✓ Completed' : 'Mark Completed'}
                                </button>
                            </div>
                        </div>

                        {/* Today's Win Card */}
                        <div className="rounded-[24px] sm:rounded-[32px] md:rounded-[40px] border bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden group hover:border-black dark:hover:border-white transition-all duration-300">
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                <Crown className="w-16 h-16 text-black dark:text-white" />
                            </div>
                            <div className="relative z-10 flex flex-col gap-4 text-left">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-black dark:text-white" /> Today's Major Win
                                </label>
                                <Textarea
                                    value={growth.todayWin || ''}
                                    onChange={(e) => updateGrowth(selectedDate, { todayWin: e.target.value })}
                                    placeholder="What was the absolute highlight of your day? Lock in this victory..."
                                    rows={2}
                                    className="rounded-2xl p-4 focus-visible:ring-1 resize-none font-medium shadow-inner border border-transparent dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus-visible:ring-black dark:focus-visible:ring-white"
                                />
                            </div>
                        </div>

                        {/* Direct Line Prompt */}
                        <AnimatePresence mode="popLayout">
                            {activeVibe && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={activeVibe.id}
                                    className={`relative rounded-[24px] sm:rounded-[32px] md:rounded-[40px] border ${activeVibe.bg} ${activeVibe.border} p-4 sm:p-6 md:p-8 ${isDarkVibe ? 'shadow-2xl' : 'shadow-sm'} overflow-hidden`}
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none mix-blend-overlay">
                                        {activeVibe.icon}
                                    </div>
                                    <div className="relative z-10 flex flex-col gap-5 text-left">
                                        <label className={`text-lg font-black tracking-tight leading-tight max-w-[80%] ${activeVibe.textColor}`}>
                                            {activeVibe.prompt}
                                        </label>
                                        <Textarea
                                            value={growth.tomorrowFocus || ''}
                                            onChange={(e) => updateGrowth(selectedDate, { tomorrowFocus: e.target.value })}
                                            placeholder="Write to link..."
                                            rows={2}
                                            className={`rounded-2xl p-4 focus-visible:ring-1 resize-none font-medium shadow-inner border-transparent 
                                                ${isDarkVibe 
                                                    ? 'bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white' 
                                                    : 'bg-black/5 dark:bg-white/10 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus-visible:ring-black dark:focus-visible:ring-white'}`}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                
                {/* 4. PERFORMANCE TRAJECTORY HEATMAP & METRICS */}
                <div className="mb-14">
                    <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 pl-1 text-left">IV. Performance Trajectory (Past 30 Days)</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                        {/* Heatmap Grid */}
                        <div className="lg:col-span-7 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-4 sm:p-6 md:p-8 shadow-sm flex flex-col justify-between">
                            <div className="text-left">
                                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1">Consistency Heatmap</h3>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-6">Click a cell to inspect or retroactively log that date</p>
                            </div>
                            
                            <div className="grid grid-cols-6 min-[400px]:grid-cols-8 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 justify-center sm:justify-start">
                                {past30Days.map(date => {
                                    const log = data.growth[date];
                                    const score = log?.productivityScore;
                                    const isSelected = selectedDate === date;
                                    const isCurrentDay = date === today;
                                    
                                    // Colors based on productivity score
                                    let cellColor = 'bg-zinc-50 border-zinc-200/60 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:border-zinc-800/60 dark:text-zinc-500 dark:hover:bg-zinc-850';
                                    if (score !== undefined) {
                                        if (score <= 2) cellColor = 'bg-zinc-200 border-zinc-300 text-zinc-650 hover:bg-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700';
                                        else if (score <= 4) cellColor = 'bg-zinc-300 border-zinc-400 text-zinc-700 hover:bg-zinc-400 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-600';
                                        else if (score <= 6) cellColor = 'bg-zinc-400 border-zinc-500 text-zinc-850 hover:bg-zinc-500 dark:bg-zinc-500 dark:border-zinc-500 dark:text-zinc-100 dark:hover:bg-zinc-500/80';
                                        else if (score <= 8) cellColor = 'bg-zinc-600 border-zinc-700 text-zinc-100 hover:bg-zinc-700 dark:bg-zinc-300 dark:border-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-200/80';
                                        else cellColor = 'bg-black border-black text-white hover:bg-zinc-900 dark:bg-white dark:border-white dark:text-black dark:hover:bg-zinc-100';
                                    }
                                    
                                    return (
                                        <button
                                            key={date}
                                            onClick={() => setSelectedDate(date)}
                                            className={`w-full aspect-square max-w-[40px] max-h-[40px] sm:w-10 sm:h-10 rounded-xl border flex flex-col items-center justify-center relative group active:scale-90 transition-all
                                            ${cellColor} ${isSelected ? 'ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-zinc-900 scale-105 z-10' : ''} ${isCurrentDay ? 'border-dashed border-zinc-500 dark:border-zinc-400' : ''}`}
                                        >
                                            <span className="text-[10px] font-mono font-black">{dayjs(date).format('D')}</span>
                                            
                                            {/* Tooltip */}
                                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-950 text-white text-[10px] font-mono font-black py-2 px-3 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-xl whitespace-nowrap z-50">
                                                <div className="mb-1 text-zinc-300 font-bold uppercase tracking-wider">{dayjs(date).format('MMM D, YYYY')}</div>
                                                {score !== undefined ? (
                                                    <div className="space-y-0.5 text-left font-sans">
                                                        <div>Score: <span className="text-white font-bold">{score}/10</span></div>
                                                        <div>Deep Work: <span className="text-white font-bold">{log?.deepWorkHours || 0} hrs</span></div>
                                                        <div className="space-y-0.5 mt-1 border-t border-zinc-800 pt-1 text-zinc-400 text-[9px] font-mono">
                                                            <div>Sleep: <span className="text-zinc-200">{log?.sleepHours !== undefined ? `${log.sleepHours}h` : (log?.habits?.sleptWell ? '7h+' : '<7h')}</span></div>
                                                            <div>Reels: <span className="text-zinc-200">{log?.reelsTime !== undefined ? `${log.reelsTime}m` : (log?.habits?.noReels ? '0m' : '30m+')}</span></div>
                                                            <div>Read: <span className="text-zinc-200">{log?.readTime !== undefined ? `${log.readTime}m` : (log?.habits?.readBook ? '15m+' : '0m')}</span></div>
                                                            <div>Meditate: <span className="text-zinc-200">{log?.meditateTime !== undefined ? `${log.meditateTime}m` : (log?.habits?.meditatedOrPrayed ? '10m+' : '0m')}</span></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-400 font-medium lowercase tracking-wide italic">No log record</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>Empty</span>
                                    <div className="w-3 h-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 rounded" />
                                    <div className="w-3 h-3 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded" />
                                    <div className="w-3 h-3 bg-zinc-400 dark:bg-zinc-500 border border-zinc-500 rounded" />
                                    <div className="w-3 h-3 bg-zinc-600 dark:bg-zinc-300 border border-zinc-700 dark:border-zinc-200 rounded" />
                                    <div className="w-3 h-3 bg-black dark:bg-white border-black dark:border-white rounded" />
                                    <span>Peak</span>
                                </div>
                                <div className="font-mono text-zinc-350 dark:text-zinc-550 italic font-bold">Dotted cell = Today</div>
                            </div>
                        </div>

                        {/* Aggregate Metrics Side Card */}
                        <div className="lg:col-span-5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-4 sm:p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6">
                            <div className="text-left">
                                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1">Velocity Metrics</h3>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Aggregated stats from logged dates</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl text-center">
                                    <div className="text-lg font-black text-black dark:text-white leading-none">{statsSummary.avgProductivity}</div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-1.5">Avg Productivity</div>
                                </div>
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl text-center">
                                    <div className="text-lg font-black text-black dark:text-white leading-none">{statsSummary.totalDeepWork} <span className="text-[10px]">hrs</span></div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-1.5">Deep Focus</div>
                                </div>
                            </div>

                            <div className="space-y-2 text-left">
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Wellness Averages (Past 30 Days)</div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-zinc-500 dark:text-zinc-400">Avg Reels Scrolling</span>
                                    <span className="font-mono text-black dark:text-white">{statsSummary.avgReels} mins</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-zinc-500 dark:text-zinc-400">Avg Sleep Duration</span>
                                    <span className="font-mono text-black dark:text-white">{statsSummary.avgSleep} hrs</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-zinc-500 dark:text-zinc-400">Avg Reading Session</span>
                                    <span className="font-mono text-black dark:text-white">{statsSummary.avgRead} mins</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-zinc-500 dark:text-zinc-400">Avg Meditation Session</span>
                                    <span className="font-mono text-black dark:text-white">{statsSummary.avgMeditate} mins</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-zinc-500 dark:text-zinc-400">Training Completion</span>
                                    <span className="font-mono text-black dark:text-white">{statsSummary.workoutRate}%</span>
                                </div>
                            </div>

                            {statsSummary.recentWins.length > 0 && (
                                <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 text-left">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Recent Victories</div>
                                    <div className="space-y-2 max-h-24 overflow-y-auto pr-1 hide-scrollbar">
                                        {statsSummary.recentWins.map((w, idx) => (
                                            <div key={idx} className="text-[10px] font-medium leading-relaxed bg-zinc-50/70 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-100 dark:border-zinc-855 rounded-xl p-2">
                                                <div className="text-[8px] text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase mb-0.5">{dayjs(w.date).format('MMM D')}</div>
                                                <div className="text-black dark:text-white italic font-bold">"{w.win}"</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 5. SYSTEM CORRELATIONS & BEHAVIORAL LINKAGES */}
                <div className="mb-14">
                    <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 pl-1 text-left">V. Behavioral Linkages (90-Day Analytics Engine)</h2>
                    
                    {!trajectoryData ? (
                        <div className="p-8 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-sm text-center">
                            <div className="animate-pulse flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                                    <Activity className="w-5 h-5 text-zinc-350 dark:text-zinc-550 animate-spin" />
                                </div>
                                <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mt-2 mx-auto" />
                                <div className="h-3 w-64 bg-zinc-100 dark:bg-zinc-850 rounded mx-auto" />
                            </div>
                        </div>
                    ) : trajectoryData.correlations && trajectoryData.correlations.sampleSize < 3 ? (
                        <div className="p-8 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-sm text-center font-sans">
                            <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                                <Shield className="w-8 h-8 text-zinc-350 dark:text-zinc-650 mx-auto" />
                                <h3 className="text-sm font-black uppercase text-black dark:text-white">Awaiting System Data</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-serif italic">
                                    "Log at least 3 separate daily entries to start unlocking predictive behavioral links and correlation analytics."
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <CorrelationCard 
                                title="Recovery Lag"
                                value={trajectoryData.correlations.sleepVsScreenLag}
                                positiveIsGood={false}
                                description="Sleep Today vs Screen Time Tomorrow"
                                tooltip="Checks if sleep deprivation today correlates with higher doomscrolling tomorrow (1-day shift). A negative value confirms poor sleep triggers fatigue scrolling."
                            />
                            <CorrelationCard 
                                title="Focus Link"
                                value={trajectoryData.correlations.deepWorkVsProductivity}
                                positiveIsGood={true}
                                description="Deep Work vs Productivity Score"
                                tooltip="Measures how strongly deep work hours correlate with your productivity. A positive value closer to +1.0 indicates deep focus sessions drive your peak productivity."
                            />
                            <CorrelationCard 
                                title="Distraction Penalty"
                                value={trajectoryData.correlations.screenVsProductivity}
                                positiveIsGood={false}
                                description="Screen Time vs Productivity"
                                tooltip="Measures how screen time affects your daily productivity score. A negative score confirms high screen usage harms output."
                            />
                            <CorrelationCard 
                                title="Scroll Depression"
                                value={trajectoryData.correlations.reelsVsMood}
                                positiveIsGood={false}
                                description="Reels Time vs Mood Level"
                                tooltip="Measures how scrolling reels affects your overall mood. A negative value indicates that longer screen scrolls correlate with a post-scrolling mood dip."
                            />
                            <CorrelationCard 
                                title="Energy Vitality"
                                value={trajectoryData.correlations.workoutVsEnergy}
                                positiveIsGood={true}
                                description="Workout Completed vs Energy"
                                tooltip="Measures how physical training session completion affects your overall daily energy. A positive score confirms exercise is your primary vitality catalyst."
                            />
                            <CorrelationCard 
                                title="Mindfulness Yield"
                                value={trajectoryData.correlations.meditateVsDeepWork}
                                positiveIsGood={true}
                                description="Meditation vs Deep Focus hours"
                                tooltip="Measures the direct impact of breathing or meditation on deep focus hours completed. A positive value validates that mindfulness expands focus capacity."
                            />
                        </div>
                    )}
                </div>
                
                <div className="pt-10 flex justify-center">
                    <RitualQuickAction onOpen={() => setShowChamber(true)} />
                </div>
                
            </motion.div>

            {showChamber && pendingRituals?.[0] && (
                <RitualChamber 
                    ritual={pendingRituals[0]} 
                    onClose={() => setShowChamber(false)} 
                />
            )}
        </div>
    );
}

export default GrowthTracker;
