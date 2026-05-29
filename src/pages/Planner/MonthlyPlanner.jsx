import React, { useEffect, useState } from 'react';
import { usePlanner } from '../../provider/PlannerProvider';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Target, Flag, CalendarDays, Activity, 
    CheckCircle2, ChevronLeft, ChevronRight, 
    Sparkles, Heart, Zap, Globe, Bookmark 
} from 'lucide-react';
import HabitGrid from '../../components/planner/HabitGrid';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function MonthlyPlanner() {
    const { data, fetchMonthly, updateMonthly, fetchGrowthRange } = usePlanner();
    
    const [year, setYear] = useState(dayjs().year());
    const [month, setMonth] = useState(dayjs().month() + 1);
    
    const monthKey = `${year}-${month}`;
    const monthlyData = data.monthly[monthKey] || {
        theme: '',
        goals: ['', '', ''],
        focusAreas: { health: '', career: '', personal: '' },
        review: ''
    };

    useEffect(() => {
        fetchMonthly(year, month);
        const startDate = dayjs().year(year).month(month - 1).startOf('month').format('YYYY-MM-DD');
        const endDate = dayjs().year(year).month(month - 1).endOf('month').format('YYYY-MM-DD');
        fetchGrowthRange(startDate, endDate);
    }, [year, month, fetchMonthly, fetchGrowthRange]);

    const handleUpdate = (field, value) => {
        updateMonthly(year, month, { [field]: value });
    };

    const handleGoalChange = (index, value) => {
        const newGoals = [...(monthlyData.goals || ['', '', ''])];
        newGoals[index] = value;
        handleUpdate('goals', newGoals);
    };

    const handleFocusChange = (area, value) => {
        const newFocus = { ...(monthlyData.focusAreas || { health: '', career: '', personal: '' }) };
        newFocus[area] = value;
        handleUpdate('focusAreas', newFocus);
    };

    const currentMonthObj = dayjs().year(year).month(month - 1);
    const startOfMonthStr = currentMonthObj.startOf('month').format('YYYY-MM-DD');
    const daysInMonth = currentMonthObj.daysInMonth();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 mb-24 md:mb-6 space-y-6 sm:space-y-8 md:space-y-10 font-sans"
        >
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary">Strategic Horizon</Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">V.3.1 // {year}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">Monthly Vision</h1>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        Macro-Alignment & Tactical Intentions
                    </p>
                </div>
                
                <div className="flex items-center justify-between md:justify-start gap-1 bg-muted/30 p-1 rounded-xl border border-border w-full md:w-auto">
                    <Button 
                        variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-foreground flex items-center justify-center"
                        onClick={() => {
                            if (month === 1) { setMonth(12); setYear(y => y - 1); }
                            else { setMonth(m => m - 1); }
                        }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="px-4 py-1.5 flex flex-col items-center flex-1 md:flex-initial min-w-[120px] sm:min-w-[140px] text-center">
                        <span className="text-xs font-black uppercase tracking-widest text-primary leading-none">{currentMonthObj.format('MMMM')}</span>
                        <span className="text-[9px] font-mono opacity-40 font-bold mt-1">INTERVAL VIEW</span>
                    </div>
                    <Button 
                        variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-foreground flex items-center justify-center"
                        onClick={() => {
                            if (month === 12) { setMonth(1); setYear(y => y + 1); }
                            else { setMonth(m => m + 1); }
                        }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                
                {/* Left Column: Core Intentions */}
                <div className="lg:col-span-8 space-y-4 sm:space-y-6 lg:space-y-8">
                    {/* Monthly Theme */}
                    <Card className="bg-secondary/5 border-border shadow-none border-dashed rounded-[20px] sm:rounded-[24px] group hover:border-primary/30 transition-all overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                            <Sparkles className="w-48 h-48" />
                        </div>
                        <CardHeader className="p-4 sm:p-6 pb-1 sm:pb-2 relative z-10">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Operational North Star</span>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 relative z-10">
                            <input
                                type="text"
                                placeholder="Core Focus..."
                                value={monthlyData.theme || ''}
                                onChange={(e) => handleUpdate('theme', e.target.value)}
                                className="w-full text-xl sm:text-2xl md:text-3xl font-black bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/30 text-foreground tracking-tight"
                            />
                        </CardContent>
                    </Card>

                    {/* Top 3 High-Impact Goals */}
                    <Card className="bg-card shadow-none border-border rounded-[20px] sm:rounded-[24px]">
                        <CardHeader className="p-4 sm:p-6 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-primary" />
                                <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-widest">Macro Goals</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {[0, 1, 2].map(idx => (
                                <div key={idx} className="flex items-start gap-3 sm:gap-4 group">
                                    <div className="mt-1 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <textarea
                                            placeholder={`High-impact objective ${idx + 1}...`}
                                            value={monthlyData.goals?.[idx] || ''}
                                            onChange={(e) => handleGoalChange(idx, e.target.value)}
                                            rows={2}
                                            className="w-full bg-transparent border-none text-xs sm:text-sm md:text-[15px] font-bold focus:outline-none resize-none placeholder:text-muted-foreground/30 text-foreground"
                                        />
                                        <Separator className="bg-border/30 group-hover:bg-primary/20 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Vector Deep-Dives */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { id: 'health', icon: Heart, color: 'text-rose-500' },
                            { id: 'career', icon: Zap, color: 'text-amber-500' },
                            { id: 'personal', icon: Sparkles, color: 'text-indigo-500' }
                        ].map((area) => (
                            <Card key={area.id} className="bg-secondary/10 border-border shadow-none hover:bg-secondary/20 transition-colors rounded-[16px] sm:rounded-[20px]">
                                <CardHeader className="p-4 pb-1.5">
                                    <div className="flex items-center gap-2">
                                        <area.icon className={`w-3.5 h-3.5 ${area.color} opacity-70`} />
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{area.id} VECTOR</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <textarea
                                        placeholder={`Log...`}
                                        value={monthlyData.focusAreas?.[area.id] || ''}
                                        onChange={(e) => handleFocusChange(area.id, e.target.value)}
                                        className="w-full bg-transparent text-xs font-bold focus:outline-none placeholder:text-muted-foreground/30 resize-none h-20 text-muted-foreground focus:text-foreground"
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Column: Tracking Visualizers */}
                <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:space-y-8">
                    
                    {/* Visual Analytics Hub */}
                    <Card className="bg-muted/10 border-border shadow-none rounded-[20px] sm:rounded-[24px]">
                        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Operational Consistency</span>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 space-y-6 sm:space-y-8">
                            {/* No Reels Heatmap */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Anti-Scroll Protocol</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] h-4 font-black">STABLE</Badge>
                                </div>
                                <div className="grid justify-center bg-secondary/5 border border-border/30 rounded-xl p-3">
                                    <HabitGrid 
                                        data={data.growth} 
                                        habitKey="noReels" 
                                        startDate={startOfMonthStr} 
                                        days={daysInMonth} 
                                    />
                                </div>
                                <p className="text-[9px] font-black text-muted-foreground opacity-30 text-center uppercase tracking-widest">Density Map // Current Interval</p>
                            </div>

                            <Separator className="bg-border/50" />

                            {/* Productivity Heatmap */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Efficiency Matrix</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] h-4 font-black">PEAK</Badge>
                                </div>
                                <div className="grid justify-center bg-secondary/5 border border-border/30 rounded-xl p-3">
                                    <HabitGrid 
                                        data={data.growth} 
                                        habitKey="overall" 
                                        startDate={startOfMonthStr} 
                                        days={daysInMonth} 
                                    />
                                </div>
                                <p className="text-[9px] font-black text-muted-foreground opacity-30 text-center uppercase tracking-widest">Aggregate Output Performance</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Post-Interval Review */}
                    <Card className="bg-primary shadow-lg shadow-primary/10 border-none rounded-[20px] sm:rounded-[24px] group relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12 translate-x-2 -translate-y-2 group-hover:rotate-0 transition-transform">
                            <Activity className="w-24 h-24 text-white" />
                        </div>
                        <CardHeader className="p-4 sm:p-6 pb-2 relative z-10">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/50">Post-Interval Synthesis</span>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 relative z-10 space-y-4">
                            <textarea
                                placeholder="SYNTHEZISING MONTHLY DATA..."
                                value={monthlyData.review || ''}
                                onChange={(e) => handleUpdate('review', e.target.value)}
                                className="w-full h-40 bg-white/10 rounded-xl p-3 sm:p-4 text-xs font-bold text-white placeholder:text-white/30 focus:outline-none border border-white/10 focus:border-white/20 transition-all scrollbar-hide"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none">Archival Protocol</span>
                                <Bookmark className="w-3 h-3 text-white/30" />
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </motion.div>
    );
}

export default MonthlyPlanner;
