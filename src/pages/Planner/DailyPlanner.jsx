import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePlanner } from '../../provider/PlannerProvider';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, closestCenter, MouseSensor, TouchSensor,
    useSensor, useSensors
} from '@dnd-kit/core';
import {
    SortableContext, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable';
import { ChevronLeft, ChevronRight, Star, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import SkeletonLoader from '../../components/ui/SkeletonLoader';

import IntentionWall from '../../components/planner/IntentionWall';
import CompletionRing from '../../components/planner/CompletionRing';
import TimeBlock from '../../components/planner/TimeBlock';

const defaultSchedule = Array.from({ length: 18 }, (_, i) => ({
    time: `${String(i + 6).padStart(2, '0')}:00`,
    task: '',
    done: false
}));

function DailyPlanner() {
    const { data, fetchDaily, updateDaily, getDailyCompletion, getTodayDate, fetchDailyBriefing, optimizeDailySchedule } = usePlanner();
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [showIntentionWall, setShowIntentionWall] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    // AI Daily Briefing state
    const [briefing, setBriefing] = useState(null);
    const [loadingBrief, setLoadingBrief] = useState(false);
    const briefLoaded = useRef(false);

    // AI Optimizer state
    const [showOptimizer, setShowOptimizer] = useState(false);
    const [optimizerText, setOptimizerText] = useState('');
    const [optimizing, setOptimizing] = useState(false);

    const dateStr = currentDate.format('YYYY-MM-DD');
    const daily = data.daily[dateStr];
    const safeSchedule = daily?.schedule || defaultSchedule;

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    // Fetch briefing on mount
    useEffect(() => {
        if (briefLoaded.current) return;
        const loadBriefing = async () => {
            setLoadingBrief(true);
            try {
                const res = await fetchDailyBriefing();
                if (res) {
                    setBriefing(res);
                    briefLoaded.current = true;
                }
            } catch (err) {
                console.error("Failed to load daily briefing:", err);
            } finally {
                setLoadingBrief(false);
            }
        };
        loadBriefing();
    }, [fetchDailyBriefing]);

    // Load daily data when date changes
    useEffect(() => {
        fetchDaily(dateStr);
    }, [dateStr, fetchDaily]);

    // Show intention wall if today + no top task
    useEffect(() => {
        if (daily && dateStr === getTodayDate() && !daily.topTask && !showIntentionWall) {
            setShowIntentionWall(true);
        }
    }, [daily, dateStr, getTodayDate, showIntentionWall]);

    const handleIntentionSubmit = (task) => {
        setShowIntentionWall(false);
        updateDaily(dateStr, { topTask: task });
    };

    const handleSlotChange = useCallback((index, updatedSlot) => {
        if (!daily) return;
        const schedule = [...(daily.schedule || defaultSchedule)];
        schedule[index] = updatedSlot;
        updateDaily(dateStr, { schedule });
    }, [daily, dateStr, updateDaily]);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (!active || !over || active.id === over.id || !daily) return;

        const oldIndex = parseInt(active.id.replace('slot-', ''));
        const newIndex = parseInt(over.id.replace('slot-', ''));
        const currentSchedule = daily.schedule || defaultSchedule;
        const schedule = arrayMove(currentSchedule, oldIndex, newIndex);
        updateDaily(dateStr, { schedule });
    }, [daily, dateStr, updateDaily]);

    const goToDate = (offset) => setCurrentDate(d => d.add(offset, 'day'));
    const goToToday = () => setCurrentDate(dayjs());

    // Week strip dates (Mon-Sun of current week)
    const weekStart = currentDate.startOf('week').add(1, 'day'); // Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

    const completion = getDailyCompletion(dateStr);
    const isToday = dateStr === getTodayDate();

    if (!daily) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6">
                <SkeletonLoader type="daily" />
            </div>
        );
    }

    return (
        <>
            {showIntentionWall && <IntentionWall onSubmit={handleIntentionSubmit} />}

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-3xl mx-auto px-4 py-6 ${focusMode ? 'fixed inset-0 z-40 bg-background max-w-none flex flex-col items-center justify-center' : ''}`}
            >
                {/* Focus mode exit */}
                {focusMode && (
                    <button
                        onClick={() => setFocusMode(false)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ✕ Exit Focus
                    </button>
                )}

                {/* Week Strip */}
                {!focusMode && (
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => goToDate(-1)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>

                        <div className="flex gap-1.5 overflow-x-auto scrollbar-none snap-x px-2 max-w-full">
                            {weekDays.map(day => {
                                const dayStr = day.format('YYYY-MM-DD');
                                const isSelected = dayStr === dateStr;
                                const isDayToday = dayStr === getTodayDate();
                                return (
                                    <button
                                        key={dayStr}
                                        onClick={() => setCurrentDate(day)}
                                        className={`flex flex-col items-center min-w-[48px] snap-center px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all shrink-0 ${isSelected
                                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/5'
                                            : isDayToday
                                                ? 'bg-secondary text-secondary-foreground border border-primary/20'
                                                : 'hover:bg-accent text-muted-foreground bg-secondary/10'
                                            }`}
                                    >
                                        <span className="text-[9px] uppercase font-black opacity-60 tracking-wider">{day.format('ddd')}</span>
                                        <span className="text-sm font-black mt-0.5">{day.format('D')}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button onClick={() => goToDate(1)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                )}

                {/* Date Header + Completion Ring */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {currentDate.format('dddd, D MMMM')}
                        </h1>
                        {isToday && (
                            <span className="text-xs text-emerald-500 font-medium">Today</span>
                        )}
                        {!isToday && (
                            <button onClick={goToToday} className="text-xs text-primary hover:underline">
                                Jump to Today
                            </button>
                        )}
                    </div>
                    <CompletionRing percent={completion} size={70} />
                </div>

                {/* 🌅 OS MORNING DAILY BRIEFING PORTAL */}
                {loadingBrief ? (
                    <div className="p-5 bg-secondary/5 border border-border/40 rounded-3xl animate-pulse mb-6 space-y-2 text-left">
                        <div className="h-3 w-32 bg-muted rounded" />
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-full bg-muted rounded" />
                    </div>
                ) : briefing ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-5 border-2 rounded-[24px] mb-6 text-left relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 transition-all duration-300 shadow-sm
                        ${briefing.status === 'positive' 
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-800 shadow-[0_4px_20px_rgba(16,185,129,0.02)]' 
                            : briefing.status === 'warning' 
                            ? 'bg-amber-500/5 border-amber-500/10 text-amber-800 shadow-[0_4px_20px_rgba(245,158,11,0.02)]' 
                            : 'bg-secondary/5 border-border/50 text-zinc-900 shadow-none'}`}
                    >
                        <div className="space-y-1.5 flex-1 text-left relative z-10">
                            <span className={`text-[9px] font-black uppercase tracking-[0.25em] flex items-center gap-1.5 leading-none
                            ${briefing.status === 'positive' ? 'text-emerald-600' : briefing.status === 'warning' ? 'text-amber-600' : 'text-zinc-400'}`}>
                                ⚡ Daily OS Intel
                            </span>
                            <h3 className="text-sm font-black uppercase tracking-tight text-foreground">{briefing.headline}</h3>
                            <p className="font-serif text-xs md:text-sm leading-relaxed text-muted-foreground italic">
                                "{briefing.briefText}"
                            </p>
                        </div>
                        {briefing.advice && (
                            <div className="sm:max-w-[240px] w-full flex-shrink-0 flex flex-col gap-1 p-3 rounded-xl bg-background border border-border/60 shadow-sm text-left relative z-10">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Daily Focus Target</span>
                                <span className="text-xs font-bold text-foreground leading-normal">{briefing.advice}</span>
                            </div>
                        )}
                    </motion.div>
                ) : null}

                {/* ─── TOP TASK ─── */}
                <Card className={`mb-6 shadow-none border-border ${daily.topTask ? 'bg-primary/[0.03]' : 'bg-card/50'} ${focusMode ? 'max-w-xl w-full' : ''}`}>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                The ONE thing I must do today
                            </span>
                        </div>
                        <input
                            type="text"
                            value={daily.topTask || ''}
                            onChange={(e) => updateDaily(dateStr, { topTask: e.target.value })}
                            placeholder="What matters most?"
                            className={`w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30 ${focusMode ? 'text-3xl font-bold text-center' : 'text-xl font-bold'}`}
                        />
                    </CardContent>
                </Card>

                {/* ─── TIME BLOCKS ─── */}
                <div className={`mb-6 ${focusMode ? 'max-w-xl w-full' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            Schedule <Badge variant="secondary" className="font-mono text-[9px]">{safeSchedule.filter(s => s.done).length}/{safeSchedule.filter(s => s.task).length}</Badge>
                        </h2>
                        <div className="flex items-center gap-4">
                            {!focusMode && (
                                <button
                                    onClick={() => setShowOptimizer(prev => !prev)}
                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all cursor-pointer"
                                >
                                    🪄 Auto-Schedule
                                </button>
                            )}
                            {!focusMode && (
                                <button
                                    onClick={() => setFocusMode(true)}
                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Maximize2 className="w-3 h-3" />
                                    Focus
                                </button>
                            )}
                        </div>
                    </div>

                    {/* AI Daily Optimizer Brain-Dump Drawer */}
                    <AnimatePresence>
                        {showOptimizer && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mb-4"
                            >
                                <div className="p-4 bg-secondary/5 border-2 border-border/55 rounded-2xl space-y-3 text-left">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">AI Time-Block Brain Dump</span>
                                    <textarea
                                        value={optimizerText}
                                        onChange={(e) => setOptimizerText(e.target.value)}
                                        placeholder="Dump today's chaotic list (e.g. Study React for 3 hrs starting early, gym session around 5pm, grocery store trip after gym, cook dinner...)"
                                        rows={3}
                                        className="w-full text-xs font-medium bg-background border-2 border-border rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary resize-none placeholder:opacity-50"
                                        disabled={optimizing}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowOptimizer(false)}
                                            className="h-8 text-[9px] font-black uppercase tracking-wider"
                                            disabled={optimizing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={async () => {
                                                if (!optimizerText.trim()) return;
                                                setOptimizing(true);
                                                try {
                                                    const res = await optimizeDailySchedule(optimizerText.trim());
                                                    if (res && Array.isArray(res.schedule)) {
                                                        const updatedSchedule = res.schedule.map(slot => ({
                                                            time: slot.time,
                                                            task: slot.task || '',
                                                            done: false
                                                        }));
                                                        await updateDaily(dateStr, { schedule: updatedSchedule });
                                                        toast.success("AI Structured your schedule successfully!", { icon: '🪄' });
                                                        setOptimizerText('');
                                                        setShowOptimizer(false);
                                                    } else {
                                                        toast.error("Failed to generate optimized timeline.");
                                                    }
                                                } catch (err) {
                                                    console.error("Optimization failed:", err);
                                                    toast.error("AI scheduling connection issues.");
                                                } finally {
                                                    setOptimizing(false);
                                                }
                                            }}
                                            className="h-8 text-[9px] font-black uppercase tracking-wider bg-black text-white hover:bg-zinc-800"
                                            disabled={optimizing || !optimizerText.trim()}
                                        >
                                            {optimizing ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 border border-t-transparent border-white rounded-full animate-spin" />
                                                    Structuring...
                                                </div>
                                            ) : (
                                                "Optimize Timeline ⚡"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ScrollArea className={`${focusMode ? 'h-[50vh]' : 'h-[400px]'} pr-4 -mr-4`}>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={safeSchedule.map((_, i) => `slot-${i}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2 pb-10">
                                    {safeSchedule.map((slot, i) => (
                                        <TimeBlock
                                            key={`slot-${i}`}
                                            slot={slot}
                                            index={i}
                                            onChange={handleSlotChange}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </ScrollArea>
                </div>

                {/* Notes */}
                {!focusMode && (
                    <div className="mb-20 md:mb-6">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 font-serif italic">
                            Epilogue / Notes
                        </h2>
                        <textarea
                            value={daily.notes || ''}
                            onChange={(e) => updateDaily(dateStr, { notes: e.target.value })}
                            placeholder="Anything on your mind..."
                            rows={4}
                            className="w-full rounded-md border border-border bg-card/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary outline-none resize-none transition-all"
                        />
                    </div>
                )}
            </motion.div>
        </>
    );
}

export default DailyPlanner;
