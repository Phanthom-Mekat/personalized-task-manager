import React, { useState } from 'react';
import { usePlanner } from '../../../provider/PlannerProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Quote, Send, Book } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

export default function QuickCaptureModal({ isOpen, onClose }) {
    const { data: { library }, addQuote } = usePlanner();
    const [selectedBookId, setSelectedBookId] = useState('');
    const [quoteText, setQuoteText] = useState('');
    const [pageInfo, setPageInfo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only show active books for quick capture
    const activeBooks = library?.filter(b => ['up_next', 'reading', 'awaiting_review'].includes(b.status)) || [];

    const handleSave = async () => {
        if (!selectedBookId || !quoteText.trim()) return;
        
        setIsSubmitting(true);
        try {
            await addQuote(selectedBookId, {
                quote: quoteText,
                page: pageInfo || undefined
            });
            
            // Reset and close
            setQuoteText('');
            setPageInfo('');
            onClose();
        } catch (error) {
            console.error("Failed to add quote", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden relative"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black text-white">
                                    <Quote className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <h3 className="font-black tracking-tight text-xl">Quick Capture</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold font-mono">Insight extraction</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Book Selection */}
                            <div className="relative group">
                                <Book className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <select 
                                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-zinc-200 bg-white text-sm font-bold text-black appearance-none outline-none focus:border-black focus:ring-1 focus:ring-black"
                                    value={selectedBookId}
                                    onChange={(e) => setSelectedBookId(e.target.value)}
                                >
                                    <option value="" disabled>Select Target Book...</option>
                                    {activeBooks.map(b => (
                                        <option key={b._id} value={b._id}>{b.title}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-2 text-zinc-400">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>

                            {/* Quote Area */}
                            <Textarea 
                                placeholder="Paste or type the quote here..." 
                                value={quoteText}
                                onChange={e => setQuoteText(e.target.value)}
                                className="min-h-[140px] text-base font-serif resize-none rounded-2xl bg-zinc-50 border-transparent focus-visible:ring-black focus:bg-white"
                            />
                            
                            {/* Page Info */}
                            <div className="flex gap-4 items-center">
                                <input 
                                    type="text" 
                                    placeholder="Pg. / Loc." 
                                    value={pageInfo}
                                    onChange={e => setPageInfo(e.target.value)}
                                    className="w-1/3 px-4 py-3 rounded-xl border border-zinc-200 text-sm font-bold outline-none focus:border-black"
                                />
                                
                                <button 
                                    onClick={handleSave}
                                    disabled={!selectedBookId || !quoteText.trim() || isSubmitting}
                                    className="flex-1 h-12 flex items-center justify-center gap-2 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-30 transition-all active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                    {isSubmitting ? 'Saving...' : 'Commit Insight'}
                                </button>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
