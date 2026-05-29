import { useEffect, useState, useMemo } from 'react';
import { usePlanner } from '../../provider/PlannerProvider';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar as CalIcon, Activity, Wallet, ChevronLeft, ChevronRight,
    Layers, Zap, Bookmark, BookOpen, Clock, Flame
} from 'lucide-react';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

function PlannerCalendar() {
    const { fetchCalendar, fetchTrajectory } = usePlanner();
    const [calendarData, setCalendarData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [trajectory, setTrajectory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    
    // Track the end of our current 6-month view
    const [viewEndDate, setViewEndDate] = useState(dayjs().endOf('month'));

    const startDateObj = useMemo(() => viewEndDate.clone().subtract(5, 'month').startOf('month'), [viewEndDate]);
    const endDateObj = useMemo(() => viewEndDate.clone().endOf('month'), [viewEndDate]);
    
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetchCalendar(
                    startDateObj.format('YYYY-MM-DD'),
                    endDateObj.format('YYYY-MM-DD')
                );
                if (response && typeof response === 'object' && response.data) {
                    setCalendarData(response.data);
                    setSummary(response.summary);
                } else {
                    setCalendarData(response || {});
                    setSummary(null);
                }

                const trajectoryResponse = await fetchTrajectory(
                    startDateObj.format('YYYY-MM-DD'),
                    endDateObj.format('YYYY-MM-DD')
                );
                setTrajectory(trajectoryResponse || null);
            } catch (err) {
                setError(err?.message || 'Failed to load calendar data');
                setCalendarData({});
                setSummary(null);
                setTrajectory(null);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchCalendar, fetchTrajectory, startDateObj, endDateObj]);

    // REVERSED: Most recent month first
    const months = useMemo(() => {
        const m = [];
        for (let i = 0; i <= 5; i++) {
            m.push(endDateObj.clone().subtract(i, 'month'));
        }
        return m;
    }, [endDateObj]);

    const shiftView = (offset) => {
        setViewEndDate(prev => prev.clone().add(offset * 3, 'month').endOf('month'));
    };

    const trendDays = useMemo(() => {
        if (!Array.isArray(trajectory?.daily)) return [];
        return trajectory.daily.slice(-14);
    }, [trajectory]);

    const renderMonthGrid = (monthObj) => {
        const year = monthObj.year();
        const month = monthObj.month();
        
        const daysInMonth = monthObj.daysInMonth();
        const firstDayOfWeek = dayjs(`${year}-${month + 1}-01`).day(); 
        
        const emptyCellsBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        
        const gridDays = [];
        for (let i = 0; i < emptyCellsBefore; i++) {
            gridDays.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = dayjs(`${year}-${month + 1}-${i}`).format('YYYY-MM-DD');
            gridDays.push(dateStr);
        }

        return (
            <Card key={monthObj.format('YYYY-MM')} className="bg-transparent border-none shadow-none pb-12">
                <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between border-b border-border/50 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-primary shadow-inner">
                            <CalIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">{monthObj.format('MMMM')}</h2>
                            <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground opacity-30 leading-none uppercase">Archival Interval // {year}</span>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="px-0 pt-0">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1.5 md:gap-3 mb-2 md:mb-4 text-center">
                        {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(day => (
                            <div key={day} className="text-[10px] font-black text-muted-foreground opacity-40 tracking-widest">{day}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5 md:gap-3">
                        {gridDays.map((dateStr, idx) => {
                            if (!dateStr) {
                                return <div key={`empty-${idx}`} className="h-20 md:h-32 rounded-xl md:rounded-2xl bg-muted/5 border border-dashed border-border/20" />;
                            }

                            const dData = calendarData?.[dateStr] || {};
                            const isToday = dayjs().format('YYYY-MM-DD') === dateStr;
                            const isPastOrToday = dayjs(dateStr).isBefore(dayjs(), 'day') || isToday;
                            const completion = dData.completionPercent || 0;
                            const hasGrowth = dData.hasGrowth;
                            const hasNoReels = dData.noReels;
                            const hasBudget = dData.hasBudget;
                            const hasNotebook = dData.notebookUpdateCount > 0;
                            const hasHighScreenTime = dData.highScreenTime || Number(dData.screenTime || 0) > 180;

                            return (
                                <div 
                                    key={dateStr} 
                                    className={`group relative flex flex-col p-1 sm:p-2 md:p-4 h-20 md:h-32 rounded-xl md:rounded-2xl border transition-all ${
                                        isToday 
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20' 
                                        : 'border-border/60 bg-secondary/10 hover:border-primary/30 hover:bg-secondary/20'
                                    } ${isPastOrToday ? 'cursor-pointer' : 'cursor-default'}`}
                                    onClick={() => {
                                        if (!isPastOrToday) return;
                                        setSelectedDate({ date: dateStr, data: dData });
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-0.5 md:mb-2">
                                        <span className={`text-[10px] sm:text-xs font-black font-mono transition-opacity ${isToday ? 'text-primary' : 'text-muted-foreground group-hover:opacity-100 opacity-60'}`}>
                                            {dayjs(dateStr).format('DD')}
                                        </span>
                                        {isToday && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary animate-pulse" />}
                                    </div>
                                    
                                    <div className="flex flex-col gap-0.5 md:gap-2 mt-auto">
                                        {/* Performance Matrix */}
                                        {dData.hasDaily && (
                                            <div className="space-y-1 hidden md:block">
                                                <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary transition-all duration-1000" 
                                                        style={{ width: `${completion}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center px-0.5">
                                                     <span className="text-[8px] font-black uppercase text-muted-foreground opacity-30">Efficiency</span>
                                                     <span className="text-[8px] font-mono font-bold opacity-40">{completion}%</span>
                                                 </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 md:gap-2 h-auto md:h-4 mt-auto justify-center md:justify-start overflow-hidden max-h-[16px] md:max-h-none">
                                            {hasNoReels && (
                                                <Activity className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-emerald-500 opacity-60 flex-shrink-0" title="No Reels Streak" />
                                            )}
                                            {hasGrowth && (
                                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 opacity-70 flex-shrink-0" title="Growth Log" />
                                            )}
                                            {hasBudget && (
                                                <Wallet className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-amber-500 opacity-60 flex-shrink-0" title="Budget Entry" />
                                            )}
                                            {hasHighScreenTime && (
                                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 opacity-80 flex-shrink-0" title="High Screen Time (>180m)" />
                                            )}
                                            {hasNotebook && (
                                                <BookOpen className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-blue-500 opacity-60 flex-shrink-0" title="Notebook Updated" />
                                            )}
                                            {dData.hasDaily && (
                                                <Bookmark className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-primary opacity-60 flex-shrink-0" title="Daily Plan" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-6 space-y-12 font-sans"
        >
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary">Spatial Timeline</Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">V.4.0 // ENHANCED STREAM</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">Mission Timeline</h1>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        Consolidated Longitudinal Temporal Buffer — Latest First
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Navigation Cluster */}
                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border shadow-sm">
                        <Button 
                            variant="ghost" size="icon" className="h-9 w-9 rounded-lg"
                            onClick={() => shiftView(-1)}
                        >
                            <ChevronLeft className="w-4 h-4 opacity-40" />
                        </Button>
                        <Separator orientation="vertical" className="h-4 mx-1" />
                        <div className="px-4 py-0.5 text-[10px] font-black text-primary uppercase tracking-widest cursor-default min-w-[120px] text-center">
                            {startDateObj.format('MMM YY')} — {endDateObj.format('MMM YY')}
                        </div>
                        <Separator orientation="vertical" className="h-4 mx-1" />
                        <Button 
                            variant="ghost" size="icon" className="h-9 w-9 rounded-lg"
                            onClick={() => shiftView(1)}
                        >
                            <ChevronRight className="w-4 h-4 opacity-40" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Insights Ribbon */}
            {summary && (
                <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2">
                    <div className="min-w-[220px] p-4 rounded-2xl bg-secondary/10 border border-border/50 flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Avg Efficiency</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-foreground">{summary.avgProductivity}/10</span>
                            <Zap className="w-3.5 h-3.5 text-primary" />
                        </div>
                    </div>
                    <div className="min-w-[220px] p-4 rounded-2xl bg-secondary/10 border border-border/50 flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Focus Depth</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-foreground">{summary.totalDeepWorkHours}h</span>
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                    </div>
                    <div className="min-w-[220px] p-4 rounded-2xl bg-secondary/10 border border-border/50 flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Financial Burn</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-foreground">${summary.totalSpent.toLocaleString()}</span>
                            <Wallet className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                    </div>
                    <div className="min-w-[220px] p-4 rounded-2xl bg-secondary/10 border border-border/50 flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Logs Captured</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-foreground">{summary.totalGrowthLogs}</span>
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                    </div>
                    <div className="min-w-[220px] p-4 rounded-2xl bg-secondary/10 border border-border/50 flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Risk Clusters</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-foreground">{summary.highScreenTimeClusterDays || 0}</span>
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                        </div>
                    </div>
                </div>
            )}

            {trajectory?.trend && (
                <div className="rounded-[24px] sm:rounded-[32px] md:rounded-[40px] border border-border/50 bg-secondary/10 p-5 sm:p-8 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wider">Trajectory Model</h3>
                            <p className="text-xs text-muted-foreground">Recent trend from rollup + event stream</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span>Prod: {trajectory.trend.avgProductivity}/10</span>
                            <span>Screen: {trajectory.trend.avgScreenTime}m</span>
                            <span>No-Reels Rate: {Math.round(Number(trajectory.trend.noReelsRate || 0) * 100)}%</span>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Productivity (14 days)</p>
                            <div className="h-20 flex items-end gap-1">
                                {trendDays.map((d) => (
                                    <div
                                        key={`${d.date}-p`}
                                        className={`flex-1 rounded-t ${trajectory.confidence === 'low' ? 'bg-primary/35' : 'bg-primary/70'}`}
                                        style={{ height: `${Math.max(8, Number(d.productivityScore || 0) * 10)}%` }}
                                        title={`${d.date} — ${d.productivityScore ?? 0}/10`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Screen Time (14 days)</p>
                            <div className="h-20 flex items-end gap-1">
                                {trendDays.map((d) => {
                                    const minutes = Number(d.screenTime || 0);
                                    const color = trajectory.confidence === 'low'
                                        ? (minutes > 180 ? 'bg-red-500/45' : 'bg-blue-500/40')
                                        : (minutes > 180 ? 'bg-red-500/80' : 'bg-blue-500/70');
                                    return (
                                        <div
                                            key={`${d.date}-s`}
                                            className={`flex-1 rounded-t ${color}`}
                                            style={{ height: `${Math.max(8, Math.min(100, Math.round((minutes / 240) * 100)))}%` }}
                                            title={`${d.date} — ${minutes}m`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {trajectory.coachSummary && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] uppercase tracking-wider text-primary/80 font-bold">Coach Note</p>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] uppercase tracking-wider ${
                                        trajectory.confidence === 'high'
                                            ? 'border-emerald-500/60 text-emerald-500'
                                            : trajectory.confidence === 'medium'
                                                ? 'border-amber-500/60 text-amber-500'
                                                : 'border-zinc-500/60 text-zinc-400'
                                    }`}
                                >
                                    {trajectory.confidence || 'low'} confidence
                                </Badge>
                            </div>
                            <p className="text-sm mt-1">{trajectory.coachSummary}</p>
                            {trajectory.deltas && (
                                <p
                                    className={`text-[11px] mt-2 ${
                                        trajectory.confidence === 'low'
                                            ? 'text-muted-foreground/60'
                                            : 'text-muted-foreground'
                                    }`}
                                >
                                    Delta vs previous week: Prod {trajectory.deltas.productivityDelta >= 0 ? '+' : ''}{trajectory.deltas.productivityDelta},
                                    Screen {trajectory.deltas.screenTimeDelta >= 0 ? '+' : ''}{trajectory.deltas.screenTimeDelta}m,
                                    No-Reels {Math.round((trajectory.deltas.noReelsRateDelta || 0) * 100)} pts
                                </p>
                            )}
                            {trajectory.coverage && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Data coverage: {trajectory.coverage.recentLoggedDays}/{trajectory.coverage.maxWindowDays} recent days,{' '}
                                    {trajectory.coverage.previousLoggedDays}/{trajectory.coverage.maxWindowDays} previous days.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="space-y-12">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-8 animate-pulse">
                            <div className="h-12 w-48 bg-muted rounded-xl" />
                            <div className="grid grid-cols-7 gap-3">
                                {[...Array(35)].map((_, j) => (
                                    <div key={j} className="h-32 bg-secondary/10 border border-border/20 rounded-2xl" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {months.map(month => (
                                <motion.div
                                    key={month.format('YYYY-MM')}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {renderMonthGrid(month)}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            )}
            
            {/* Extended Visual Legend */}
            <div className="pt-8 border-t border-border flex flex-wrap gap-8 justify-center opacity-60">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Plan</span>
                </div>
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Habit</span>
                </div>
                <div className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Budget</span>
                </div>
                <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Notebook</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Screen Time Risk</span>
                </div>
            </div>

            <Dialog open={Boolean(selectedDate)} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedDate ? dayjs(selectedDate.date).format('dddd, MMMM D, YYYY') : 'Day Summary'}</DialogTitle>
                        <DialogDescription>
                            Quick drilldown snapshot from planner streams.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDate && (
                        <div className="space-y-3 text-sm">
                            <div className="rounded-lg border border-border p-3">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Top Task</div>
                                <div className="mt-1 font-medium">{selectedDate.data?.topTask || 'No top task logged'}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border p-3">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Productivity</div>
                                    <div className="mt-1 font-semibold">{selectedDate.data?.productivityScore ?? '—'}</div>
                                </div>
                                <div className="rounded-lg border border-border p-3">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">No Reels</div>
                                    <div className="mt-1 font-semibold">
                                        {typeof selectedDate.data?.noReels === 'boolean'
                                            ? (selectedDate.data.noReels ? 'Yes' : 'No')
                                            : 'Not logged'}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border p-3 col-span-2">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Screen Time</div>
                                    <div className="mt-1 font-semibold">
                                        {typeof selectedDate.data?.screenTime === 'number'
                                            ? `${selectedDate.data.screenTime} minutes`
                                            : 'Not logged'}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border p-3 col-span-2">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Next Best Action</div>
                                    <div className="mt-1 font-semibold">
                                        {selectedDate.data?.nextBestAction || 'Log your growth check-in'}
                                    </div>
                                </div>
                            </div>
                            {Array.isArray(selectedDate.data?.tags) && selectedDate.data.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedDate.data.tags.map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-[10px] uppercase tracking-wider">
                                            {tag.replaceAll('-', ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

export default PlannerCalendar;
