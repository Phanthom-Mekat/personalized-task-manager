import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const EMOJI_OPTIONS = [
    '🍚', '🏠', '🚌', '📱', '🎮', '💊', '📚', '💳',
    '☕', '🎬', '🏋️', '👕', '🎁', '✈️', '🐾', '🔧',
    '💇', '🎵', '💡', '🛒', '🍕', '🧹', '💻', '📦',
];

function BudgetCategoryList({ 
    categories = [], 
    totalIncome = 0,
    onCategoryUpdate, 
    onAddCategory, 
    onDeleteCategory 
}) {
    const [showAddRow, setShowAddRow] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPlanned, setNewPlanned] = useState('');
    const [newEmoji, setNewEmoji] = useState('📦');
    const [emojiPickerIdx, setEmojiPickerIdx] = useState(null); // null or index
    const emojiRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) {
                setEmojiPickerIdx(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdd = () => {
        if (!newName.trim()) return;
        onAddCategory({
            name: newName.trim(),
            planned: parseFloat(newPlanned) || 0,
            actual: 0,
            emoji: newEmoji,
        });
        setNewName('');
        setNewPlanned('');
        setNewEmoji('📦');
        setShowAddRow(false);
    };

    return (
        <div className="space-y-1">
            <AnimatePresence mode="popLayout">
                {categories.map((cat, idx) => {
                    const planned = parseFloat(cat?.planned) || 0;
                    const actual = parseFloat(cat?.actual) || 0;
                    const percentUsed = planned > 0 ? (actual / planned) * 100 : 0;
                    const incomeShare = totalIncome > 0 ? (planned / totalIncome) * 100 : 0;
                    const isOver = actual > planned && planned > 0;
                    const remaining = planned - actual;

                    return (
                        <motion.div
                            key={(cat?.name || 'idx') + idx}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, height: 0 }}
                            className={`group relative rounded-2xl border transition-all p-4 ${isOver ? 'bg-red-500/5 border-red-500/20' : 'bg-secondary/5 border-transparent hover:border-border/50 hover:bg-muted/5'}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Emoji Display */}
                                    <div className="relative" ref={emojiPickerIdx === idx ? emojiRef : null}>
                                        <button
                                            onClick={() => setEmojiPickerIdx(emojiPickerIdx === idx ? null : idx)}
                                            className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shadow-inner transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${isOver ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-card border-border hover:bg-secondary'}`}
                                        >
                                            {cat.emoji || '📦'}
                                        </button>
                                        <AnimatePresence>
                                            {emojiPickerIdx === idx && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                                    className="absolute top-14 left-0 z-[100] bg-card border border-border rounded-2xl p-3 shadow-2xl grid grid-cols-6 gap-1 w-[240px]"
                                                >
                                                    {EMOJI_OPTIONS.map((em) => (
                                                        <button
                                                            key={em}
                                                            onClick={() => {
                                                                onCategoryUpdate(idx, 'emoji', em);
                                                                setEmojiPickerIdx(null);
                                                            }}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors cursor-pointer ${cat.emoji === em ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}
                                                        >
                                                            {em}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={cat?.name || ''}
                                                onChange={(e) => onCategoryUpdate(idx, 'name', e.target.value)}
                                                className="bg-transparent border-none text-base font-black uppercase tracking-tight focus:outline-none p-0 w-full"
                                            />
                                            {isOver ? (
                                                <AlertTriangle className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0 animate-pulse" />
                                            ) : percentUsed > 90 ? (
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                            ) : actual > 0 ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/40" />
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-mono font-bold ${isOver ? 'text-red-500' : 'text-muted-foreground/60'}`}>
                                                {isOver 
                                                    ? `-$${Math.abs(remaining).toLocaleString()} OVER` 
                                                    : `$${remaining.toLocaleString()} left`
                                                }
                                            </span>
                                            <span className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest">• {incomeShare.toFixed(1)}% of income</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-6 justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                                    {/* Planned Input */}
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-1">Budget</span>
                                        <div className="flex items-center gap-1 bg-muted/20 px-2 py-1 rounded-lg border border-border/50 focus-within:border-primary transition-all">
                                            <span className="text-[10px] font-mono opacity-30">$</span>
                                            <input
                                                type="number"
                                                value={cat?.planned ?? ''}
                                                onChange={(e) => onCategoryUpdate(idx, { ...cat, planned: parseFloat(e.target.value) || 0 })}
                                                className="w-16 bg-transparent border-none text-sm font-mono font-black focus:outline-none text-right placeholder-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Actual - Editable Input */}
                                    <div className="flex flex-col items-end min-w-[80px]">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-1">Spent</span>
                                        <div className="flex items-center gap-1 bg-secondary/20 rounded-lg px-2 py-1 group-hover:bg-secondary/40 transition-all">
                                            <span className="text-[10px] font-mono opacity-30">$</span>
                                            <input
                                                type="number"
                                                value={cat?.actual ?? ''}
                                                onChange={(e) => onCategoryUpdate(idx, { ...cat, actual: parseFloat(e.target.value) || 0 })}
                                                className={`w-16 bg-transparent border-none text-sm font-mono font-black focus:outline-none text-right ${isOver ? 'text-red-500' : 'text-foreground'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => onDeleteCategory(idx)}
                                        className="p-2 rounded-xl text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4 relative h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(percentUsed, 100)}%` }}
                                    className={`absolute h-full rounded-full transition-all ${isOver ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : percentUsed > 80 ? 'bg-orange-400' : 'bg-primary'}`}
                                />
                                {percentUsed > 100 && (
                                    <div className="absolute right-0 top-0 h-full w-full bg-red-500/20 animate-pulse" />
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-1.5 px-0.5">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isOver ? 'text-red-400' : 'text-muted-foreground/30'}`}>
                                    {isOver ? 'Exceeded' : `${percentUsed.toFixed(0)}% Utilized`}
                                </span>
                                {isOver && (
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                        Action Required <AlertTriangle className="w-2.5 h-2.5" />
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Add Category Row */}
            <AnimatePresence>
                {showAddRow && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 mt-4"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    const idx = EMOJI_OPTIONS.indexOf(newEmoji);
                                    setNewEmoji(EMOJI_OPTIONS[(idx + 1) % EMOJI_OPTIONS.length]);
                                }}
                                className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center text-xl cursor-pointer hover:bg-secondary transition-all shadow-sm"
                            >
                                {newEmoji}
                            </button>
                            <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-0.5">New Category</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Subscriptions"
                                    className="w-full bg-transparent border-b border-border focus:border-primary text-sm font-black focus:outline-none transition-colors py-1"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-0.5">Budget</label>
                                <div className="flex items-center border-b border-border focus-within:border-primary transition-colors py-1">
                                    <span className="text-[10px] font-mono opacity-30">$</span>
                                    <input
                                        type="number"
                                        value={newPlanned}
                                        onChange={(e) => setNewPlanned(e.target.value)}
                                        placeholder="0"
                                        className="w-20 bg-transparent border-none text-sm font-mono font-black focus:outline-none text-right"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 self-end">
                                <Button size="sm" onClick={handleAdd} className="h-9 px-4 text-[10px] font-black uppercase tracking-[0.15em] bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    Create
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setShowAddRow(false)} className="h-9 w-9 p-0 rounded-xl">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Button */}
            {!showAddRow && (
                <button
                    onClick={() => setShowAddRow(true)}
                    className="w-full py-4 mt-3 rounded-2xl border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 text-muted-foreground/60 hover:text-primary cursor-pointer group"
                >
                    <div className="w-6 h-6 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Craft New Category</span>
                </button>
            )}
        </div>
    );
}

export default BudgetCategoryList;

