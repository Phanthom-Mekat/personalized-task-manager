import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Target, TrendingUp, Shield, Plane, GraduationCap, Car } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CompletionRing from './CompletionRing';

const EMOJI_OPTIONS = ['🛡️', '🏖️', '🚗', '🎓', '💎', '🏠', '🎮', '💻', '📱', '✈️', '🏋️', '💍'];
const SUGGESTED_GOALS = [
    { name: 'Emergency Fund', emoji: '🛡️', target: 5000, priority: 'high', alloc: 40 },
    { name: 'Dream Vacation', emoji: '🏖️', target: 3000, priority: 'medium', alloc: 20 },
    { name: 'New Tech', emoji: '💻', target: 1500, priority: 'low', alloc: 15 },
    { name: 'House Deposit', emoji: '🏠', target: 50000, priority: 'high', alloc: 25 },
];
const PRIORITY_COLORS = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function BudgetSavingsGoals({ goals = [], totalIncome = 0, totalActual = 0, onUpdate }) {
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const [newAlloc, setNewAlloc] = useState(50);
    const [newEmoji, setNewEmoji] = useState('🛡️');
    const [newPriority, setNewPriority] = useState('medium');

    const monthlySurplus = useMemo(() => Math.max(totalIncome - totalActual, 0), [totalIncome, totalActual]);
    const totalAllocated = useMemo(() => goals.reduce((s, g) => s + (g.allocationPercent || 0), 0), [goals]);

    const handleAdd = () => {
        if (!newName.trim() || !newTarget) return;
        const remainingAlloc = 100 - totalAllocated;
        const allocPercent = Math.min(parseFloat(newAlloc) || 0, remainingAlloc);

        const newGoal = {
            id: `goal_${Date.now()}`,
            name: newName.trim(),
            emoji: newEmoji,
            targetAmount: parseFloat(newTarget) || 0,
            currentAmount: 0,
            allocationPercent: allocPercent,
            priority: newPriority,
        };
        onUpdate([...goals, newGoal]);
        setNewName(''); setNewTarget(''); setNewAlloc(50); setShowAdd(false);
    };

    const handleAddTemplate = (template) => {
        const remainingAlloc = 100 - totalAllocated;
        const newGoal = {
            id: `goal_${Date.now()}`,
            name: template.name,
            emoji: template.emoji,
            targetAmount: template.target,
            currentAmount: 0,
            allocationPercent: Math.min(template.alloc, remainingAlloc),
            priority: template.priority,
        };
        onUpdate([...goals, newGoal]);
        setShowAdd(false);
    };

    const handleDelete = (id) => onUpdate(goals.filter(g => g.id !== id));

    const handleContribute = () => {
        if (monthlySurplus <= 0) return;
        const updated = goals.map(g => ({
            ...g,
            currentAmount: Math.min(
                g.currentAmount + (monthlySurplus * (g.allocationPercent / 100)),
                g.targetAmount
            )
        }));
        onUpdate(updated);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" /> Savings Goals
                    </h3>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                        Move your <span className="text-emerald-500 font-bold">${monthlySurplus.toLocaleString()}</span> surplus into long-term wealth
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {monthlySurplus > 0 && goals.length > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleContribute}
                            className="h-7 px-3 text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                        >
                            <TrendingUp className="w-3 h-3 mr-1" /> Allocate Surplus
                        </Button>
                    )}
                    {!showAdd && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAdd(true)}
                            className="h-7 px-3 text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Add Goal
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Add Templates */}
            {!showAdd && goals.length < 5 && (
                <div className="space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Suggested Goals</p>
                    <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
                        {SUGGESTED_GOALS.filter(t => !goals.some(g => g.name === t.name)).map((t, i) => (
                            <button
                                key={i}
                                onClick={() => handleAddTemplate(t)}
                                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-secondary/5 hover:border-primary/30 transition-all cursor-pointer group"
                            >
                                <span className="text-sm">{t.emoji}</span>
                                <div className="text-left">
                                    <p className="text-[9px] font-black uppercase tracking-tight group-hover:text-primary transition-colors">{t.name}</p>
                                    <p className="text-[8px] text-muted-foreground/40 font-mono">${t.target?.toLocaleString()}</p>
                                </div>
                                <Plus className="w-2.5 h-2.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Allocation Meter */}
            {goals.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Allocation Budget</span>
                        <span className={`text-[9px] font-mono font-bold ${totalAllocated > 100 ? 'text-red-400' : 'text-muted-foreground/60'}`}>
                            {totalAllocated}% / 100%
                        </span>
                    </div>
                    <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(totalAllocated, 100)}%` }}
                            className={`h-full rounded-full ${totalAllocated > 100 ? 'bg-red-500' : totalAllocated > 80 ? 'bg-amber-400' : 'bg-primary'}`}
                        />
                    </div>
                </div>
            )}

            {/* Goal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {goals.map((goal) => {
                        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                        const monthlyContribution = monthlySurplus * (goal.allocationPercent / 100);
                        const remainingAmount = goal.targetAmount - goal.currentAmount;
                        const monthsToGoal = monthlyContribution > 0 ? Math.ceil(remainingAmount / monthlyContribution) : Infinity;

                        return (
                            <motion.div
                                key={goal.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative rounded-2xl border border-border/50 bg-secondary/5 p-5 hover:border-primary/20 transition-all"
                            >
                                <button
                                    onClick={() => handleDelete(goal.id)}
                                    className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all cursor-pointer"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <CompletionRing percent={progress} size={56} strokeWidth={5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{goal.emoji}</span>
                                            <h4 className="text-xs font-black uppercase tracking-widest truncate">{goal.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-lg font-black font-mono">${goal.currentAmount.toLocaleString()}</span>
                                            <span className="text-[9px] text-muted-foreground/40 font-mono">/ ${goal.targetAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(progress, 100)}%` }}
                                        className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                    />
                                </div>

                                {/* Meta Row */}
                                <div className="flex items-center justify-between mt-3">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${PRIORITY_COLORS[goal.priority]}`}>
                                        {goal.priority}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-mono text-muted-foreground/50">
                                            {goal.allocationPercent}% alloc
                                        </span>
                                        {monthsToGoal !== Infinity && progress < 100 && (
                                            <span className="text-[9px] font-mono text-primary/70">
                                                ~{monthsToGoal}mo left
                                            </span>
                                        )}
                                        {progress >= 100 && (
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                ✓ Completed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {goals.length === 0 && !showAdd && (
                <div className="py-12 text-center border border-dashed border-border rounded-2xl">
                    <Target className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                        No savings goals yet
                    </p>
                    <p className="text-[9px] text-muted-foreground/20 mt-1">Click "Add Goal" to start building wealth</p>
                </div>
            )}

            {/* Add Goal Form */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">New Savings Goal</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowAdd(false)}>
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {/* Emoji Picker */}
                        <div className="flex gap-1.5 flex-wrap">
                            {EMOJI_OPTIONS.map(em => (
                                <button
                                    key={em}
                                    onClick={() => setNewEmoji(em)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-muted transition-colors cursor-pointer ${newEmoji === em ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Goal Name</label>
                                <Input
                                    placeholder="e.g. Emergency Fund"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="h-9 text-xs font-bold bg-background/50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Target Amount</label>
                                <Input
                                    type="number"
                                    placeholder="5000"
                                    value={newTarget}
                                    onChange={e => setNewTarget(e.target.value)}
                                    className="h-9 text-xs font-mono font-bold bg-background/50"
                                />
                            </div>
                        </div>

                        {/* Allocation Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Surplus Allocation</label>
                                <span className="text-[10px] font-mono font-bold text-primary">{newAlloc}%</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max={Math.max(100 - totalAllocated, 5)}
                                value={newAlloc}
                                onChange={e => setNewAlloc(parseInt(e.target.value))}
                                className="w-full accent-primary h-1.5"
                            />
                            <p className="text-[8px] text-muted-foreground/40">
                                ≈ ${(monthlySurplus * (newAlloc / 100)).toLocaleString()}/mo from your surplus
                            </p>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Priority</label>
                            <div className="flex gap-2">
                                {['high', 'medium', 'low'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewPriority(p)}
                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${newPriority === p ? PRIORITY_COLORS[p] : 'border-border/50 text-muted-foreground/40 hover:border-border'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            size="sm"
                            className="w-full h-9 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest"
                            onClick={handleAdd}
                        >
                            Create Goal
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default BudgetSavingsGoals;
