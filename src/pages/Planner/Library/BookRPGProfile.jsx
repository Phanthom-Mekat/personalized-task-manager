import React, { useState } from 'react';
import { usePlanner } from '../../../provider/PlannerProvider';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Lock, ChevronRight, Brain, Zap, Network, History, Map, Quote } from 'lucide-react';
import dayjs from 'dayjs';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast';

const LEVELS = [
    { id: 1, label: "Map", icon: Map, title: "Pre-Reading Mapping" },
    { id: 2, label: "Hunt", icon: Zap, title: "Contradiction Hunting" },
    { id: 3, label: "Stack", icon: Network, title: "Concept Stacking" },
    { id: 4, label: "Recall", icon: Brain, title: "Active Recall" },
    { id: 5, label: "Reflect", icon: History, title: "30-Day Reflection" }
];

export default function BookRPGProfile({ book, onClose }) {
    const { updateBook, deleteBook, evaluateBookRecall } = usePlanner();
    const [localBook, setLocalBook] = useState(book);
    const [evaluating, setEvaluating] = useState(false);
    
    // Auto-save logic
    const handleUpdate = (updates) => {
        const nextState = { ...localBook, ...updates };
        setLocalBook(nextState);
        updateBook(localBook._id, updates);
    };

    const advanceLevel = (targetLevel) => {
        let status = localBook.status;
        if (targetLevel === 2) status = 'reading';
        if (targetLevel === 4) status = 'awaiting_review';
        if (targetLevel === 5) {
            status = 'internalized';
            handleUpdate({ level: targetLevel, status, finishedAt: new Date().toISOString() });
            return;
        }
        handleUpdate({ level: targetLevel, status });
    };

    const currentLevel = localBook.level || 1;

    const renderLevelContent = () => {
        switch(currentLevel) {
            case 1:
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-3 block">What is this book about?</label>
                            <Textarea 
                                placeholder="Write the main idea and look at the chapter names..."
                                value={localBook.thesis || ''}
                                onChange={e => handleUpdate({ thesis: e.target.value })}
                                className="min-h-[150px] resize-none text-base p-6 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-black"
                            />
                        </div>
                        <button 
                            disabled={!localBook.thesis?.trim()}
                            onClick={() => advanceLevel(2)}
                            className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-opacity"
                        >
                            Start Reading
                        </button>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-3 block">Do you disagree with anything?</label>
                            <Textarea 
                                placeholder="I don't agree with the writer about..."
                                value={localBook.contradiction || ''}
                                onChange={e => handleUpdate({ contradiction: e.target.value })}
                                className="min-h-[150px] resize-none text-base p-6 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-black"
                            />
                        </div>
                        <button 
                            disabled={!localBook.contradiction?.trim()}
                            onClick={() => advanceLevel(3)}
                            className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-opacity"
                        >
                            Disagree Note Saved
                        </button>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-3 block">Does this connect to another book?</label>
                            <Textarea 
                                placeholder="This reminds me of a book named [Book Name] because..."
                                value={(localBook.linkedBooks || []).join(', ')}
                                onChange={e => handleUpdate({ linkedBooks: [e.target.value] })}
                                className="min-h-[150px] resize-none text-base p-6 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-black"
                            />
                        </div>
                        <button 
                            disabled={(!localBook.linkedBooks || localBook.linkedBooks.length === 0 || !localBook.linkedBooks[0])}
                            onClick={() => advanceLevel(4)}
                            className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-opacity"
                        >
                            Finish Reading
                        </button>
                    </motion.div>
                );
            case 4:
                const evaluation = localBook.evaluation;
                if (evaluation) {
                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-6 bg-zinc-50 border-2 border-zinc-100 rounded-[24px] text-center sm:text-left">
                                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center bg-black text-white rounded-full font-black text-2xl">
                                    {evaluation.accuracyScore}%
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-sm uppercase tracking-wider text-black">Recall Accuracy Evaluated</h4>
                                    <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider leading-relaxed">
                                        Your cognitive retention has been mapped and benchmarked by Gemini AI.
                                    </p>
                                </div>
                            </div>

                            {/* Mastered Concepts */}
                            <div className="space-y-2 text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block pl-1">Mastered Insights</span>
                                <div className="space-y-2">
                                    {evaluation.masteredConcepts?.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-800 leading-relaxed text-left">
                                            {item}
                                        </div>
                                    ))}
                                    {(!evaluation.masteredConcepts || evaluation.masteredConcepts.length === 0) && (
                                        <div className="p-4 bg-zinc-50 text-zinc-400 text-xs font-bold rounded-2xl text-left">No concepts mastered yet. Keep studying!</div>
                                    )}
                                </div>
                            </div>

                            {/* Missed Concepts */}
                            <div className="space-y-2 text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 block pl-1">Key Insights Missed</span>
                                <div className="space-y-2">
                                    {evaluation.missedConcepts?.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs font-bold text-amber-800 leading-relaxed text-left">
                                            {item}
                                        </div>
                                    ))}
                                    {(!evaluation.missedConcepts || evaluation.missedConcepts.length === 0) && (
                                        <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl text-left">Perfect! You captured all major insights!</div>
                                    )}
                                </div>
                            </div>

                            {/* Coach Feedback */}
                            <div className="p-6 bg-zinc-50 rounded-2xl space-y-2 text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">AI Retention Coach Feedback</span>
                                <p className="font-serif text-sm text-zinc-650 leading-relaxed italic text-left">
                                    "{evaluation.feedback}"
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => handleUpdate({ evaluation: null })}
                                    className="flex-1 py-4 border-2 border-zinc-200 hover:border-black text-black rounded-xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                                >
                                    Improve & Re-Test
                                </button>
                                <button
                                    onClick={() => advanceLevel(5)}
                                    className="flex-1 py-4 bg-black text-white hover:bg-zinc-800 rounded-xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                                >
                                    Unlock Level 5
                                </button>
                            </div>
                        </motion.div>
                    );
                }

                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded inline-block uppercase mb-3">Memory Challenge</label>
                            <p className="text-sm font-medium text-zinc-600 mb-6">Close the book. Write down everything you remember. This helps you not forget.</p>
                            <Textarea 
                                placeholder="Write your summary here without looking..."
                                value={localBook.activeRecallSummary || ''}
                                onChange={e => handleUpdate({ activeRecallSummary: e.target.value })}
                                className="min-h-[250px] resize-none text-base p-6 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-black"
                                disabled={evaluating}
                            />
                        </div>
                        {evaluating ? (
                            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 font-mono">Analyzing memory retention...</span>
                            </div>
                        ) : (
                            <button 
                                disabled={(localBook.activeRecallSummary || '').length < 50}
                                onClick={async () => {
                                    setEvaluating(true);
                                    try {
                                        const result = await evaluateBookRecall({
                                            bookTitle: localBook.title,
                                            author: localBook.author,
                                            thesis: localBook.thesis,
                                            contradiction: localBook.contradiction,
                                            linkedBooks: localBook.linkedBooks,
                                            activeRecallSummary: localBook.activeRecallSummary
                                        });
                                        if (result) {
                                            handleUpdate({ evaluation: result });
                                        }
                                    } catch (err) {
                                        console.error("Recall evaluation failed:", err);
                                        toast.error("Failed to connect with AI coach. Please try again.");
                                    } finally {
                                        setEvaluating(false);
                                    }
                                }}
                                className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-opacity cursor-pointer"
                            >
                                Evaluate Recall with AI ⚡
                            </button>
                        )}
                    </motion.div>
                );
            case 5:
                const finishedAt = localBook.finishedAt ? dayjs(localBook.finishedAt) : dayjs();
                const daysPassed = dayjs().diff(finishedAt, 'day');
                const isReady = daysPassed >= 30;

                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="p-6 rounded-2xl bg-emerald-50 border-emerald-100 flex items-center justify-between">
                            <div>
                                <h4 className="font-black text-emerald-900 uppercase tracking-widest text-xs mb-1">Final Step: 30 Days Later</h4>
                                <p className="text-emerald-700 text-sm">{daysPassed} / 30 Days Passed</p>
                            </div>
                            <History className={`w-8 h-8 ${isReady ? 'text-emerald-600' : 'text-emerald-300'}`} />
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-3 block">Did this book change how you think or act?</label>
                            <Textarea 
                                placeholder="Yes, it changed my life because... or No, I just read it."
                                value={localBook.thirtyDayReflection || ''}
                                onChange={e => handleUpdate({ thirtyDayReflection: e.target.value })}
                                disabled={!isReady}
                                className="min-h-[150px] resize-none text-base p-6 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-600 disabled:opacity-50"
                            />
                        </div>
                        <button 
                            disabled={!isReady || !(localBook.thirtyDayReflection || '').trim()}
                            onClick={() => handleUpdate({ status: 'internalized' })}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all shadow-xl shadow-emerald-600/20"
                        >
                            Mark As Mastered
                        </button>
                    </motion.div>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col md:flex-row">
            {/* Left Nav Pane */}
            <div className="w-full md:w-1/3 bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-200 p-6 sm:p-8 flex flex-col justify-between shrink-0">
                <div>
                    <button onClick={onClose} className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-6 md:mb-12">
                        <ArrowLeft className="w-4.5 h-4.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
                    </button>
                    
                    <div className="mb-6 md:mb-12">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 leading-tight text-black">{localBook.title}</h1>
                        <p className="text-zinc-500 text-sm font-medium">{localBook.author}</p>
                    </div>

                    {/* Progress indicator card for Mobile */}
                    <div className="block md:hidden mb-6 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm select-none">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Current Level</span>
                            <span className="text-xs font-black text-black font-mono">LVL {currentLevel} / 5</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                                <div className="h-full bg-black rounded-full" style={{ width: `${(currentLevel / 5) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-black shrink-0">{LEVELS[currentLevel-1].title}</span>
                        </div>
                    </div>

                    {/* Desktop Levels Index List (Hidden on Mobile) */}
                    <div className="hidden md:block space-y-1 select-none">
                        {LEVELS.map((lvl) => {
                            const isPast = currentLevel > lvl.id;
                            const isCurrent = currentLevel === lvl.id;
                            const isLocked = currentLevel < lvl.id;
                            const Icon = lvl.icon;

                            return (
                                <div key={lvl.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isCurrent ? 'bg-white shadow-sm border border-zinc-200' : 'opacity-60'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPast ? 'bg-black text-white' : isCurrent ? 'bg-zinc-200 text-black' : 'bg-zinc-100 text-zinc-400'}`}>
                                        {isPast ? <Check className="w-4 h-4" /> : isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Level {lvl.id}</div>
                                        <div className={`font-bold text-sm ${isCurrent ? 'text-black' : 'text-zinc-500'}`}>{lvl.title}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-6 md:pt-8 border-t md:border-0 border-zinc-200/60 flex justify-between md:block shrink-0">
                     <button 
                         onClick={() => {
                             if(confirm('Delete this book record?')) {
                                 deleteBook(localBook._id);
                                 onClose();
                             }
                         }}
                         className="text-[10px] uppercase font-black tracking-widest text-red-500 hover:underline"
                     >
                         Delete Record
                     </button>
                </div>
            </div>

            {/* Right Action Pane */}
            <div className="w-full md:w-2/3 p-5 sm:p-8 lg:p-16 relative">
                <div className="max-w-xl mx-auto h-full flex flex-col">
                    <div className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-10 text-zinc-400">
                        <span className="text-[10px] uppercase font-black tracking-widest border border-zinc-200 rounded px-2 py-0.5">LVL {currentLevel}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-bold text-xs sm:text-sm">{LEVELS[currentLevel-1].title}</span>
                    </div>
                    
                    <div className="flex-1">
                        {renderLevelContent()}
                    </div>

                    {/* Quotes section (always visible below main action) */}
                    {localBook.quotes?.length > 0 && (
                         <div className="mt-16 pt-16 border-t border-zinc-100">
                             <h4 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-6 flex items-center gap-2">
                                <Quote className="w-3 h-3" /> Captured Insights
                             </h4>
                             <div className="space-y-4">
                                 {localBook.quotes.map(q => (
                                     <div key={q._id} className="p-6 rounded-2xl bg-white border border-zinc-200">
                                         <p className="font-serif text-lg leading-relaxed mb-3">"{q.quote}"</p>
                                         <div className="flex justify-between items-end text-xs text-zinc-400 font-mono">
                                             <span>pg. {q.page || '?'}</span>
                                             <span>{dayjs(q.createdAt).format('MMM D, YYYY')}</span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}
