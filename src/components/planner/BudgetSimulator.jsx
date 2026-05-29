import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, AlertTriangle, CheckCircle2, XCircle, Zap, TrendingUp } from 'lucide-react';
import { Input } from "@/components/ui/input";

function BudgetSimulator({ totalIncome = 0, totalActual = 0, totalPlanned = 0, savingsGoals = [], monthlySurplus = 0 }) {
    const [amount, setAmount] = useState('');
    const [label, setLabel] = useState('');

    const simAmount = parseFloat(amount) || 0;
    const netBalanceNow = totalIncome - totalActual;
    const netBalanceAfter = netBalanceNow - simAmount;
    const utilizationNow = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
    const utilizationAfter = totalPlanned > 0 ? ((totalActual + simAmount) / totalPlanned) * 100 : 0;

    const verdict = useMemo(() => {
        if (simAmount <= 0) return null;
        if (netBalanceAfter < 0) return { level: 'danger', label: 'Not Recommended', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
        if (utilizationAfter > 90) return { level: 'warning', label: 'Tight Budget', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
        return { level: 'safe', label: 'Affordable', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }, [simAmount, netBalanceAfter, utilizationAfter]);

    // Calculate savings goal delays
    const goalImpacts = useMemo(() => {
        if (simAmount <= 0 || savingsGoals.length === 0) return [];
        return savingsGoals.filter(g => g.currentAmount < g.targetAmount).map(g => {
            const monthlyContrib = monthlySurplus * (g.allocationPercent / 100);
            const newSurplus = Math.max(monthlySurplus - simAmount, 0);
            const newMonthlyContrib = newSurplus * (g.allocationPercent / 100);
            const remaining = g.targetAmount - g.currentAmount;

            const monthsBefore = monthlyContrib > 0 ? Math.ceil(remaining / monthlyContrib) : Infinity;
            const monthsAfter = newMonthlyContrib > 0 ? Math.ceil(remaining / newMonthlyContrib) : Infinity;
            const delay = monthsAfter - monthsBefore;

            return { name: g.name, emoji: g.emoji, delay, monthsAfter };
        });
    }, [simAmount, savingsGoals, monthlySurplus]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" /> Can I Afford It?
                </h3>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                    Simulate a purchase and see the impact on your finances
                </p>
            </div>

            {/* Input */}
            <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-40">Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono opacity-30">$</span>
                        <Input
                            type="number"
                            placeholder="1,200"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="h-10 pl-7 text-sm font-mono font-bold bg-secondary/10"
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-40">What For? (optional)</label>
                    <Input
                        placeholder="e.g. New Laptop"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        className="h-10 text-xs font-bold bg-secondary/10"
                    />
                </div>
            </div>

            {/* Results Snapshot */}
            <AnimatePresence>
                {simAmount > 0 && verdict && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                    >
                        {/* Verdict Badge */}
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${verdict.bg}`}>
                            <verdict.icon className={`w-6 h-6 ${verdict.color}`} />
                            <div>
                                <p className={`text-sm font-black uppercase tracking-widest ${verdict.color}`}>
                                    {verdict.label}
                                </p>
                                <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                                    {label ? `"${label}" for $${simAmount.toLocaleString()}` : `$${simAmount.toLocaleString()} purchase`}
                                </p>
                            </div>
                        </div>

                        {/* Impact Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-secondary/5 border border-border/50">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Net Balance After</p>
                                <p className={`text-lg font-black font-mono ${netBalanceAfter < 0 ? 'text-red-400' : 'text-foreground'}`}>
                                    {netBalanceAfter < 0 ? '-' : ''}${Math.abs(netBalanceAfter).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/5 border border-border/50">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Budget Used</p>
                                <p className={`text-lg font-black font-mono ${utilizationAfter > 100 ? 'text-red-400' : utilizationAfter > 90 ? 'text-amber-400' : 'text-foreground'}`}>
                                    {utilizationAfter.toFixed(0)}%
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/5 border border-border/50">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Surplus Left</p>
                                <p className={`text-lg font-black font-mono ${(monthlySurplus - simAmount) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    ${Math.max(monthlySurplus - simAmount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Saving Plan (if not recommended) */}
                        {verdict.level !== 'safe' && monthlySurplus > 0 && (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Saving Plan
                                </p>
                                <p className="text-xs font-bold leading-relaxed">
                                    Save <span className="text-primary">${Math.ceil(simAmount / Math.max(Math.ceil(simAmount / monthlySurplus), 1)).toLocaleString()}</span> extra per month for 
                                    <span className="text-primary ml-1">{Math.ceil(simAmount / monthlySurplus)} months</span> to afford this comfortably.
                                </p>
                                <p className="text-[8px] text-muted-foreground/50">
                                    This utilizes your monthly surplus of ${monthlySurplus.toLocaleString()} without affecting your essential budget.
                                </p>
                            </div>
                        )}

                        {/* Savings Goal Impact */}
                        {goalImpacts.length > 0 && (
                            <div className="p-4 rounded-xl bg-secondary/5 border border-border/50 space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Goal Impact
                                </p>
                                {goalImpacts.map((g, i) => (
                                    <div key={i} className="flex items-center justify-between py-1">
                                        <span className="text-xs font-bold flex items-center gap-1.5">
                                            <span>{g.emoji}</span> {g.name}
                                        </span>
                                        <span className={`text-[10px] font-mono font-bold ${g.delay > 0 ? 'text-amber-400' : 'text-muted-foreground/50'}`}>
                                            {g.delay > 0 ? `+${g.delay}mo delay` : 'No impact'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Placeholder when no amount */}
            {simAmount <= 0 && (
                <div className="py-8 text-center border border-dashed border-border rounded-2xl">
                    <Calculator className="w-6 h-6 text-muted-foreground/15 mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">
                        Enter an amount to simulate impact
                    </p>
                </div>
            )}
        </div>
    );
}

export default BudgetSimulator;
