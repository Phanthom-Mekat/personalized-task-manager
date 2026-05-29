import React, { useEffect, useState } from 'react';
import { usePlanner } from '../../../provider/PlannerProvider';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Clock, Target, CheckCircle, Search, Quote } from 'lucide-react';
import dayjs from 'dayjs';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuickCaptureModal from '../../../components/planner/Library/QuickCaptureModal';

const STATUSES = [
    { id: 'up_next', label: 'Up Next', icon: Target, border: 'border-zinc-200', bg: 'bg-white' },
    { id: 'reading', label: 'Reading', icon: BookOpen, border: 'border-black', bg: 'bg-zinc-50' },
    { id: 'awaiting_review', label: 'Awaiting 30-Day', icon: Clock, border: 'border-orange-200', bg: 'bg-orange-50' },
    { id: 'internalized', label: 'Internalized', icon: CheckCircle, border: 'border-emerald-200', bg: 'bg-emerald-50' }
];

export default function LibraryCommand({ onOpenBook }) {
    const { data: { library }, fetchLibrary, createBook } = usePlanner();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddingBook, setIsAddingBook] = useState(false);
    const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
    const [newBookTitle, setNewBookTitle] = useState('');
    const [newBookAuthor, setNewBookAuthor] = useState('');

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const handleCreateBook = () => {
        if (!newBookTitle.trim()) return;
        
        createBook({
            title: newBookTitle,
            author: newBookAuthor || "Unknown Author",
            totalChapters: 1
        });
        
        setNewBookTitle('');
        setNewBookAuthor('');
        setIsAddingBook(false);
    };

    const getBooksByStatus = (statusId) => {
        return library
            ?.filter(b => b.status === statusId && b.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) || [];
    };

    return (
        <div className="min-h-screen pb-32 text-zinc-900 bg-transparent selection:bg-zinc-200 flex flex-col relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[1200px] w-full mx-auto px-6 py-12 relative z-10"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-black mb-2 tracking-tighter">LIBRARY COMM</h1>
                        <p className="text-sm tracking-widest text-zinc-500 uppercase font-bold pl-1 font-mono">Retention Engine & Strategic Ledger</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <button 
                            onClick={() => setIsQuickCaptureOpen(true)}
                            className="w-10 h-10 rounded-full bg-zinc-100/80 text-zinc-600 flex items-center justify-center hover:bg-black hover:text-white active:scale-95 transition-all group flex-shrink-0"
                        >
                            <Quote className="w-4 h-4 fill-current" />
                        </button>
                        <div className="relative group flex-1 sm:flex-none">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search stack..."
                                className="pl-9 pr-4 py-2.5 rounded-full border border-zinc-200 bg-white text-xs font-black uppercase tracking-widest text-black outline-none focus:border-black focus:ring-1 focus:ring-black transition-all w-full sm:w-48 sm:focus:w-64"
                            />
                        </div>
                        <button 
                            onClick={() => setIsAddingBook(true)}
                            className="px-4 sm:px-6 py-2.5 rounded-full bg-black text-white font-black uppercase text-[10px] sm:text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-95 transition-all flex-shrink-0"
                        >
                            <Plus className="w-4 h-4" /> Add Book
                        </button>
                    </div>
                </div>

                {isAddingBook && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="mb-8 p-6 bg-white border border-zinc-200 rounded-3xl flex flex-col md:flex-row gap-4 items-end shadow-sm"
                    >
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2 block">Book Title</label>
                            <input 
                                type="text"
                                placeholder="Enter book name..."
                                value={newBookTitle}
                                onChange={e => setNewBookTitle(e.target.value)}
                                className="w-full text-lg outline-none border-b border-zinc-200 focus:border-black font-bold pb-2 transition-colors bg-transparent"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2 block">Author Name</label>
                            <input 
                                type="text"
                                placeholder="Who wrote it?"
                                value={newBookAuthor}
                                onChange={e => setNewBookAuthor(e.target.value)}
                                className="w-full text-lg outline-none border-b border-zinc-200 focus:border-black font-bold pb-2 transition-colors bg-transparent"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button 
                                onClick={() => setIsAddingBook(false)}
                                className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-zinc-200 text-xs font-black uppercase tracking-widest hover:bg-zinc-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateBook}
                                disabled={!newBookTitle.trim()}
                                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest disabled:opacity-30"
                            >
                                Save Book
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Dashboard Ledger (Kanban Style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STATUSES.map(col => {
                        const books = getBooksByStatus(col.id);
                        const Icon = col.icon;
                        
                        return (
                            <div key={col.id} className="flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b border-zinc-200 pb-3 pl-1">
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-zinc-400" />
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-600">{col.label}</h3>
                                    </div>
                                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 rounded-sm font-mono">{books.length}</Badge>
                                </div>
                                
                                <div className="flex flex-col gap-3 min-h-[200px]">
                                    {books.map(book => (
                                        <motion.div
                                            key={book._id}
                                            layoutId={`book-${book._id}`}
                                            onClick={() => onOpenBook(book)}
                                            className={`p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${col.bg} ${col.border}`}
                                            whileHover={{ y: -2 }}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-black/5 text-black font-mono">
                                                    LVL {book.level || 1}
                                                </div>
                                                {book.quotes?.length > 0 && (
                                                    <div className="flex items-center gap-1 text-zinc-400">
                                                        <Quote className="w-3 h-3" />
                                                        <span className="text-[9px] font-mono">{book.quotes.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-base leading-tight mb-1 text-black line-clamp-2">{book.title}</h4>
                                            <p className="text-xs text-zinc-500 italic mb-4">{book.author}</p>
                                            
                                            {/* Progress Rings/Bars alternative: Minimalist track */}
                                            <div className="flex gap-1 h-1">
                                                {[1,2,3,4,5].map(lvl => (
                                                    <div 
                                                        key={lvl} 
                                                        className={`flex-1 rounded-full ${
                                                            (book.level || 1) > lvl ? 'bg-black' : 
                                                            (book.level || 1) === lvl ? 'bg-black/40' : 'bg-black/10'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                    
                                    {books.length === 0 && (
                                        <div className="border-2 border-dashed border-zinc-100 rounded-2xl h-24 flex items-center justify-center text-[10px] uppercase tracking-widest font-black text-zinc-300">
                                            Empty zone
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <QuickCaptureModal isOpen={isQuickCaptureOpen} onClose={() => setIsQuickCaptureOpen(false)} />
            </motion.div>
        </div>
    );
}
