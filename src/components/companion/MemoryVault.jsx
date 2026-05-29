import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Check, X, Edit3, Trash2, Search, Filter,
    Info, Star, Loader2, Save, RotateCcw
} from 'lucide-react';

const CATEGORIES = [
    'All', 'Basics', 'Family', 'Career', 'Education',
    'Health', 'Preferences', 'Relationships', 'Personality',
    'Finance', 'Lifestyle', 'Milestones', 'General'
];

function MemoryVault({ apiCall }) {
    const [suggestions, setSuggestions] = useState([]);
    const [archive, setArchive] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI Filters / Search states
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    // Editing states
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editImportance, setEditImportance] = useState(5);
    
    // Curation edit states
    const [curationEdits, setCurationEdits] = useState({}); // { [memoryId]: content }
    const [submitting, setSubmitting] = useState({}); // { [memoryId]: 'approve'|'reject' }

    const fetchVaultData = async () => {
        setLoading(true);
        try {
            const [suggestedData, confirmedData] = await Promise.all([
                apiCall('GET', '/memories/suggested'),
                apiCall('GET', '/memories')
            ]);
            setSuggestions(suggestedData || []);
            // Filter confirmed data out from suggestions in frontend to be sure
            setArchive((confirmedData || []).filter(m => m.status === 'confirmed'));
        } catch (err) {
            console.error('Failed to retrieve memory vault context:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVaultData();
    }, [apiCall]);

    // Suggestions actions
    const handleApprove = async (id, originalContent) => {
        const content = (curationEdits[id] !== undefined ? curationEdits[id] : originalContent).trim();
        if (!content) return;
        
        setSubmitting(prev => ({ ...prev, [id]: 'approve' }));
        try {
            const approved = await apiCall('POST', `/memories/${id}/approve`, { content });
            setSuggestions(prev => prev.filter(s => s._id !== id));
            setArchive(prev => [approved, ...prev]);
        } catch (err) {
            console.error('Failed to approve suggestion:', err);
        } finally {
            setSubmitting(prev => ({ ...prev, [id]: null }));
        }
    };

    const handleReject = async (id) => {
        setSubmitting(prev => ({ ...prev, [id]: 'reject' }));
        try {
            await apiCall('POST', `/memories/${id}/reject`);
            setSuggestions(prev => prev.filter(s => s._id !== id));
        } catch (err) {
            console.error('Failed to reject suggestion:', err);
        } finally {
            setSubmitting(prev => ({ ...prev, [id]: null }));
        }
    };

    // Archive edit actions
    const startEditing = (item) => {
        setEditingId(item._id);
        setEditContent(item.content);
        setEditCategory(item.category);
        setEditImportance(item.importance || 5);
    };

    const saveEdit = async (id) => {
        if (!editContent.trim()) return;
        try {
            const updated = await apiCall('PUT', `/memories/${id}`, {
                content: editContent,
                category: editCategory,
                importance: editImportance
            });
            setArchive(prev => prev.map(m => m._id === id ? updated : m));
            setEditingId(null);
        } catch (err) {
            console.error('Failed to save memory edits:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this memory? Your AI Twin will completely forget this fact.')) return;
        try {
            await apiCall('DELETE', `/memories/${id}`);
            setArchive(prev => prev.filter(m => m._id !== id));
        } catch (err) {
            console.error('Failed to archive memory:', err);
        }
    };

    // Filter confirmed memories
    const filteredArchive = archive.filter(mem => {
        const matchesSearch = (mem.content || '').toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || (mem.category || '').toLowerCase() === categoryFilter.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                    <span className="text-xs text-muted-foreground font-semibold">Opening Memory Vault...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: AI Suggestions feed (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Curation Feed</h2>
                    </div>
                    <span className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full font-bold">
                        {suggestions.length} Suggested
                    </span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                    Facts recently extracted by the Fact Extraction Agent. Approve or correct them before they lock into permanent RAG context.
                </p>

                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin">
                    {suggestions.length === 0 ? (
                        <div className="bg-secondary/20 border border-border/30 rounded-xl p-6 text-center text-xs text-muted-foreground">
                            No suggestions pending curation. Keep talking to your digital twin to populate this feed.
                        </div>
                    ) : (
                        <AnimatePresence>
                            {suggestions.map((s) => (
                                <motion.div
                                    key={s._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.25 }}
                                    className="bg-card border border-border/50 rounded-xl p-4 space-y-3 relative overflow-hidden group shadow-sm hover:border-violet-500/30 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                                            {s.category}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                                            <span className="text-[10px] font-bold text-muted-foreground">Imp: {s.importance || 5}/10</span>
                                        </div>
                                    </div>
                                    
                                    {/* Editable content field for curate modification */}
                                    <textarea
                                        value={curationEdits[s._id] !== undefined ? curationEdits[s._id] : s.content}
                                        onChange={(e) => setCurationEdits(prev => ({ ...prev, [s._id]: e.target.value }))}
                                        className="w-full text-xs bg-secondary/30 border border-border/40 rounded-lg p-2 resize-none placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500/30 leading-relaxed text-foreground"
                                        rows={3}
                                    />
                                    
                                    {/* Approval buttons */}
                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/20">
                                        <button
                                            onClick={() => handleReject(s._id)}
                                            disabled={submitting[s._id]}
                                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                                            title="Reject & Discard Fact"
                                        >
                                            {submitting[s._id] === 'reject' ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <X className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleApprove(s._id, s.content)}
                                            disabled={submitting[s._id]}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-40"
                                        >
                                            {submitting[s._id] === 'approve' ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Check className="w-3 h-3" />
                                            )}
                                            Approve & Crystallize
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Right Column: Searchable Archive Manager (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider">Crystallized Memories Vault</h2>
                    <span className="text-xs text-muted-foreground">{filteredArchive.length} Stored Facts</span>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 bg-secondary/20 p-2.5 rounded-xl border border-border/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/40" />
                        <input
                            type="text"
                            placeholder="Search memory archive..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-background border border-border/50 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-background border border-border/50 rounded-lg px-2 text-xs">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground/40" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-transparent border-none py-1 focus:outline-none cursor-pointer"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Vault List */}
                <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1 scrollbar-thin">
                    {filteredArchive.length === 0 ? (
                        <div className="bg-secondary/15 border border-border/30 rounded-xl py-12 text-center text-xs text-muted-foreground">
                            No stored memories match your search criteria.
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredArchive.map((item) => {
                                const isEditing = editingId === item._id;
                                return (
                                    <motion.div
                                        key={item._id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`p-4 border rounded-xl transition-all shadow-sm ${
                                            isEditing
                                                ? 'bg-secondary/40 border-violet-500/40'
                                                : 'bg-card border-border/50 hover:border-border'
                                        }`}
                                    >
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Category</label>
                                                        <select
                                                            value={editCategory}
                                                            onChange={(e) => setEditCategory(e.target.value)}
                                                            className="w-full bg-background border border-border/50 rounded-lg p-1.5 text-xs focus:outline-none"
                                                        >
                                                            {CATEGORIES.filter(c => c !== 'All').map(c => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Importance (1-10)</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={10}
                                                            value={editImportance}
                                                            onChange={(e) => setEditImportance(Math.min(10, Math.max(1, Number(e.target.value))))}
                                                            className="w-full bg-background border border-border/50 rounded-lg p-1.5 text-xs focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Fact Statement</label>
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        rows={2}
                                                        className="w-full bg-background border border-border/50 rounded-lg p-2 text-xs focus:outline-none resize-none"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-bold uppercase tracking-wider hover:bg-secondary/40 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => saveEdit(item._id)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:shadow-md transition-all flex items-center gap-1"
                                                    >
                                                        <Save className="w-3.5 h-3.5" />
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground bg-secondary/55 px-1.5 py-0.5 rounded">
                                                            {item.category}
                                                        </span>
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => {
                                                                const normalizedVal = Math.round((item.importance || 5) / 2);
                                                                return (
                                                                    <Star
                                                                        key={i}
                                                                        className={`w-2.5 h-2.5 ${
                                                                            i < normalizedVal
                                                                                ? 'fill-amber-400 stroke-amber-400'
                                                                                : 'stroke-muted-foreground/30'
                                                                        }`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-foreground leading-relaxed font-medium">{item.content}</p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                                                    <button
                                                        onClick={() => startEditing(item)}
                                                        className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                                                        title="Edit Fact"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                                                        title="Forget Fact"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MemoryVault;
