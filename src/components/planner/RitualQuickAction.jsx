import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Calendar, Bookmark } from 'lucide-react';
import { usePlanner } from '../../provider/PlannerProvider';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const RitualQuickAction = ({ onOpen }) => {
    const { pendingRituals } = usePlanner();

    if (!pendingRituals || pendingRituals.length === 0) return null;

    const ritual = pendingRituals[0];
    const isMonthly = ritual.type === 'monthly';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
            >
                <div className="relative overflow-hidden group rounded-2xl p-6 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-all duration-500 shadow-2xl">
                    {/* Background Glow */}
                    <div className={`absolute -right-10 -top-10 w-40 h-40 blur-[80px] opacity-20 pointer-events-none transition-all duration-700 group-hover:opacity-30 ${
                        isMonthly ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`} />

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/5 bg-[#121214] ${
                                isMonthly ? 'text-indigo-400' : 'text-emerald-400'
                            }`}>
                                {isMonthly ? <Calendar className="w-7 h-7" /> : <Bookmark className="w-7 h-7" />}
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                                        {ritual.title}
                                    </h3>
                                    <Badge variant="outline" className={`border-zinc-700 text-[10px] font-black uppercase tracking-widest ${
                                        isMonthly ? 'text-indigo-400' : 'text-emerald-400'
                                    }`}>
                                        Pending
                                    </Badge>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                                    Your {ritual.period} review is waiting. Take a moment to reflect on your growth.
                                </p>
                            </div>
                        </div>

                        <Button 
                            onClick={onOpen}
                            size="lg"
                            className={`h-12 px-8 rounded-xl font-bold uppercase tracking-wider gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 group ${
                                isMonthly 
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                        >
                            Begin Ritual
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RitualQuickAction;
