import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import { usePlanner } from '../../provider/PlannerProvider';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
    Target, Trophy, Flame, Plus, CheckCircle2, 
    Circle, ChevronLeft, ChevronRight, Calendar, 
    Zap, Star, LayoutGrid, Clock, Bookmark,
    Activity, MessageSquare, BatteryFull, Terminal,
    Lock, Unlock, Sparkles, Brain, Lightbulb, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const WeeklyPlanner = () => {
    const { data, fetchWeekly, updateWeekly, completeRitual, fetchGrowthCoachInsights, loading } = usePlanner();

    // Maintain selected date state for Week Navigation (defaults to today)
    const [selectedDate, setSelectedDate] = useState(dayjs());

    // Compute dynamic week properties based on the selected date
    const startOfWeek = useMemo(() => selectedDate.startOf('week'), [selectedDate]);
    const year = useMemo(() => startOfWeek.year(), [startOfWeek]);
    const weekNumber = useMemo(() => startOfWeek.week(), [startOfWeek]);
    const weekKey = `${year}-W${weekNumber}`;
    const weeklyData = data.weekly[weekKey];

    // Weekly AI Performance Coach states
    const [aiInsights, setAiInsights] = useState(null);
    const [loadingCoach, setLoadingCoach] = useState(false);
    const [analysisTriggered, setAnalysisTriggered] = useState(false);

    const daysOfWeek = [
        { name: 'monday', short: 'MON' },
        { name: 'tuesday', short: 'TUE' },
        { name: 'wednesday', short: 'WED' },
        { name: 'thursday', short: 'THU' },
        { name: 'friday', short: 'FRI' },
        { name: 'saturday', short: 'SAT' },
        { name: 'sunday', short: 'SUN' }
    ];

    // Load weekly data on mount or week selection change
    useEffect(() => {
        if (!weeklyData && !loading[`weekly-${weekKey}`]) {
            fetchWeekly(year, weekNumber);
        }
        // Reset AI coach state upon switching weeks
        setAiInsights(null);
        setAnalysisTriggered(false);
    }, [fetchWeekly, year, weekNumber, weeklyData, weekKey, loading]);

    // Navigation Handlers
    const handlePrevWeek = () => {
        setSelectedDate(prev => prev.subtract(1, 'week'));
    };

    const handleNextWeek = () => {
        setSelectedDate(prev => prev.add(1, 'week'));
    };

    const handleUpdate = (field, value) => {
        updateWeekly(year, weekNumber, { [field]: value });
    };

    const handlePriorityChange = (index, value) => {
        const newPriorities = [...(weeklyData?.priorities || ['', '', ''])];
        newPriorities[index] = value;
        handleUpdate('priorities', newPriorities);
    };

    const handleDayChange = (day, value) => {
        const newDays = { ...(weeklyData?.days || {}) };
        newDays[day] = value;
        handleUpdate('days', newDays);
    };

    // Helper functions for Ritual adjustments (saving real-time drafts)
    const handleRitualUpdate = (updatedFields) => {
        const currentRitual = weeklyData?.ritual || {
            isCompleted: false,
            completedAt: null,
            reflections: { wins: ['', '', ''], challenges: ['', '', ''], improvements: ['', '', ''] },
            grade: 0
        };
        handleUpdate('ritual', {
            ...currentRitual,
            ...updatedFields
        });
    };

    const handleRitualReflectionChange = (type, index, value) => {
        const currentRitual = weeklyData?.ritual || {
            isCompleted: false,
            completedAt: null,
            reflections: { wins: ['', '', ''], challenges: ['', '', ''], improvements: ['', '', ''] },
            grade: 0
        };
        const currentReflections = currentRitual.reflections || { wins: ['', '', ''], challenges: ['', '', ''], improvements: ['', '', ''] };
        const currentList = [...(currentReflections[type] || ['', '', ''])];
        currentList[index] = value;

        handleRitualUpdate({
            reflections: {
                ...currentReflections,
                [type]: currentList
            }
        });
    };

    const handleRitualGradeChange = (gradeValue) => {
        handleRitualUpdate({ grade: gradeValue });
    };

    // Executes final ritual completion
    const handleSealWeek = async () => {
        try {
            const currentRitual = weeklyData?.ritual || {
                isCompleted: false,
                completedAt: null,
                reflections: { wins: ['', '', ''], challenges: ['', '', ''], improvements: ['', '', ''] },
                grade: 0
            };
            await completeRitual('weekly', weekKey, currentRitual);
            toast.success('Strategic Record Sealed! Archive Secure.', {
                icon: '🔒',
                style: { background: '#000', color: '#fff', border: '1px solid #fff' }
            });
        } catch (err) {
            toast.error('Failed to seal the week.');
        }
    };

    // Reopens the sealed weekly log
    const handleReopenWeek = () => {
        handleRitualUpdate({ isCompleted: false, completedAt: null });
        toast('Strategic Record Reopened.', {
            icon: '🔓',
            style: { background: '#fff', color: '#000', border: '1px solid #e4e4e7' }
        });
    };

    // Synthesizes Weekly AI Coach coaching advice based on daily logs
    const handleCommenceAIAnalysis = async () => {
        setLoadingCoach(true);
        setAnalysisTriggered(true);
        try {
            const startOfWeekStr = startOfWeek.format('YYYY-MM-DD');
            const endOfWeekStr = startOfWeek.add(6, 'day').format('YYYY-MM-DD');
            const insights = await fetchGrowthCoachInsights(startOfWeekStr, endOfWeekStr);
            setAiInsights(insights);
            toast.success('AI Weekly Insights Synthesized!', {
                icon: '🧠',
                style: { background: '#fff', color: '#000', border: '1px solid #e4e4e7' }
            });
        } catch (err) {
            console.error(err);
            toast.error('Failed to analyze weekly logs.');
        } finally {
            setLoadingCoach(false);
        }
    };

    // Compute weekly progress score (Priorities: 45% + Needle Movers: 56% = max 100%)
    const progress = useMemo(() => {
        if (!weeklyData) return 0;
        const prioritiesCount = (weeklyData.priorities?.filter(p => p !== '').length || 0) * 15;
        const daysCount = (Object.values(weeklyData.days || {}).filter(d => d === 'completed').length || 0) * 8;
        return Math.min(100, prioritiesCount + daysCount);
    }, [weeklyData]);

    if (loading[`weekly-${weekKey}`] || !weeklyData) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Loading Command Center...</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 md:space-y-12 bg-transparent min-h-screen text-foreground pb-24 md:pb-32"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 md:pb-8 border-b-2 border-border/30">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Weekly Architecture</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase">Command<span className="text-muted-foreground/20">.Center</span></h1>
                </div>
                <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-4 bg-card p-1.5 sm:p-2 rounded-2xl border border-border w-full md:w-auto">
                    <button 
                        onClick={handlePrevWeek}
                        className="p-1.5 sm:p-2 hover:bg-secondary/40 rounded-xl transition-all active:scale-90 text-foreground flex items-center justify-center"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="px-2 sm:px-4 text-[10px] sm:text-xs md:text-sm font-black tracking-widest min-w-[120px] sm:min-w-[160px] text-center text-foreground uppercase">
                        {startOfWeek.format('MMM DD')} — {startOfWeek.add(6, 'day').format('MMM DD')}
                    </div>
                    <button 
                        onClick={handleNextWeek}
                        className="p-1.5 sm:p-2 hover:bg-secondary/40 rounded-xl transition-all active:scale-90 text-foreground flex items-center justify-center"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            {/* Global Weekly Progress Bar */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-foreground" />
                        <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Weekly Performance Meter</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="h-4 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/50 p-0.5 shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary rounded-full"
                    />
                </div>
            </div>

            {/* Advanced AI Weekly Performance Coach */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-foreground animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">AI Weekly Performance Review</span>
                    </div>
                </div>
                
                <Card className="bg-card border border-border shadow-sm rounded-[24px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden p-4 sm:p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        {!analysisTriggered ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-6 text-center space-y-4"
                            >
                                <div className="p-4 bg-secondary/20 border border-border/50 rounded-full text-muted-foreground/80">
                                    <Sparkles className="w-8 h-8 animate-pulse text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black uppercase tracking-wider text-sm">Unlock Statistical Coaching</h3>
                                    <p className="text-xs text-muted-foreground/60 max-w-md">Commence AI analysis of your daily habits, energy patterns, and screen time logs for this week.</p>
                                </div>
                                <button 
                                    onClick={handleCommenceAIAnalysis}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground hover:bg-primary/95 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Brain className="w-4 h-4" /> Commence Strategic AI Analysis
                                </button>
                            </motion.div>
                        ) : loadingCoach ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-10 text-center space-y-6"
                            >
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <div className="absolute inset-0 border-4 border-secondary border-t-primary rounded-full animate-spin" />
                                    <Terminal className="w-5 h-5 text-foreground animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Running Diagnostic Script...</span>
                                    <h3 className="font-black text-base uppercase tracking-widest text-foreground">Synthesizing Habit Signals</h3>
                                </div>
                            </motion.div>
                        ) : aiInsights ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl transition-all duration-500 text-left border-2
                                ${aiInsights.status === 'positive' 
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 shadow-sm' 
                                    : aiInsights.status === 'alert' 
                                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-505 shadow-sm' 
                                    : 'bg-secondary/10 border-border text-foreground shadow-sm'}`}
                            >
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className={`w-4 h-4 ${aiInsights.status === 'positive' ? 'text-emerald-500' : aiInsights.status === 'alert' ? 'text-amber-500' : 'text-foreground'}`} />
                                        <span className="text-[10px] font-mono font-black uppercase tracking-widest opacity-60">AI Strategy Advisory</span>
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tight text-foreground">{aiInsights.headline}</h4>
                                    <p className="font-serif text-sm italic leading-relaxed opacity-90">
                                        "{aiInsights.coachingText}"
                                    </p>
                                </div>
                                {aiInsights.actionItem && (
                                    <div className="md:max-w-xs w-full bg-card border border-border p-5 rounded-2xl shadow-sm text-left flex flex-col gap-2 flex-shrink-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-primary" /> Recommended Action</span>
                                        <p className="text-xs font-bold text-foreground leading-relaxed">{aiInsights.actionItem}</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="text-center py-6 text-xs font-mono text-muted-foreground">No logs detected for analysis.</div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>

            {/* Core Strategy Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {/* Theme (Input Zone) */}
                <Card className="bg-card border border-border shadow-sm rounded-[24px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all">
                    <CardHeader className="p-4 sm:p-6 md:p-8 pb-2 sm:pb-3">
                        <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Operational Theme</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 md:p-8 pt-0">
                        <input
                            type="text"
                            placeholder="State week theme..."
                            value={weeklyData.theme || ''}
                            onChange={(e) => handleUpdate('theme', e.target.value)}
                            className="w-full text-xl sm:text-2xl md:text-3xl font-black bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/30 text-foreground tracking-tighter"
                        />
                    </CardContent>
                </Card>

                {/* Triple Vector Focus */}
                <Card className="bg-card border border-border shadow-sm rounded-[24px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all">
                    <CardHeader className="p-4 sm:p-6 md:p-8 pb-2 sm:pb-3">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Triple Vector Focus</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 md:p-8 pt-0 space-y-3 sm:space-y-4">
                        {[0, 1, 2].map(idx => (
                            <div key={idx} className="flex items-center gap-3 sm:gap-4">
                                <span className="text-[10px] sm:text-[11px] font-mono font-black text-muted-foreground/30">0{idx+1}</span>
                                <input
                                    type="text"
                                    placeholder={`Strategic Goal ${idx + 1}...`}
                                    value={weeklyData.priorities?.[idx] || ''}
                                    onChange={(e) => handlePriorityChange(idx, e.target.value)}
                                    className="flex-1 bg-transparent border-none text-xs sm:text-sm md:text-base font-black focus:outline-none placeholder:text-muted-foreground/20 text-foreground"
                                />
                                <div className={`w-3 h-3 rounded-full border-2 border-border transition-all ${weeklyData.priorities?.[idx] ? 'bg-primary border-primary scale-110 shadow-[0_0_8px_#10b981]' : ''}`} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Operational Reflections & Core Wins */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {/* Win of the Week */}
                <Card className="bg-card border border-border shadow-sm rounded-[24px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all">
                    <CardHeader className="p-4 sm:p-6 md:p-8 pb-2 sm:pb-3">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-muted-foreground group-hover:text-foreground animate-bounce" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Win of the Week</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 md:p-8 pt-0">
                        <textarea
                            placeholder="Document the primary catalyst and crown accomplishment of this weekly iteration..."
                            value={weeklyData.winOfTheWeek || ''}
                            onChange={(e) => handleUpdate('winOfTheWeek', e.target.value)}
                            rows={3}
                            className="w-full text-xs sm:text-sm sm:text-base font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/20 text-foreground resize-none leading-relaxed"
                        />
                    </CardContent>
                </Card>

                {/* Weekly Review Notes */}
                <Card className="bg-card border border-border shadow-sm rounded-[24px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all">
                    <CardHeader className="p-4 sm:p-6 md:p-8 pb-2 sm:pb-3">
                        <div className="flex items-center gap-3">
                            <Bookmark className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Tactical Observations & Review</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 md:p-8 pt-0">
                        <textarea
                            placeholder="Synthesize general reflections, friction points, or core operational notes..."
                            value={weeklyData.reflection || ''}
                            onChange={(e) => handleUpdate('reflection', e.target.value)}
                            rows={3}
                            className="w-full text-xs sm:text-sm font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/20 text-foreground resize-none leading-relaxed"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Needle Mover Checkpoints */}
            <Card className="bg-card border border-border shadow-sm rounded-[24px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden">
                <CardHeader className="p-4 sm:p-6 md:p-10 pb-3 md:pb-6 border-b border-border bg-secondary/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-foreground" />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Daily Needle Movers</span>
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground/45 uppercase tracking-widest">Tap if you hit a big rock</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-5 divide-x divide-border md:divide-x-2">
                        {daysOfWeek.slice(0, 5).map((day) => {
                            const isDone = weeklyData.days?.[day.name] === 'completed';
                            return (
                                <div 
                                    key={day.name} 
                                    onClick={() => handleDayChange(day.name, isDone ? '' : 'completed')}
                                    className={`p-2 sm:p-6 md:p-10 group cursor-pointer transition-all flex flex-col items-center justify-center gap-2 sm:gap-4 md:gap-6 min-h-[90px] sm:min-h-[120px] md:min-h-[160px] ${isDone ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary/40 text-foreground'}`}
                                >
                                    <span className={`text-[9px] sm:text-[11px] font-black tracking-widest ${isDone ? 'text-white/40' : 'text-muted-foreground/75 group-hover:text-foreground'}`}>{day.short}</span>
                                    <div className={`w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-white border-white scale-105 sm:scale-110' : 'bg-transparent border-border group-hover:border-primary/40'}`}>
                                        <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${isDone ? 'text-primary' : 'text-muted-foreground/30 group-hover:text-muted-foreground/60'}`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Strategic Hub */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {/* System Cooling */}
                <Card className="xl:col-span-1 bg-card border border-border rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-sm p-4 sm:p-6 md:p-10 flex flex-col justify-center gap-4 sm:gap-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground">System Cooling</span>
                        <BatteryFull className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                        {daysOfWeek.slice(5).map((day) => {
                            const isDone = weeklyData.days?.[day.name] === 'completed';
                            return (
                                <div 
                                    key={day.name} 
                                    onClick={() => handleDayChange(day.name, isDone ? '' : 'completed')}
                                    className={`flex-1 h-24 sm:h-32 rounded-[16px] sm:rounded-[28px] border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 ${isDone ? 'bg-primary border-primary text-primary-foreground shadow-sm' : 'bg-secondary/20 border-border/40 hover:border-primary/50 text-muted-foreground hover:text-foreground'}`}
                                >
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{day.name.slice(0, 3)}</span>
                                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isDone ? 'bg-white animate-pulse' : 'bg-secondary/60'}`} />
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Weekly Ritual Chamber */}
                <Card className="xl:col-span-2 bg-zinc-950 border border-zinc-800 shadow-xl rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-4 sm:p-6 md:p-10 text-white relative overflow-hidden group">
                    {/* Sealed State */}
                    {weeklyData.ritual?.isCompleted ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col justify-between gap-4 sm:gap-6"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                                        <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-emerald-400">Strategic Record Sealed</span>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Week Reflected & Archived</h3>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono font-black tracking-widest text-white border-white/20 bg-white/5 py-1 px-3 flex items-center gap-2 rounded-full">
                                    <Lock className="w-3.5 h-3.5" /> Performance: {weeklyData.ritual?.grade || 0}/10
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 my-2 text-left">
                                <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Wins Logged</span>
                                    <ul className="text-xs space-y-1.5 opacity-80 list-disc list-inside">
                                        {weeklyData.ritual?.reflections?.wins?.filter(w => w.trim()).map((w, i) => <li key={i}>{w}</li>) || <li>None recorded.</li>}
                                    </ul>
                                </div>
                                <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Friction Faced</span>
                                    <ul className="text-xs space-y-1.5 opacity-80 list-disc list-inside">
                                        {weeklyData.ritual?.reflections?.challenges?.filter(c => c.trim()).map((c, i) => <li key={i}>{c}</li>) || <li>None recorded.</li>}
                                    </ul>
                                </div>
                                <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">Tactical Tuning</span>
                                    <ul className="text-xs space-y-1.5 opacity-80 list-disc list-inside">
                                        {weeklyData.ritual?.reflections?.improvements?.filter(imp => imp.trim()).map((imp, i) => <li key={i}>{imp}</li>) || <li>None recorded.</li>}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/10">
                                <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Completed: {dayjs(weeklyData.ritual?.completedAt).format('MMM DD, YYYY HH:mm')}</span>
                                <button 
                                    onClick={handleReopenWeek}
                                    className="w-full sm:w-auto px-4 py-2 border border-white/20 hover:border-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 hover:bg-white/5"
                                >
                                    <Unlock className="w-3.5 h-3.5" /> Reopen Strategic Log
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        /* Active State / Sealing Form */
                        <div className="space-y-4 sm:space-y-6 flex flex-col justify-between h-full">
                            <div className="space-y-1 text-left">
                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-white animate-bounce" /> Weekly Reflection Ritual
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Strategic Archival Chamber</h3>
                            </div>

                            {/* Ritual Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 my-2 text-left">
                                {/* Wins */}
                                <div className="space-y-3 bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-900">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">✓ Core Victories</span>
                                    {[0, 1, 2].map(idx => (
                                        <input 
                                            key={idx}
                                            type="text"
                                            placeholder={`Victory 0${idx+1}...`}
                                            value={weeklyData.ritual?.reflections?.wins?.[idx] || ''}
                                            onChange={(e) => handleRitualReflectionChange('wins', idx, e.target.value)}
                                            className="w-full bg-white/5 border-none rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder:text-zinc-500 focus:bg-white/10"
                                        />
                                    ))}
                                </div>

                                {/* Challenges */}
                                <div className="space-y-3 bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-900">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">⚠️ Strategic Friction</span>
                                    {[0, 1, 2].map(idx => (
                                        <input 
                                            key={idx}
                                            type="text"
                                            placeholder={`Friction 0${idx+1}...`}
                                            value={weeklyData.ritual?.reflections?.challenges?.[idx] || ''}
                                            onChange={(e) => handleRitualReflectionChange('challenges', idx, e.target.value)}
                                            className="w-full bg-white/5 border-none rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder:text-zinc-500 focus:bg-white/10"
                                        />
                                    ))}
                                </div>

                                {/* Improvements */}
                                <div className="space-y-3 bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-900">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-1.5">⚙ Operational Tuning</span>
                                    {[0, 1, 2].map(idx => (
                                        <input 
                                            key={idx}
                                            type="text"
                                            placeholder={`Action Plan 0${idx+1}...`}
                                            value={weeklyData.ritual?.reflections?.improvements?.[idx] || ''}
                                            onChange={(e) => handleRitualReflectionChange('improvements', idx, e.target.value)}
                                            className="w-full bg-white/5 border-none rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder:text-zinc-500 focus:bg-white/10"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Grade Slider & Sealing Actions */}
                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4 border-t border-zinc-900">
                                {/* Performance Grade Row */}
                                <div className="space-y-2 text-left w-full lg:w-auto">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Performance Index Grade</span>
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                                            const isSelected = (weeklyData.ritual?.grade || 0) === val;
                                            return (
                                                <button 
                                                    key={val}
                                                    onClick={() => handleRitualGradeChange(val)}
                                                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs font-mono font-black flex items-center justify-center transition-all duration-300 border active:scale-90
                                                    ${isSelected 
                                                        ? 'bg-white text-black border-white shadow-lg scale-110' 
                                                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-700'}`}
                                                >
                                                    {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Commit Sealing */}
                                <button 
                                    onClick={handleSealWeek}
                                    className="w-full lg:w-auto px-5 py-3 sm:px-6 sm:py-4 bg-white text-black hover:bg-zinc-100 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 lg:scale-[1.02] flex-shrink-0"
                                >
                                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black animate-pulse" /> Seal Strategic Record
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </motion.div>
    );
};

export default WeeklyPlanner;
