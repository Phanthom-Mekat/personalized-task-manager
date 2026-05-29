import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUB_EMOJIS = ['🎬', '🎵', '☁️', '🏋️', '📰', '🎮', '📦', '🛡️', '💻', '📱', '🍕', '📚'];

function BudgetSubscriptions({ subscriptions = [], totalIncome = 0, onUpdate }) {
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newEmoji, setNewEmoji] = useState('🎬');
    const [newCycle, setNewCycle] = useState('monthly');

    const monthlyBurn = subscriptions
        .filter(s => s.active)
        .reduce((sum, s) => sum + (s.cycle === 'yearly' ? s.amount / 12 : s.amount), 0);

    const burnPercent = totalIncome > 0 ? (monthlyBurn / totalIncome * 100) : 0;
    const activeCount = subscriptions.filter(s => s.active).length;

    const handleAdd = () => {
        if (!newName.trim() || !newAmount) return;
        const newSub = {
            id: `sub_${Date.now()}`,
            name: newName.trim(),
            amount: parseFloat(newAmount) || 0,
            emoji: newEmoji,
            cycle: newCycle,
            active: true,
        };
        onUpdate([...subscriptions, newSub]);
        setNewName(''); setNewAmount(''); setShowAdd(false);
    };

    const handleToggle = (id) => {
        onUpdate(subscriptions.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };

    const handleDelete = (id) => onUpdate(subscriptions.filter(s => s.id !== id));

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" /> Subscriptions
                    </h3>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">Track recurring monthly charges</p>
                </div>
                {!showAdd && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAdd(true)}
                        className="h-7 px-3 text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary"
                    >
                        <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                )}
            </div>

            {/* KPI Banner */}
            {subscriptions.length > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/10 border border-border/50">
                    <div className="flex-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Monthly Burn</p>
                        <p className="text-xl font-black font-mono text-foreground">${monthlyBurn.toFixed(2)}</p>
                    </div>
                    <div className="flex-1 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Active</p>
                        <p className="text-xl font-black font-mono text-primary">{activeCount}</p>
                    </div>
                    <div className="flex-1 text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">% Income</p>
                        <p className={`text-xl font-black font-mono ${burnPercent > 15 ? 'text-red-400' : burnPercent > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {burnPercent.toFixed(1)}%
                        </p>
                    </div>
                </div>
            )}

            {/* Subscription List */}
            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {subscriptions.map((sub) => {
                        const monthlyAmount = sub.cycle === 'yearly' ? sub.amount / 12 : sub.amount;
                        return (
                            <motion.div
                                key={sub.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${sub.active ? 'border-border/50 bg-secondary/5 hover:border-primary/20' : 'border-border/30 bg-muted/5 opacity-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{sub.emoji}</span>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-black uppercase tracking-tight ${!sub.active ? 'line-through' : ''}`}>
                                            {sub.name}
                                        </span>
                                        <span className="text-[8px] font-mono text-muted-foreground/40">
                                            {sub.cycle === 'yearly' ? `$${sub.amount}/yr → $${monthlyAmount.toFixed(2)}/mo` : 'Monthly'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-mono font-bold">
                                        ${monthlyAmount.toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => handleToggle(sub.id)}
                                        className="p-1 cursor-pointer hover:bg-muted rounded transition-colors"
                                        title={sub.active ? 'Pause' : 'Activate'}
                                    >
                                        {sub.active
                                            ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                                            : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                                        }
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sub.id)}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {subscriptions.length === 0 && !showAdd && (
                <div className="py-8 text-center border border-dashed border-border rounded-2xl">
                    <CreditCard className="w-6 h-6 text-muted-foreground/15 mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/25">
                        No subscriptions tracked
                    </p>
                </div>
            )}

            {/* Add Form */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">New Subscription</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowAdd(false)}>
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {/* Emoji Picker */}
                        <div className="flex gap-1.5 flex-wrap">
                            {SUB_EMOJIS.map(em => (
                                <button
                                    key={em}
                                    onClick={() => setNewEmoji(em)}
                                    className={`w-7 h-7 rounded-md flex items-center justify-center text-sm hover:bg-muted transition-colors cursor-pointer ${newEmoji === em ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest opacity-40">Name</label>
                                    <Input
                                        placeholder="Netflix"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="h-8 text-xs font-bold bg-background/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest opacity-40">Amount</label>
                                    <Input
                                        type="number"
                                        placeholder="15.99"
                                        value={newAmount}
                                        onChange={e => setNewAmount(e.target.value)}
                                        className="h-8 text-xs font-mono font-bold bg-background/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest opacity-40">Cycle</label>
                                <div className="flex gap-1">
                                    {['monthly', 'yearly'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNewCycle(c)}
                                            className={`flex-1 h-8 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all cursor-pointer ${newCycle === c ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground/40'}`}
                                        >
                                            {c === 'monthly' ? '/mo' : '/yr'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            className="w-full h-8 bg-primary hover:bg-primary/90 text-[9px] font-black uppercase tracking-widest"
                            onClick={handleAdd}
                        >
                            Add Subscription
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default BudgetSubscriptions;
