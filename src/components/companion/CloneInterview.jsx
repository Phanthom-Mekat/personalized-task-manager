import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, SkipForward, RefreshCw, Loader2 } from 'lucide-react';

function CloneInterview({ apiCall, completeness, onProfileUpdate }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [answering, setAnswering] = useState(null);
    const [customInputs, setCustomInputs] = useState({});

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const data = await apiCall('GET', '/questions');
            setQuestions(data || []);
        } catch (err) {
            console.error('Failed to fetch questions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuestions(); }, [apiCall]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await apiCall('POST', '/questions/generate', { count: 8 });
            await fetchQuestions();
        } catch (err) {
            console.error('Generation failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleAnswer = async (questionId, answer) => {
        setAnswering(questionId);
        try {
            await apiCall('POST', '/questions/answer', { questionId, answer });
            setQuestions(prev => prev.filter(q => q._id !== questionId));
            const freshProfile = await apiCall('GET', '/profile');
            onProfileUpdate?.(freshProfile);
        } catch (err) {
            console.error('Answer submission failed:', err);
        } finally {
            setAnswering(null);
        }
    };

    const handleSkip = async (questionId) => {
        try {
            await apiCall('POST', '/questions/skip', { questionId });
            setQuestions(prev => prev.filter(q => q._id !== questionId));
        } catch (err) {
            console.error('Skip failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold">Clone Training Center</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Answer questions to make your Digital Twin smarter
                    </p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:border-violet-500/40 transition-all disabled:opacity-40"
                >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Generate Questions
                </button>
            </div>

            {/* Completeness Bar */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/40">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clone Profile</span>
                    <span className="text-sm font-bold text-foreground">{completeness}% Complete</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${completeness}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Question Cards */}
            {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center border border-violet-500/10">
                        <Sparkles className="w-6 h-6 text-violet-400" />
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        No pending questions. Hit "Generate Questions" to start building your clone profile.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {questions.map((q, idx) => (
                            <motion.div
                                key={q._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, x: -50 }}
                                transition={{ duration: 0.3 }}
                                className="bg-card border border-border/50 rounded-2xl p-5 space-y-4"
                            >
                                {/* Category Badge */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                                        {q.category}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/50">{idx + 1}/{questions.length}</span>
                                </div>

                                {/* Question Text */}
                                <p className="text-sm font-medium text-foreground leading-relaxed">{q.questionText}</p>

                                {/* Option Chips */}
                                <div className="flex flex-wrap gap-2">
                                    {q.options?.map((opt, oi) => (
                                        <button
                                            key={oi}
                                            onClick={() => handleAnswer(q._id, opt)}
                                            disabled={answering === q._id}
                                            className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/40 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-40"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Answer */}
                                {q.allowCustomAnswer && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Type your own answer…"
                                            value={customInputs[q._id] || ''}
                                            onChange={(e) => setCustomInputs(prev => ({ ...prev, [q._id]: e.target.value }))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && customInputs[q._id]?.trim()) {
                                                    handleAnswer(q._id, customInputs[q._id].trim());
                                                }
                                            }}
                                            className="flex-1 bg-secondary/30 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                                        />
                                        <button
                                            onClick={() => {
                                                if (customInputs[q._id]?.trim()) {
                                                    handleAnswer(q._id, customInputs[q._id].trim());
                                                }
                                            }}
                                            disabled={!customInputs[q._id]?.trim() || answering === q._id}
                                            className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold disabled:opacity-30 hover:bg-primary/20 transition-colors"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                {/* Skip */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleSkip(q._id)}
                                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                    >
                                        <SkipForward className="w-3 h-3" />
                                        Skip
                                    </button>
                                </div>

                                {/* Loading overlay */}
                                {answering === q._id && (
                                    <div className="flex items-center gap-2 text-xs text-violet-400">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Syncing to your Digital Twin…
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default CloneInterview;
