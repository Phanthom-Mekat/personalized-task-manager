import React, { useEffect, useState } from 'react';
import { usePlanner } from '../../provider/PlannerProvider';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mountain, Compass, Star, Rocket, 
    BookOpen, ChevronLeft, ChevronRight, 
    Globe, Target, Shield, Zap, Sparkles,
    Layout, ArrowUpRight, Activity, Calendar,
    Plus
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function YearlyPlanner() {
    const { data, fetchYearly, updateYearly } = usePlanner();
    const [year, setYear] = useState(dayjs().year());

    const yearlyData = data.yearly || {
        wordOfYear: '',
        vision: '',
        goals: ['', '', '', '', ''],
        quarters: {
            Q1: '', Q2: '', Q3: '', Q4: ''
        },
        review: ''
    };

    useEffect(() => {
        fetchYearly(year);
    }, [year, fetchYearly]);

    const handleUpdate = (field, value) => {
        updateYearly(year, { [field]: value });
    };

    const handleGoalChange = (index, value) => {
        const newGoals = [...(yearlyData.goals || ['', '', '', '', ''])];
        newGoals[index] = value;
        handleUpdate('goals', newGoals);
    };

    const handleQuarterChange = (q, value) => {
        const newQuarters = { ...(yearlyData.quarters || { Q1: '', Q2: '', Q3: '', Q4: '' }) };
        newQuarters[q] = value;
        handleUpdate('quarters', newQuarters);
    };

    const addGoalNode = () => {
        const currentGoals = [...(yearlyData.goals || ['', '', '', '', ''])];
        handleUpdate('goals', [...currentGoals, '']);
    };

    const progress = Math.min(100, (
        (yearlyData.wordOfYear ? 10 : 0) +
        (yearlyData.vision ? 20 : 0) +
        ((yearlyData.goals?.filter(g => {
            const val = typeof g === 'object' ? g?.goal : g;
            return val && val.trim() !== '';
        }).length || 0) * 10) +
        ((Object.values(yearlyData.quarters || {}).filter(q => q.trim()).length || 0) * 5)
    ));

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 mb-32 md:mb-12 space-y-8 sm:space-y-12 bg-transparent min-h-screen text-foreground"
        >
            {/* Command Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 pb-10 border-b border-border">
                <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Macro Strategy Command v.26</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-foreground uppercase leading-[0.85]">
                        Vision<span className="text-muted-foreground/30">.Blueprint</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-10">
                    {/* Progress Badge */}
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Tactical Readiness</span>
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-primary rounded-full"
                                />
                            </div>
                            <span className="text-lg font-black tabular-nums leading-none text-foreground">{progress}%</span>
                        </div>
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center gap-1 bg-card p-1 rounded-[24px] border border-border shadow-sm hover:border-border/80 transition-all">
                        <Button 
                            variant="ghost" size="icon" className="h-11 w-11 rounded-full hover:bg-secondary/40 text-foreground"
                            onClick={() => setYear(y => y - 1)}
                        >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground/80" />
                        </Button>
                        <div className="px-6 text-center min-w-[100px]">
                            <span className="text-xl font-black text-foreground tracking-tighter tabular-nums leading-none">{year}</span>
                            <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none mt-1">Focus</div>
                        </div>
                        <Button 
                            variant="ghost" size="icon" className="h-11 w-11 rounded-full hover:bg-secondary/40 text-foreground"
                            onClick={() => setYear(y => y + 1)}
                        >
                            <ChevronRight className="w-4 h-4 text-muted-foreground/80" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Hero Strategy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Master Vision (Primary Hero) */}
                <Card className="md:col-span-2 bg-card border border-border shadow-md rounded-[32px] md:rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all duration-500 flex flex-col">
                    <CardHeader className="p-5 sm:p-8 lg:p-10 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-secondary/30 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Compass className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary-foreground transition-colors" />
                            </div>
                            <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Strategic Intent Statement</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-8 lg:p-10 pt-0 flex-1 flex flex-col">
                        <textarea
                            placeholder="WHERE ARE YOU STANDING ON DECEMBER 31ST? DESCRIBE THE PINNACLE."
                            value={yearlyData.vision || ''}
                            onChange={(e) => handleUpdate('vision', e.target.value)}
                            className="w-full flex-1 min-h-[220px] bg-transparent border-none text-xl sm:text-2xl lg:text-4xl font-black focus:outline-none placeholder:text-muted-foreground/20 text-foreground tracking-tight leading-[1] lg:leading-[1.1] resize-none overflow-y-auto scrollbar-hide"
                        />
                        <div className="flex items-center gap-2 mt-4 pt-4 sm:pt-6 border-t border-border/30 shrink-0">
                            <Badge variant="outline" className="px-2 py-0.5 text-[8px] lg:text-[9px] font-black border-border uppercase tracking-widest text-muted-foreground">Primary Objective</Badge>
                            <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-all" />
                        </div>
                    </CardContent>
                </Card>

                {/* Anchor Words (Secondary Hero) */}
                <Card className="bg-card border border-border shadow-md rounded-[32px] md:rounded-[40px] overflow-hidden flex flex-col justify-between group relative hover:border-primary/30 transition-all duration-500 min-h-[300px]">
                    <CardHeader className="p-5 sm:p-8 lg:p-10 pb-2 relative z-10">
                        <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground group-hover:text-foreground transition-colors">Core Yearly Mantras</span>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-8 lg:p-10 pt-0 relative z-10 flex-1 flex flex-col justify-center space-y-3">
                        {[0, 1, 2, 3, 4].map(idx => {
                            const words = (yearlyData.wordOfYear || '').split(', ');
                            return (
                                <div key={idx} className="flex items-center gap-3 group/word">
                                    <span className="text-[9px] font-mono font-black text-muted-foreground/50 group-hover/word:text-primary transition-colors">0{idx+1}</span>
                                    <input
                                        type="text"
                                        placeholder={`Mantra ${idx + 1}...`}
                                        value={words[idx] || ''}
                                        onChange={(e) => {
                                            const newWords = [...words];
                                            newWords[idx] = e.target.value;
                                            handleUpdate('wordOfYear', newWords.filter(w => w !== '').join(', '));
                                        }}
                                        className="w-full text-base font-black bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/20 text-foreground tracking-widest uppercase"
                                    />
                                </div>
                            );
                        })}
                    </CardContent>
                    <div className="p-5 sm:p-8 lg:p-10 pt-0 relative z-10 flex justify-center">
                        <div className="px-4 py-1.5 rounded-full bg-secondary/30 text-[8px] lg:text-[10px] font-black text-muted-foreground tracking-[0.3em] uppercase border border-border group-hover:bg-secondary/60 group-hover:text-foreground transition-all">Yearly frequency anchor</div>
                    </div>
                </Card>
            </div>

            {/* Macro-Objectives Bento Grid */}
            <div className="space-y-6 lg:space-y-8">
                <div className="flex items-center gap-3 px-2">
                    <Rocket className="w-5 h-5 text-foreground" />
                    <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.4em] lg:tracking-[0.5em] text-muted-foreground">Tactical Pillars (Macro-Goals)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(yearlyData.goals || ['', '', '', '', '']).map((goal, idx) => (
                        <Card key={idx} className="bg-card border border-border rounded-[24px] sm:rounded-[32px] group hover:border-primary/30 transition-all duration-300 p-5 sm:p-6 lg:p-8 space-y-4 lg:space-y-6 flex flex-col">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] lg:text-[11px] font-mono font-black text-muted-foreground/30 group-hover:text-primary transition-colors">0{idx + 1}</span>
                                <div className={`w-3 h-3 rounded-full border-2 transition-all ${goal ? 'bg-primary border-primary scale-110 shadow-[0_0_8px_rgba(255,255,255,0.05)]' : 'border-border group-hover:border-primary/40'}`} />
                            </div>
                            <textarea
                                placeholder={`Massive Goal ${idx + 1}...`}
                                value={
                                    typeof goal === 'object' 
                                        ? goal?.goal || '' 
                                        : goal || ''
                                }
                                onChange={(e) => handleGoalChange(idx, e.target.value)}
                                className="w-full bg-transparent border-none text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight focus:outline-none resize-none placeholder:text-muted-foreground/20 text-foreground leading-tight min-h-[140px] flex-1 scrollbar-hide"
                            />
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-border/30">
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground/40" />
                                <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">High Impact Core</span>
                            </div>
                        </Card>
                    ))}
                    {/* Functional Add Card */}
                    <button 
                        onClick={addGoalNode}
                        className="bg-secondary/10 border border-dashed border-border rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-center items-center text-center gap-3 group hover:border-primary/30 hover:bg-card transition-all cursor-pointer min-h-[220px]"
                    >
                        <div className="p-3 bg-card rounded-2xl border border-border shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <Plus className="w-6 h-6 text-muted-foreground/30 group-hover:text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground/60 leading-relaxed uppercase tracking-widest group-hover:text-foreground transition-colors">Add extra vectors if the <br/> mission scope expands</p>
                    </button>
                </div>
            </div>

            {/* Phased Execution Hub (Quarters) */}
            <div className="space-y-8">
                <div className="flex items-center gap-3 px-2">
                    <Calendar className="w-5 h-5 text-foreground" />
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Phased Execution Plan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => (
                        <Card key={q} className="bg-card border border-border rounded-[24px] sm:rounded-[32px] overflow-hidden group hover:border-primary/30 transition-all">
                            <CardHeader className="p-5 sm:p-8 pb-3 bg-secondary/20 group-hover:bg-secondary/40 transition-colors border-b border-border">
                                <div className="flex justify-between items-center">
                                    <span className="text-4xl font-black text-muted-foreground/30 group-hover:text-foreground transition-all">{q}</span>
                                    <Badge variant="outline" className="px-2 py-0.5 text-[8px] font-black border-border uppercase tracking-widest text-muted-foreground">
                                        {idx === 0 ? 'JAN-MAR' : idx === 1 ? 'APR-JUN' : idx === 2 ? 'JUL-SEP' : 'OCT-DEC'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-8">
                                <textarea
                                    placeholder="PHASE OBJECTIVES..."
                                    value={yearlyData.quarters?.[q] || ''}
                                    onChange={(e) => handleQuarterChange(q, e.target.value)}
                                    className="w-full h-32 bg-transparent border-none text-xs font-bold leading-relaxed focus:outline-none placeholder:text-muted-foreground/20 text-muted-foreground focus:text-foreground transition-all resize-none"
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Post-Year Review / Log */}
            <Card className="bg-secondary/5 border border-dashed border-border rounded-[24px] sm:rounded-[32px] group relative overflow-hidden mt-12 hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12 transition-transform group-hover:rotate-0">
                        <BookOpen className="w-48 h-48 text-foreground" />
                </div>
                <CardHeader className="p-6 sm:p-12 pb-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-muted-foreground/40 opacity-50" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Post-Iterative Synthesis (Summit Review)</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-12 pt-0 relative z-10">
                        <textarea
                        placeholder="DOCUMENTING TOTAL SUMMIT ACHIEVEMENTS AND EVOLUTION NODES..."
                        value={yearlyData.review || ''}
                        onChange={(e) => handleUpdate('review', e.target.value)}
                        className="w-full h-40 bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground/20 focus:outline-none resize-none tracking-tight leading-relaxed"
                    />
                        <div className="flex items-center justify-between pt-8 mt-4 border-t border-border opacity-30 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none text-muted-foreground/40">Fiscal Ledger Archived // System Stable</span>
                        <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                </CardContent>
            </Card>

        </motion.div>
    );
}

export default YearlyPlanner;
