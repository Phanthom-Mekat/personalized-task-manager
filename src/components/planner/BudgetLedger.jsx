import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bookmark, Trash2, X } from 'lucide-react';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

function BudgetLedger({ dailyEntries = [], categories = [], onDeleteEntry }) {
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Flatten all entries
    const allEntries = useMemo(() => {
        return dailyEntries
            .flatMap(day => (day.entries || []).map(e => ({ ...e, date: day.date })))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [dailyEntries]);

    // Filtered entries
    const filtered = useMemo(() => {
        let result = allEntries;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(e => 
                (e.note || '').toLowerCase().includes(q) || 
                (e.category || '').toLowerCase().includes(q)
            );
        }
        if (filterCat) {
            result = result.filter(e => e.category === filterCat);
        }
        return result.slice(0, 50);
    }, [allEntries, search, filterCat]);

    // Group by date
    const grouped = useMemo(() => {
        const groups = {};
        filtered.forEach(entry => {
            const date = dayjs(entry.timestamp).format('YYYY-MM-DD');
            if (!groups[date]) groups[date] = [];
            groups[date].push(entry);
        });
        return groups;
    }, [filtered]);

    const getDateLabel = (dateStr) => {
        const d = dayjs(dateStr);
        if (d.isToday()) return 'Today';
        if (d.isYesterday()) return 'Yesterday';
        return d.format('MMM D, YYYY');
    };

    const handleDelete = async (entry) => {
        setDeletingId(entry.id);
        try {
            await onDeleteEntry(entry.id, entry);
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setDeletingId(null);
        }
    };

    // Category pills for filtering
    const activeCats = useMemo(() => {
        const seen = new Set();
        allEntries.forEach(e => { if (e.category) seen.add(e.category); });
        return Array.from(seen);
    }, [allEntries]);

    return (
        <div className="flex flex-col h-full">
            {/* Search & Filter */}
            <div className="px-4 pt-3 pb-2 space-y-2 border-b border-border/30">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full bg-muted/10 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-[11px] font-medium text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer">
                            <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                    )}
                </div>
                {activeCats.length > 1 && (
                    <div className="flex gap-1.5 flex-wrap">
                        <button
                            onClick={() => setFilterCat(null)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                !filterCat ? 'bg-primary text-primary-foreground' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                            }`}
                        >
                            All
                        </button>
                        {activeCats.map(name => {
                            const cat = categories.find(c => c.name === name);
                            return (
                                <button
                                    key={name}
                                    onClick={() => setFilterCat(filterCat === name ? null : name)}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-colors cursor-pointer ${
                                        filterCat === name 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                                    }`}
                                >
                                    {cat?.emoji} {name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-8 gap-3">
                        <Bookmark className="w-8 h-8" />
                        <p className="text-[9px] font-black uppercase tracking-widest">
                            {search || filterCat ? 'No matching entries' : 'No entries documented'}
                        </p>
                    </div>
                ) : (
                    <div className="px-2 py-1">
                        <AnimatePresence mode="popLayout">
                            {Object.entries(grouped).map(([dateStr, entries]) => (
                                <div key={dateStr}>
                                    <div className="px-2 pt-3 pb-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                            {getDateLabel(dateStr)}
                                        </span>
                                    </div>
                                    {entries.map((entry, i) => {
                                        const cat = categories.find(c => c.name === entry.category);
                                        const isDeleting = deletingId === entry.id;
                                        return (
                                            <motion.div
                                                key={entry.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: isDeleting ? 0.3 : 1, x: 0 }}
                                                exit={{ opacity: 0, height: 0, x: -30 }}
                                                className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/5 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="text-sm grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100">
                                                        {cat?.emoji || '🏷️'}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[11px] font-black uppercase tracking-tight text-foreground truncate">
                                                            {entry.note || entry.category}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-muted-foreground/40">
                                                            {dayjs(entry.timestamp).format('HH:mm')}
                                                            {entry.category !== (entry.note && entry.category) && (
                                                                <span className="ml-1.5 text-muted-foreground/30">• {entry.category}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black font-mono text-red-400 tracking-tighter">
                                                        -${parseFloat(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDelete(entry)}
                                                        disabled={isDeleting}
                                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-400 transition-all cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Footer stats */}
            {filtered.length > 0 && (
                <div className="px-4 py-2 border-t border-border/30 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        Total: ${filtered.reduce((a, e) => a + (parseFloat(e.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            )}
        </div>
    );
}

export default BudgetLedger;
