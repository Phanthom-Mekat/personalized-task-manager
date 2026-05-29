import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Wallet, TrendingUp, PiggyBank, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ICON_OPTIONS = [
    { name: 'Salary', icon: Briefcase },
    { name: 'Freelance', icon: TrendingUp },
    { name: 'Savings', icon: PiggyBank },
    { name: 'Investment', icon: Wallet },
];

function BudgetIncomeSourceList({ sources = [], onUpdate, onAdd, onDelete }) {
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    
    const handleAdd = () => {
        if (!newName.trim() || !newAmount) return;
        onAdd({
            name: newName.trim(),
            amount: parseFloat(newAmount) || 0,
            icon: 'Briefcase'
        });
        setNewName('');
        setNewAmount('');
        setShowAdd(false);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Income Streams</h3>
                {!showAdd && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAdd(true)}
                        className="h-6 px-2 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500"
                    >
                        <Plus className="w-3 h-3 mr-1" /> Add Source
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {sources.map((src, idx) => (
                        <motion.div
                            key={idx}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="group flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-secondary/5 hover:border-emerald-500/20 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-foreground tracking-tight">{src.name}</span>
                                    <span className="text-[9px] font-mono text-muted-foreground/50">Monthly Recurring</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-sm text-emerald-500">${parseFloat(src.amount).toLocaleString()}</span>
                                <button 
                                    onClick={() => onDelete(idx)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all cursor-pointer"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {showAdd && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 space-y-3"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-0.5">Name</label>
                                <Input 
                                    placeholder="e.g. Salary" 
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="h-8 text-xs font-bold bg-background/50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-0.5">Amount</label>
                                <Input 
                                    type="number" 
                                    placeholder="0"
                                    value={newAmount}
                                    onChange={e => setNewAmount(e.target.value)}
                                    className="h-8 text-xs font-mono font-bold bg-background/50"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" className="flex-1 h-8 bg-emerald-500 hover:bg-emerald-600 text-[10px] font-black uppercase tracking-widest" onClick={handleAdd}>
                                Confirm Source
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowAdd(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {sources.length === 0 && !showAdd && (
                    <div className="py-8 text-center border border-dashed border-border rounded-xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">No extra income sources</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BudgetIncomeSourceList;
