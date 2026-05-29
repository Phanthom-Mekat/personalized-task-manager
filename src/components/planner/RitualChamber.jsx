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
    const { completeRitual, data, fetchGrowthRange, fetchBudget } = usePlanner();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

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

    const [form, setForm] = useState({
        wins: ['', '', ''],
        challenges: ['', ''],
        improvements: ['', ''],
        grade: 5
    });

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

    const handleUpdate = (field, idx, val) => {
        setForm(prev => {
            const newArr = [...prev[field]];
            newArr[idx] = val;
            return { ...prev, [field]: newArr };
        });
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
                        className="space-y-6 py-4"
                    >
                        <div className="text-center mb-8">
                             <Badge variant="outline" className="mb-2 px-3 py-0.5 border-primary/30 text-primary font-mono tracking-widest text-[10px] uppercase">Review Period</Badge>
                             <h2 className="text-3xl font-black text-foreground">{ritual.type === 'weekly' ? `Week ${ritual.data.weekNumber}` : dayjs().month(ritual.data.month - 1).format('MMMM')}</h2>
                             <p className="text-sm text-muted-foreground font-medium mt-1 opacity-60">Quantifying your existence</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-secondary/20 shadow-none border-border group hover:border-primary/30 transition-all">
                                <CardContent className="p-5 flex flex-col items-center text-center">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 shadow-inner">
                                        <Zap className="w-5 h-5 fill-current" />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Productivity</span>
                                    <span className="text-2xl font-mono font-bold">{stats.productivity}%</span>
                                    <Progress value={stats.productivity} className="h-1 w-full mt-4 bg-muted" />
                                </CardContent>
                            </Card>

                            <Card className="bg-secondary/20 shadow-none border-border group hover:border-primary/30 transition-all">
                                <CardContent className="p-5 flex flex-col items-center text-center">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 shadow-inner">
                                        <CheckCircle className="w-5 h-5 fill-current" />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Habits</span>
                                    <span className="text-2xl font-mono font-bold">{stats.habits}</span>
                                    <p className="text-[9px] text-muted-foreground mt-2 font-bold uppercase tracking-tighter opacity-40">Disciplines maintained</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-secondary/20 shadow-none border-border group hover:border-primary/30 transition-all">
                                <CardContent className="p-5 flex flex-col items-center text-center">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 shadow-inner">
                                        <Wallet className="w-5 h-5 fill-current" />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Budget</span>
                                    <span className="text-xs font-mono font-bold uppercase tracking-widest">{stats.budget}</span>
                                    <Badge variant={stats.budget.includes('Over') ? 'destructive' : 'secondary'} className="mt-3 font-mono text-[9px] px-1.5 py-0">FISCAL STATUS</Badge>
                                </CardContent>
                            </Card>
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
                        className="space-y-6 py-4"
                    >
                         <div className="text-center mb-6">
                             <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4 shadow-sm">
                                <Trophy className="w-8 h-8 fill-current" />
                             </div>
                             <h2 className="text-2xl font-black text-foreground">The Victory Log</h2>
                             <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-40">What went right by design?</p>
                        </div>

                        <div className="space-y-3">
                            {form.wins.map((win, idx) => (
                                <div key={idx} className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-black border-r border-border pr-3 opacity-20 group-focus-within:opacity-100 transition-opacity">0{idx + 1}</span>
                                    <input
                                        type="text" value={win}
                                        onChange={(e) => handleUpdate('wins', idx, e.target.value)}
                                        placeholder={`Strategic success ${idx + 1}`}
                                        className="w-full pl-14 pr-4 py-3.5 rounded-md border border-border bg-muted/30 focus:bg-background focus:ring-1 focus:ring-primary outline-none text-sm transition-all font-medium"
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
                        className="space-y-6 py-4"
                    >
                        <div>
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 text-center">Friction & Iteration</h3>
                            <div className="space-y-3 mb-8">
                                {form.challenges.map((c, idx) => (
                                    <textarea
                                        key={idx} value={c}
                                        onChange={(e) => handleUpdate('challenges', idx, e.target.value)}
                                        placeholder={`Critical friction ${idx + 1}...`}
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-md border border-border bg-muted/30 focus:bg-background focus:ring-1 focus:ring-primary outline-none text-sm resize-none transition-all font-medium"
                                    />
                                ))}
                            </div>

                            <Separator className="my-8 opacity-50" />

                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 text-center">Refined Protocols</h3>
                            <div className="space-y-3">
                                {form.improvements.map((imp, idx) => (
                                    <textarea
                                        key={idx} value={imp}
                                        onChange={(e) => handleUpdate('improvements', idx, e.target.value)}
                                        placeholder={`Adjustment ${idx + 1}...`}
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-md border border-border bg-muted/30 focus:bg-background focus:ring-1 focus:ring-primary outline-none text-sm resize-none transition-all font-medium"
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
                        className="flex flex-col items-center py-10"
                    >
                        <div className="text-center mb-12">
                             <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-6 mx-auto shadow-sm ring-1 ring-primary/20">
                                <Brain className="w-12 h-12" />
                             </div>
                             <h2 className="text-3xl font-black text-foreground mb-2">Final Evaluation</h2>
                             <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-40">Your absolute performance score</p>
                        </div>
                        
                        <div className="w-full max-w-sm space-y-8">
                            <div className="flex flex-col items-center gap-6">
                                <span className={`text-8xl font-black font-mono transition-all ${form.grade >= 8 ? 'text-primary' : form.grade >= 5 ? 'text-foreground' : 'text-muted-foreground'}`}>{form.grade}</span>
                                <Slider 
                                    value={[form.grade]}
                                    onValueChange={([v]) => setForm(f => ({ ...f, grade: v }))}
                                    max={10} min={1} step={1}
                                    className="w-full"
                                />
                                <Badge variant="secondary" className="px-6 py-1.5 text-xs font-mono uppercase tracking-[0.3em] font-black">Grade Range [1-10]</Badge>
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
            <DialogContent className="max-w-2xl bg-background border-border shadow-2xl p-0 gap-0 overflow-hidden font-sans outline-none">
                <DialogHeader className="p-6 border-b border-border flex flex-row items-center justify-between gap-4 bg-muted/10">
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
                </DialogHeader>

                <div className="p-8 min-h-[480px]">
                    <AnimatePresence mode="wait">
                        {renderStep()}
                    </AnimatePresence>
                </div>

                <div className="p-6 border-t border-border bg-muted/5 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map(idx => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${step === idx ? 'w-10 bg-primary shadow-sm shadow-primary/20' : 'w-2 bg-border'}`} />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        {step > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="font-black text-[10px] uppercase tracking-widest h-9 px-6 rounded-md">
                                <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back
                            </Button>
                        )}
                        {step < 4 ? (
                            <Button size="sm" onClick={() => setStep(s => s + 1)} className="font-black text-[10px] uppercase tracking-widest h-9 px-6 rounded-md shadow-md shadow-primary/10">
                                Next Phase <ArrowRight className="w-3.5 h-3.5 ml-2" />
                            </Button>
                        ) : (
                            <Button size="sm" onClick={handleSubmit} disabled={submitting} className="font-black text-[10px] uppercase tracking-widest h-9 px-6 rounded-md bg-foreground text-background hover:bg-foreground/90 shadow-lg shadow-foreground/10">
                                {submitting ? 'Archiving...' : 'Complete Protocol'} <Send className="w-3.5 h-3.5 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RitualChamber;
