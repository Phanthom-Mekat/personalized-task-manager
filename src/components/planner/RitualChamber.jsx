import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { 
    Zap, Target, Wallet, Brain, Star, CheckCircle, 
    ArrowRight, ArrowLeft, Send, X, Trophy, AlertCircle 
} from 'lucide-react';
import { usePlanner } from '../../provider/PlannerProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import toast from 'react-hot-toast';

const RitualChamber = ({ ritual, onClose }) => {
    const { completeRitual, data, fetchGrowthRange, fetchBudget, fetchGrowthCoachInsights } = usePlanner();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [isAiDrafting, setIsAiDrafting] = useState(false);
    const [isGeneratedByAi, setIsGeneratedByAi] = useState(false);

    useEffect(() => {
        if (!ritual) return;
        
        if (ritual.type === 'weekly') {
            const start = dayjs().year(ritual.data.year).week(ritual.data.weekNumber).startOf('week').format('YYYY-MM-DD');
            const end = dayjs().year(ritual.data.year).week(ritual.data.weekNumber).endOf('week').format('YYYY-MM-DD');
            fetchGrowthRange(start, end);
            fetchBudget(ritual.data.year, dayjs(start).month() + 1);
        } else {
            const start = dayjs().year(ritual.data.year).month(ritual.data.month - 1).startOf('month').format('YYYY-MM-DD');
            const end = dayjs().year(ritual.data.year).month(ritual.data.month - 1).endOf('month').format('YYYY-MM-DD');
            fetchGrowthRange(start, end);
            fetchBudget(ritual.data.year, ritual.data.month);
        }
    }, [ritual, fetchGrowthRange, fetchBudget]);

    const [form, setForm] = useState(() => {
        const existing = ritual?.data?.ritual;
        if (existing) {
            const reflections = existing.reflections || {};
            return {
                wins: reflections.wins && reflections.wins.length > 0 
                    ? [...reflections.wins, '', '', ''].slice(0, 3) 
                    : ['', '', ''],
                challenges: reflections.challenges && reflections.challenges.length > 0 
                    ? [...reflections.challenges, '', ''].slice(0, 2) 
                    : ['', ''],
                improvements: reflections.improvements && reflections.improvements.length > 0 
                    ? [...reflections.improvements, '', ''].slice(0, 2) 
                    : ['', ''],
                grade: existing.grade !== undefined ? existing.grade : 5
            };
        }
        return {
            wins: ['', '', ''],
            challenges: ['', ''],
            improvements: ['', ''],
            grade: 5
        };
    });

    useEffect(() => {
        if (!ritual) return;
        const existing = ritual.data?.ritual;
        if (existing) {
            const reflections = existing.reflections || {};
            setForm({
                wins: reflections.wins && reflections.wins.length > 0 
                    ? [...reflections.wins, '', '', ''].slice(0, 3) 
                    : ['', '', ''],
                challenges: reflections.challenges && reflections.challenges.length > 0 
                    ? [...reflections.challenges, '', ''].slice(0, 2) 
                    : ['', ''],
                improvements: reflections.improvements && reflections.improvements.length > 0 
                    ? [...reflections.improvements, '', ''].slice(0, 2) 
                    : ['', ''],
                grade: existing.grade !== undefined ? existing.grade : 5
            });
        }
    }, [ritual]);

    const stats = useMemo(() => {
        if (!ritual) return null;
        
        let periodDays = [];
        let budgetStatus = 'No Data';

        if (ritual.type === 'weekly') {
            const start = dayjs().year(ritual.data.year).week(ritual.data.weekNumber).startOf('week');
            periodDays = Array.from({ length: 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
            
            const budgetKey = `${ritual.data.year}-${start.month() + 1}`;
            const b = data.budget[budgetKey];
            if (b) {
                const totalPlanned = b.categories.reduce((acc, cat) => acc + (parseFloat(cat.planned) || 0), 0);
                const totalActual = b.categories.reduce((acc, cat) => acc + (parseFloat(cat.actual) || 0), 0);
                budgetStatus = totalActual > totalPlanned ? 'Over Budget' : 'On Track';
            }
        } else {
            const start = dayjs().year(ritual.data.year).month(ritual.data.month - 1).startOf('month');
            const daysInMonth = start.endOf('month').date();
            periodDays = Array.from({ length: daysInMonth }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
            
            const budgetKey = `${ritual.data.year}-${ritual.data.month}`;
            const b = data.budget[budgetKey];
            if (b) {
                const totalPlanned = b.categories.reduce((acc, cat) => acc + (parseFloat(cat.planned) || 0), 0);
                const totalActual = b.categories.reduce((acc, cat) => acc + (parseFloat(cat.actual) || 0), 0);
                budgetStatus = totalActual > totalPlanned ? 'Over Budget' : (totalActual > 0 ? 'Under Budget' : 'On Track');
            }
        }

        let totalProd = 0;
        let daysWithProd = 0;
        let habitWins = 0;

        periodDays.forEach(date => {
            const growth = data.growth[date];
            if (growth) {
                if (growth.productivityScore) {
                    totalProd += growth.productivityScore;
                    daysWithProd++;
                }
                if (growth.habits) {
                    habitWins += Object.values(growth.habits).filter(v => v === true).length;
                }
            }
        });

        const avgProd = daysWithProd > 0 ? (totalProd / daysWithProd).toFixed(1) : 0;

        return {
            productivity: Math.round(avgProd * 10),
            habits: habitWins,
            budget: budgetStatus
        };
    }, [ritual, data.growth, data.budget]);

    const periodDates = useMemo(() => {
        if (!ritual) return null;
        let start, end;
        if (ritual.type === 'weekly') {
            start = dayjs().year(ritual.data.year).week(ritual.data.weekNumber).startOf('week').format('YYYY-MM-DD');
            end = dayjs().year(ritual.data.year).week(ritual.data.weekNumber).endOf('week').format('YYYY-MM-DD');
        } else {
            start = dayjs().year(ritual.data.year).month(ritual.data.month - 1).startOf('month').format('YYYY-MM-DD');
            end = dayjs().year(ritual.data.year).month(ritual.data.month - 1).endOf('month').format('YYYY-MM-DD');
        }
        return { start, end };
    }, [ritual]);

    const handleUpdate = (field, idx, val) => {
        setForm(prev => {
            const newArr = [...prev[field]];
            newArr[idx] = val;
            return { ...prev, [field]: newArr };
        });
    };

    const handleQuickSeal = () => {
        setStep(4);
        toast("Reflections skipped. Select final grade to archive.", {
            icon: '⚡',
            style: { background: '#000', color: '#fff', border: '1px solid #fff' }
        });
    };

    const handleAiAutopilot = async () => {
        if (!periodDates) return;
        setIsAiDrafting(true);
        try {
            const insights = await fetchGrowthCoachInsights(periodDates.start, periodDates.end);
            
            // Build dynamic wins based on actual database stats
            const aiWins = [
                `✨ Focus Velocity: Achieved an average of ${stats.productivity}% productivity across this period.`,
                `⚡ Habit Consistency: Checked in ${stats.habits} disciplines and daily growth routines.`,
                `💳 Budget Velocity: Maintained strategic financial status at "${stats.budget.toLowerCase()}" levels.`
            ];

            // Build challenges & improvements based on AI growth coach analysis
            const aiChallenges = [
                `🔍 Friction Alert: ${insights?.headline || 'Minor focus friction logged.'}`,
                `⚠️ Growth Constraint: ${insights?.coachingText?.slice(0, 90) || 'Attention allocation and scrolling constraints detected.'}...`
            ];

            const aiImprovements = [
                `⚙️ Action Plan: ${insights?.actionItem || 'Optimize daily schedule blocks.'}`,
                `💡 Strategic Tuning: Lock screen-time limitations and schedule mindful recovery blocks.`
            ];

            // Suggested performance index grade
            const suggestedGrade = Math.min(10, Math.max(1, Math.round(stats.productivity / 10) + (stats.habits >= 5 ? 1 : 0)));

            setForm({
                wins: aiWins,
                challenges: aiChallenges,
                improvements: aiImprovements,
                grade: suggestedGrade
            });

            setIsGeneratedByAi(true);
            toast.success("AI Autopilot: Reflections compiled!", {
                icon: '🤖',
                style: { background: '#000', color: '#fff', border: '1px solid #fff' }
            });
            // Advance to Step 2 so they can review their generated wins
            setStep(2);
        } catch (err) {
            console.error(err);
            toast.error("AI synthesis failed. Logs may be empty.");
        } finally {
            setIsAiDrafting(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await completeRitual(ritual.type, ritual.key, {
                reflections: {
                    wins: form.wins.filter(w => w.trim()),
                    challenges: form.challenges.filter(c => c.trim()),
                    improvements: form.improvements.filter(i => i.trim()),
                },
                grade: form.grade
            });
            toast.success("Ritual Complete! Momentum unlocked. ✨", { duration: 5000, icon: '🔥' });
            onClose();
        } catch (err) {
            toast.error("Ritual failed. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!ritual) return null;

    const renderStep = () => {
        switch (step) {
            case 1: // Snapshot
                return (
                    <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 py-2 sm:py-4"
                    >
                        <div className="text-center mb-4 sm:mb-8">
                             <Badge variant="outline" className="mb-2 px-3 py-0.5 border-primary/30 text-primary font-mono tracking-widest text-[10px] uppercase">Review Period</Badge>
                             <h2 className="text-2xl sm:text-3xl font-black text-foreground">{ritual.type === 'weekly' ? `Week ${ritual.data.weekNumber}` : dayjs().month(ritual.data.month - 1).format('MMMM')}</h2>
                             <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1 opacity-60">Quantifying your existence</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <Card className="bg-secondary/20 shadow-none border-border group hover:border-primary/30 transition-all">
                                <CardContent className="p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 justify-between sm:justify-start">
                                    <div className="flex items-center sm:flex-col gap-2.5 sm:gap-0">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-0 sm:mb-3 shadow-inner">
                                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <span className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1">Productivity</span>
                                            <span className="text-lg sm:text-2xl font-mono font-bold block sm:hidden">{stats.productivity}%</span>
                                        </div>
                                    </div>
                                    <div className="w-24 sm:w-full text-right sm:text-center">
                                        <span className="text-lg sm:text-2xl font-mono font-bold hidden sm:block">{stats.productivity}%</span>
                                        <Progress value={stats.productivity} className="h-1 w-full mt-0 sm:mt-4 bg-muted" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-secondary/20 shadow-none border-border group hover:border-primary/30 transition-all">
                                <CardContent className="p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 justify-between sm:justify-start">
                                    <div className="flex items-center sm:flex-col gap-2.5 sm:gap-0">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-0 sm:mb-3 shadow-inner">
                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <span className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1">Habits</span>
                                            <span className="text-lg sm:text-2xl font-mono font-bold block sm:hidden">{stats.habits}</span>
                                        </div>
                                    </div>
                                    <div className="text-right sm:text-center">
                                        <span className="text-lg sm:text-2xl font-mono font-bold hidden sm:block">{stats.habits}</span>
                                        <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0 sm:mt-2 font-bold uppercase tracking-tighter opacity-45">Disciplines maintained</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-secondary/20 shadow-none border-border group hover:border-primary/30 transition-all">
                                <CardContent className="p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:text-center gap-3 sm:gap-0 justify-between sm:justify-start">
                                    <div className="flex items-center sm:flex-col gap-2.5 sm:gap-0">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-0 sm:mb-3 shadow-inner">
                                            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <span className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1">Budget</span>
                                            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest block sm:hidden">{stats.budget}</span>
                                        </div>
                                    </div>
                                    <div className="text-right sm:text-center">
                                        <span className="text-xs sm:text-xs font-mono font-bold uppercase tracking-widest hidden sm:block">{stats.budget}</span>
                                        <Badge variant={stats.budget.includes('Over') ? 'destructive' : 'secondary'} className="mt-0 sm:mt-3 font-mono text-[8px] sm:text-[9px] px-1.5 py-0">FISCAL STATUS</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Useful AI Autopilot Trigger Section */}
                        <div className="flex flex-col items-center p-5 bg-primary/5 border border-primary/20 rounded-[20px] text-center mt-6 gap-3">
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-primary animate-pulse" />
                                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-primary">Intelligent Archiving</span>
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Skip Manual Writing with AI Autopilot</h4>
                            <p className="text-[10px] sm:text-xs text-muted-foreground max-w-sm leading-relaxed">
                                Let the AI analyze your checked habits, energy logs, screen-time correlations, and financial budget velocity to auto-draft your Victory Logs and friction points!
                            </p>
                            <Button 
                                onClick={handleAiAutopilot} 
                                disabled={isAiDrafting}
                                className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 border-0 cursor-pointer mt-1"
                            >
                                {isAiDrafting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Analyzing database logs...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-3.5 h-3.5 text-white" />
                                        ✨ Activate AI Autopilot
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                );
            case 2: // Wins
                return (
                    <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 py-2 sm:py-4"
                    >
                         <div className="text-center mb-4 sm:mb-6">
                             {isGeneratedByAi && (
                                 <Badge className="bg-primary/20 text-primary border-primary/30 py-1 px-3 rounded-full text-[9px] uppercase tracking-widest font-black animate-pulse flex items-center justify-center gap-1.5 max-w-xs mx-auto mb-3 border">
                                     <Brain className="w-3.5 h-3.5" /> AI Autopilot Pre-filled
                                 </Badge>
                             )}
                             <div className="inline-flex p-2.5 sm:p-3 rounded-2xl bg-primary/10 text-primary mb-3 sm:mb-4 shadow-sm">
                                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
                             </div>
                             <h2 className="text-xl sm:text-2xl font-black text-foreground">The Victory Log</h2>
                             <p className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-widest opacity-40">What went right by design? (Optional)</p>
                         </div>

                         <div className="space-y-3">
                             {form.wins.map((win, idx) => (
                                 <div key={idx} className="relative group">
                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-black border-r border-border pr-3 opacity-20 group-focus-within:opacity-100 transition-opacity">0{idx + 1}</span>
                                     <input
                                         type="text" value={win}
                                         onChange={(e) => handleUpdate('wins', idx, e.target.value)}
                                         placeholder={`Victory ${idx + 1} (optional)...`}
                                         className="w-full pl-14 pr-4 py-2.5 sm:py-3.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-1 focus:ring-primary outline-none text-sm transition-all font-medium"
                                     />
                                 </div>
                             ))}
                         </div>
                    </motion.div>
                );
            case 3: // Challenges & Growth
                return (
                    <motion.div
                        key="step-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4 py-2"
                    >
                        <div>
                             {isGeneratedByAi && (
                                 <Badge className="bg-primary/20 text-primary border-primary/30 py-1 px-3 rounded-full text-[9px] uppercase tracking-widest font-black animate-pulse flex items-center justify-center gap-1.5 max-w-xs mx-auto mb-3 border">
                                     <Brain className="w-3.5 h-3.5" /> AI Autopilot Pre-filled
                                 </Badge>
                             )}
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 text-center">Friction & Impediments (Optional)</h3>
                            <div className="space-y-3 mb-6">
                                {form.challenges.map((c, idx) => (
                                    <textarea
                                        key={idx} value={c}
                                        onChange={(e) => handleUpdate('challenges', idx, e.target.value)}
                                        placeholder={`Critical friction ${idx + 1} (optional)...`}
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-1 focus:ring-primary outline-none text-sm resize-none transition-all font-medium"
                                    />
                                ))}
                            </div>

                            <Separator className="my-6 opacity-50" />

                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 text-center">Refined Protocols & Adjustments (Optional)</h3>
                            <div className="space-y-3">
                                {form.improvements.map((imp, idx) => (
                                    <textarea
                                        key={idx} value={imp}
                                        onChange={(e) => handleUpdate('improvements', idx, e.target.value)}
                                        placeholder={`Strategic tuning ${idx + 1} (optional)...`}
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-1 focus:ring-primary outline-none text-sm resize-none transition-all font-medium"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            case 4: // Grading
                return (
                    <motion.div
                        key="step-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center py-6 sm:py-10"
                    >
                        <div className="text-center mb-8 sm:mb-12">
                             {isGeneratedByAi && (
                                 <Badge className="bg-primary/20 text-primary border-primary/30 py-1 px-3 rounded-full text-[9px] uppercase tracking-widest font-black animate-pulse flex items-center justify-center gap-1.5 max-w-xs mx-auto mb-3 border">
                                     <Brain className="w-3.5 h-3.5" /> AI Recommended Score
                                 </Badge>
                             )}
                             <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-4 sm:mb-6 mx-auto shadow-sm ring-1 ring-primary/20">
                                <Brain className="w-8 h-8 sm:w-12 sm:h-12" />
                             </div>
                             <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-1.5 sm:mb-2">Final Evaluation</h2>
                             <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-40">Your absolute performance score</p>
                        </div>
                        
                        <div className="w-full max-w-xs space-y-6 sm:space-y-8">
                            <div className="flex flex-col items-center gap-4 sm:gap-6">
                                <span className={`text-6xl sm:text-8xl font-black font-mono transition-all ${form.grade >= 8 ? 'text-primary' : form.grade >= 5 ? 'text-foreground' : 'text-muted-foreground'}`}>{form.grade}</span>
                                <Slider 
                                    value={[form.grade]}
                                    onValueChange={([v]) => setForm(f => ({ ...f, grade: v }))}
                                    max={10} min={1} step={1}
                                    className="w-full"
                                />
                                <Badge variant="secondary" className="px-5 py-1 text-[10px] font-mono uppercase tracking-[0.3em] font-black">Grade Range [1-10]</Badge>
                            </div>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={!!ritual} onOpenChange={() => !submitting && onClose()}>
            <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col bg-background border-border shadow-2xl p-0 gap-0 overflow-hidden font-sans outline-none rounded-[24px] sm:rounded-[32px]">
                <DialogHeader className="p-4 sm:p-6 border-b border-border flex flex-row items-center justify-between gap-4 bg-muted/10 shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/10">
                            <Zap className="w-4 h-4 fill-current" />
                         </div>
                         <div>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest leading-none mb-1">
                                {ritual.type} Ritual initiated
                            </DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-black opacity-30 tracking-tighter">System Version 2.0.4 // Modern Zinc</DialogDescription>
                         </div>
                    </div>
                    <button 
                        onClick={() => !submitting && onClose()}
                        className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors active:scale-95 text-muted-foreground/60 hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </DialogHeader>

                <div className="p-4 sm:p-8 overflow-y-auto flex-1 min-h-[300px] sm:min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {renderStep()}
                    </AnimatePresence>
                </div>

                <div className="p-4 sm:p-6 border-t border-border bg-muted/5 flex items-center justify-between shrink-0">
                    <div className="flex gap-1.2 sm:gap-1.5">
                        {[1, 2, 3, 4].map(idx => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${step === idx ? 'w-8 sm:w-10 bg-primary shadow-sm shadow-primary/20' : 'w-1.5 sm:w-2 bg-border'}`} />
                        ))}
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                        {step === 1 && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleQuickSeal}
                                className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest h-9 px-3 sm:px-6 rounded-xl border-primary/20 hover:border-primary/45 text-primary bg-primary/5 hover:bg-primary/10 flex items-center gap-1.5 transition-all"
                            >
                                <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-primary" /> Fast Archive
                            </Button>
                        )}
                        {step > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest h-9 px-4 sm:px-6 rounded-xl">
                                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                            </Button>
                        )}
                        {step < 4 ? (
                            <Button size="sm" onClick={() => setStep(s => s + 1)} className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest h-9 px-4 sm:px-6 rounded-xl shadow-md shadow-primary/10">
                                Next Phase <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        ) : (
                            <Button size="sm" onClick={handleSubmit} disabled={submitting} className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest h-9 px-4 sm:px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-lg shadow-foreground/10">
                                {submitting ? 'Archiving...' : 'Complete Protocol'} <Send className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RitualChamber;
