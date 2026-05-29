import React, { useEffect, useMemo, useState } from 'react';
import { usePlanner } from '../../provider/PlannerProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Hash, Edit3, CalendarDays, ChevronLeft, ChevronRight, Brain, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import VoiceDictation from '../../components/planner/VoiceDictation';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Notebook() {
    const { data, fetchNotebook, updateNotebookPage, fetchJournal, updateJournalEntry, auditJournalMindset } = usePlanner();
    const [activeMode, setActiveMode] = useState('pages');
    const [activePage, setActivePage] = useState(1);
    const [activeJournalDate, setActiveJournalDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileShowEditor, setMobileShowEditor] = useState(false);

    // AI Journal Mindset Audit state
    const [cbtResult, setCbtResult] = useState(null);
    const [auditing, setAuditing] = useState(false);
    const [showCbtPanel, setShowCbtPanel] = useState(false);

    useEffect(() => {
        fetchNotebook();
        fetchJournal();
    }, [fetchNotebook, fetchJournal]);

    const pages = data.notebook || [];
    const journalMap = data.journal || {};
    const currentPageData = pages.find((p) => p.pageNumber === activePage) || null;

    const journalEntries = useMemo(
        () => Object.values(journalMap).sort((a, b) => (a.date < b.date ? 1 : -1)),
        [journalMap]
    );

    const currentJournalData = journalMap[activeJournalDate] || {
        date: activeJournalDate,
        title: '',
        content: '',
        mood: '',
        updatedAt: new Date()
    };

    const handlePageUpdate = (field, value) => {
        updateNotebookPage(activePage, { [field]: value });
    };

    const handleJournalUpdate = (field, value) => {
        updateJournalEntry(activeJournalDate, { [field]: value });
    };

    const filteredPages = pages.filter((p) =>
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredJournal = journalEntries.filter((entry) =>
        (entry.date || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const shiftJournalDay = (deltaDays) => {
        setActiveJournalDate((prev) => dayjs(prev).add(deltaDays, 'day').format('YYYY-MM-DD'));
        setMobileShowEditor(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 mb-24 md:mb-6 h-[calc(100vh-180px)] sm:h-[calc(100vh-140px)] flex flex-col font-sans"
        >
            {/* Header Zone */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 gap-6 shrink-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary">Neural Archive</Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">V.3.2 // JOURNAL MODE</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">The Vault</h1>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Edit3 className="w-3 h-3" />
                        Brain-Dump Interface & Timeline Journaling
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center bg-muted/20 p-0.5 rounded-lg border border-border/50 flex-1 sm:flex-initial">
                        <button
                            onClick={() => {
                                setActiveMode('pages');
                                setMobileShowEditor(false);
                            }}
                            className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeMode === 'pages' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Pages
                        </button>
                        <button
                            onClick={() => {
                                setActiveMode('journal');
                                setMobileShowEditor(false);
                            }}
                            className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeMode === 'journal' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Journal
                        </button>
                    </div>
                    <div className="relative group flex-1 sm:flex-initial">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                        <input
                            type="text"
                            placeholder={activeMode === 'journal' ? 'SEARCH JOURNAL...' : 'QUERY ARCHIVE...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-muted/30 border border-border rounded-lg pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest focus:border-primary/50 focus:bg-background transition-all focus:outline-none w-full sm:w-48 md:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Split Screen Dashboard Area */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0 pt-6 sm:pt-8">
                {/* Sidebar Navigation - List View */}
                <div className={`lg:w-80 flex flex-col gap-4 shrink-0 overflow-hidden h-full ${mobileShowEditor ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex-1 bg-secondary/10 border border-border rounded-[24px] sm:rounded-[32px] p-3 sm:p-4 shadow-none overflow-y-auto custom-scrollbar flex flex-col gap-3">
                        {activeMode === 'pages' ? (
                            pages.length === 0 ? (
                                <div className="flex items-center justify-center p-8 opacity-20">
                                    <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                </div>
                            ) : (
                                (searchQuery ? filteredPages : pages).map((page) => (
                                    <button
                                        key={page.pageNumber}
                                        onClick={() => {
                                            setActivePage(page.pageNumber);
                                            setMobileShowEditor(true);
                                        }}
                                        className={`flex items-start gap-4 p-3.5 rounded-2xl text-left transition-all border w-full shrink-0 ${activePage === page.pageNumber
                                            ? 'bg-background border-primary shadow-sm shadow-primary/5'
                                            : 'bg-transparent border-transparent hover:bg-muted/50 hover:border-border'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                                            <Hash className={`w-3 h-3 ${activePage === page.pageNumber ? 'text-primary' : 'text-muted-foreground opacity-30'}`} />
                                            <span className={`text-[8px] font-black font-mono ${activePage === page.pageNumber ? 'text-primary' : 'opacity-20'}`}>
                                                {page.pageNumber.toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div className="overflow-hidden space-y-1">
                                            <h3 className={`font-black text-[11px] uppercase tracking-tight truncate ${activePage === page.pageNumber ? 'text-foreground' : 'text-muted-foreground opacity-60'}`}>
                                                {page.title || `PAGE LOG ${page.pageNumber}`}
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground font-bold opacity-30 truncate leading-none">
                                                {page.content ? page.content.substring(0, 40) : 'NO CONTENT DATA'}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )
                        ) : (
                            (searchQuery ? filteredJournal : journalEntries).map((entry) => (
                                <button
                                    key={entry.date}
                                    onClick={() => {
                                        setActiveJournalDate(entry.date);
                                        setMobileShowEditor(true);
                                    }}
                                    className={`flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all border w-full shrink-0 ${activeJournalDate === entry.date
                                        ? 'bg-background border-primary shadow-sm shadow-primary/5'
                                        : 'bg-transparent border-transparent hover:bg-muted/50 hover:border-border'
                                        }`}
                                >
                                    <CalendarDays className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${activeJournalDate === entry.date ? 'text-primary' : 'text-muted-foreground opacity-40'}`} />
                                    <div className="overflow-hidden space-y-1">
                                        <h3 className={`font-black text-[10px] uppercase tracking-widest truncate ${activeJournalDate === entry.date ? 'text-foreground' : 'text-muted-foreground opacity-70'}`}>
                                            {dayjs(entry.date).format('ddd, DD MMM')}
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground font-bold opacity-40 truncate leading-none">
                                            {entry.title || 'Daily reflection'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Editor Card View */}
                <Card className={`flex-1 bg-card border-border shadow-none rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-0 flex flex-col min-h-0 relative overflow-hidden ${mobileShowEditor ? 'flex' : 'hidden lg:flex'}`}>
                    <AnimatePresence mode="wait">
                        {activeMode === 'pages' && currentPageData ? (
                            <motion.div
                                key={`page-${currentPageData.pageNumber}`}
                                initial={{ opacity: 0, scale: 0.995 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.995 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col h-full w-full"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-border/50 shrink-0 bg-muted/5 gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="lg:hidden h-8 px-2.5 text-[10px] font-black uppercase tracking-wider gap-1 border border-border/50 shrink-0"
                                            onClick={() => setMobileShowEditor(false)}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Back
                                        </Button>
                                        <input
                                            type="text"
                                            value={currentPageData.title || ''}
                                            onChange={(e) => handlePageUpdate('title', e.target.value)}
                                            placeholder="ARCHIVE TITLE..."
                                            className="text-xl sm:text-2xl md:text-3xl font-black bg-transparent border-none focus:outline-none text-foreground w-full placeholder:opacity-10 tracking-tighter"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0 border-border/50">
                                        <VoiceDictation 
                                            onTranscribed={(text) => {
                                                const currentContent = currentPageData.content || '';
                                                handlePageUpdate('content', currentContent ? `${currentContent}\n${text}` : text);
                                            }}
                                        />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30">Last Mutation</span>
                                            <span className="text-[10px] font-mono font-bold text-primary">
                                                {dayjs(currentPageData.updatedAt || new Date()).format('DD.MM.YY // HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 relative p-5 sm:p-8">
                                    <textarea
                                        value={currentPageData.content || ''}
                                        onChange={(e) => handlePageUpdate('content', e.target.value)}
                                        placeholder="INPUT COGNITIVE DATA..."
                                        className="w-full h-full bg-transparent border-none text-base sm:text-lg font-bold leading-relaxed text-foreground focus:outline-none placeholder:opacity-5 resize-none custom-scrollbar pb-12"
                                    />
                                </div>
                            </motion.div>
                        ) : activeMode === 'journal' ? (
                            <motion.div
                                key={`journal-${activeJournalDate}`}
                                initial={{ opacity: 0, scale: 0.995 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.995 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col h-full w-full"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-border/50 shrink-0 bg-muted/5 gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="lg:hidden h-8 px-2.5 text-[10px] font-black uppercase tracking-wider gap-1 border border-border/50 shrink-0"
                                                onClick={() => setMobileShowEditor(false)}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Back
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftJournalDay(-1)}>
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftJournalDay(1)}>
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[10px] font-black uppercase tracking-widest"
                                                onClick={() => setActiveJournalDate(dayjs().format('YYYY-MM-DD'))}
                                            >
                                                Today
                                            </Button>
                                        </div>
                                        <div className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tighter">
                                            {dayjs(activeJournalDate).format('dddd, MMMM D')}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between lg:justify-end gap-4 sm:gap-6 shrink-0 w-full lg:w-auto border-t lg:border-0 pt-3 lg:pt-0 border-border/50 flex-wrap">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 text-[10px] font-black uppercase tracking-widest gap-1.5 border border-border/50 hover:bg-secondary/20 transition-all cursor-pointer"
                                            onClick={async () => {
                                                if (!currentJournalData.content?.trim()) return;
                                                setAuditing(true);
                                                try {
                                                    const res = await auditJournalMindset(currentJournalData.content.trim());
                                                    if (res) {
                                                        setCbtResult(res);
                                                        setShowCbtPanel(true);
                                                        toast.success("Mindset Audit finished!", { icon: '🧠' });
                                                    }
                                                } catch (err) {
                                                    console.error("CBT Audit failed:", err);
                                                    toast.error("AI connection issues during audit.");
                                                } finally {
                                                    setAuditing(false);
                                                }
                                            }}
                                            disabled={auditing || !(currentJournalData.content || '').trim()}
                                        >
                                            {auditing ? (
                                                <div className="w-3.5 h-3.5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Brain className="w-3.5 h-3.5 text-primary" />
                                                    Audit Mindset
                                                </>
                                            )}
                                        </Button>
                                        <VoiceDictation 
                                            onTranscribed={(text) => {
                                                const currentContent = currentJournalData.content || '';
                                                handleJournalUpdate('content', currentContent ? `${currentContent}\n${text}` : text);
                                            }}
                                        />
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 leading-none">Last Mutation</span>
                                            <span className="text-[10px] font-mono font-bold text-primary leading-none">
                                                {dayjs(currentJournalData.updatedAt || new Date()).format('DD.MM.YY // HH:mm')}
                                            </span>
                                            <input
                                                value={currentJournalData.mood || ''}
                                                onChange={(e) => handleJournalUpdate('mood', e.target.value)}
                                                placeholder="Mood"
                                                className="w-24 bg-muted/40 border border-border rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 relative p-5 sm:p-8 overflow-y-auto custom-scrollbar">
                                    <input
                                        type="text"
                                        value={currentJournalData.title || ''}
                                        onChange={(e) => handleJournalUpdate('title', e.target.value)}
                                        placeholder="DAILY HEADLINE..."
                                        className="w-full text-lg md:text-xl font-black bg-transparent border-none focus:outline-none text-foreground placeholder:opacity-20 tracking-tight mb-4 shrink-0"
                                    />
                                    <textarea
                                        value={currentJournalData.content || ''}
                                        onChange={(e) => handleJournalUpdate('content', e.target.value)}
                                        placeholder="What happened today? What did you learn? What matters tomorrow?"
                                        className="w-full h-48 bg-transparent border-none text-base md:text-lg font-bold leading-relaxed text-foreground focus:outline-none placeholder:opacity-10 resize-none custom-scrollbar shrink-0 mb-4"
                                    />

                                    {/* CBT Mindset Audit Panel */}
                                    <AnimatePresence>
                                        {showCbtPanel && cbtResult && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 15 }}
                                                className="mt-6 p-6 border-2 border-border/55 rounded-3xl bg-secondary/5 space-y-4 text-left relative overflow-hidden shrink-0"
                                            >
                                                <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                                                    <Brain className="w-16 h-16" />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 leading-none">
                                                        <Sparkles className="w-3 h-3 text-amber-400" /> CBT Cognitive Distortion Audit
                                                    </span>
                                                    <button onClick={() => setShowCbtPanel(false)} className="text-[10px] font-black text-muted-foreground hover:text-foreground cursor-pointer">
                                                        ✕ DISMISS
                                                    </button>
                                                </div>

                                                {/* Distortions badges */}
                                                <div className="space-y-2">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">Distortions Flagged</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {cbtResult.distortionsFound?.map((item, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-[10px] font-bold py-1 bg-amber-500/5 border-amber-500/20 text-amber-800 rounded-lg">
                                                                {item}
                                                            </Badge>
                                                        ))}
                                                        {(!cbtResult.distortionsFound || cbtResult.distortionsFound.length === 0) && (
                                                            <Badge variant="outline" className="text-[10px] font-bold py-1 bg-emerald-500/5 border-emerald-500/20 text-emerald-800 rounded-lg">
                                                                None detected 🌿
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Reframed perspective */}
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">Reframed Mindset Perspective</span>
                                                    <p className="font-serif text-sm leading-relaxed text-foreground italic bg-background border border-border/50 p-4 rounded-xl">
                                                        "{cbtResult.reframedText}"
                                                    </p>
                                                </div>

                                                {/* Cognitive Advice */}
                                                {cbtResult.advice && (
                                                    <div className="p-4 bg-primary/[0.02] border border-primary/10 rounded-xl space-y-1">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary block">Calibration Practice</span>
                                                        <span className="text-xs font-bold text-muted-foreground leading-relaxed">{cbtResult.advice}</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
                                <FileText className="w-12 h-12" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize Page Loop</p>
                            </div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </motion.div>
    );
}

export default Notebook;
