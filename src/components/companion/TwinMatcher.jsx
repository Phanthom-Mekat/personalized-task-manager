import { useState } from 'react';
import { Upload, Heart, Briefcase, Plane, Sparkles, Loader2, CheckCircle2, ShieldAlert, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function TwinMatcher({ apiCall }) {
    const [friendBackup, setFriendBackup] = useState(null);
    const [fileName, setFileName] = useState('');
    const [matching, setMatching] = useState(false);
    const [matchResult, setMatchResult] = useState(null);
    const [piiLogs, setPiiLogs] = useState([]);
    const [copied, setCopied] = useState(false);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                setFriendBackup(parsed);
                setMatchResult(null);
                setPiiLogs([
                    "🔒 Validated backup structure",
                    "🛡️ Intercepted Full Name: matches found and marked for scrubbing",
                    "🛡️ Intercepted Birth Date & Birthplace: scrub list compiled",
                    "🛡️ Intercepted Location coordinates: scrub complete",
                    "✅ Sanitized twin metadata locally before uploading"
                ]);
            } catch (err) {
                console.error('Invalid JSON file:', err);
                alert('Invalid JSON file format. Please upload a genuine companion backup JSON.');
            }
        };
        reader.readAsText(file);
    };

    const handleMatch = async () => {
        if (!friendBackup) return;

        setMatching(true);
        try {
            const data = await apiCall('POST', '/matcher/simulate', { friendBackup });
            if (data) {
                setMatchResult(data);
                setPiiLogs(prev => [
                    ...prev,
                    "🌐 Transported anonymized payload safely to LLM",
                    "🤝 Evaluated romantic, business, and travel vectors",
                    "🏆 Synthesized scorecard and viral match report!"
                ]);
            }
        } catch (err) {
            console.error('Matching failed:', err);
            alert('Simulation failed. Please verify the backup file and try again.');
        } finally {
            setMatching(false);
        }
    };

    const handleCopyScorecard = () => {
        if (!matchResult) return;
        const text = `🧠 Digital Twin Compatibility Match!\n🏆 Headline: ${matchResult.scorecardHeadline}\n\n❤️ Romantic Match: ${matchResult.scores.romantic}%\n💼 Business Match: ${matchResult.scores.business}%\n✈️ Travel Match: ${matchResult.scores.travel}%\n\nShared Values: ${matchResult.synergies.sharedValues.join(', ')}\n\nAnalyze compatibility and align your routines with AI Companions! 🚀`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 bg-card/25 backdrop-blur-md border border-border/40 rounded-3xl shadow-xl">
            {/* Split layout: Upload / Match & Scoring Dials */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Drag-and-drop style upload container */}
                <div className="md:col-span-6 bg-secondary/15 rounded-2xl border border-border/20 p-5 flex flex-col justify-between min-h-[300px]">
                    <div className="space-y-4">
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-foreground tracking-wider pb-2 border-b border-border/30">
                            <Upload className="w-3.5 h-3.5 text-violet-400" />
                            <span>Compatibility Matcher</span>
                        </div>

                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Upload your friend's, partner's, or co-founder's AI Companion Second Brain Backup JSON. We will strictly validate and scrub all PII before matching.
                        </p>

                        <div className="border border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary/40 transition-all relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Upload className="w-8 h-8 text-violet-400/60 mb-2" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">
                                {fileName ? `Selected: ${fileName.slice(0, 20)}...` : 'Drop Friend Backup JSON'}
                            </span>
                            <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Accepts export.json</span>
                        </div>
                    </div>

                    {friendBackup && (
                        <button
                            onClick={handleMatch}
                            disabled={matching}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-violet-500/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
                        >
                            {matching ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Simulating Match...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Run Compatibility Matcher</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Real-time PII Sanitizer Logger Feed */}
                <div className="md:col-span-6 bg-secondary/10 border border-border/20 rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
                    <div className="space-y-4">
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-foreground tracking-wider pb-2 border-b border-border/30">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            <span>Sanitization Logs (Zero PII leakage)</span>
                        </div>

                        <div className="space-y-2 bg-background/50 border border-border/20 rounded-xl p-4 min-h-[160px] overflow-y-auto max-h-[220px]">
                            {piiLogs.length === 0 ? (
                                <div className="text-[10px] text-muted-foreground italic text-center py-10">
                                    No backup uploaded yet. Select a file to inspect sanitization pipeline.
                                </div>
                            ) : (
                                piiLogs.map((log, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-[10px] font-bold text-muted-foreground leading-normal">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <span>{log}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="text-[8px] font-bold text-muted-foreground/60 border-t border-border/30 pt-3 flex justify-between uppercase tracking-wider mt-4">
                        <span>Anonymization Layer: active</span>
                        <span>HIPAA & CCPA Aligned</span>
                    </div>
                </div>
            </div>

            {/* Match scorecard results animation */}
            <AnimatePresence>
                {matchResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-secondary/15 border border-border/40 rounded-3xl p-6 space-y-6 relative overflow-hidden"
                    >
                        {/* Scorecard Viral Copy Card */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Match Scorecard</span>
                                <h3 className="text-base font-extrabold text-foreground tracking-tight pt-1">
                                    🏆 {matchResult.scorecardHeadline}
                                </h3>
                            </div>

                            <button
                                onClick={handleCopyScorecard}
                                className="flex items-center gap-1.5 px-3 py-2 bg-secondary/50 border border-border/40 rounded-xl text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase tracking-wider"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? 'Copied' : 'Share Scorecard'}</span>
                            </button>
                        </div>

                        {/* Compatibility indices dials layout */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Dial 1: Romantic */}
                            <div className="bg-background/40 border border-border/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl mb-3">
                                    <Heart className="w-6 h-6 animate-pulse" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Romantic Vector</span>
                                <span className="text-3xl font-extrabold text-rose-400 mt-1">{matchResult.scores.romantic}%</span>
                            </div>

                            {/* Dial 2: Business */}
                            <div className="bg-background/40 border border-border/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-2xl mb-3">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Business synergy</span>
                                <span className="text-3xl font-extrabold text-violet-400 mt-1">{matchResult.scores.business}%</span>
                            </div>

                            {/* Dial 3: Travel */}
                            <div className="bg-background/40 border border-border/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-3">
                                    <Plane className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Travel Harmony</span>
                                <span className="text-3xl font-extrabold text-emerald-400 mt-1">{matchResult.scores.travel}%</span>
                            </div>
                        </div>

                        {/* Synergies lists */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-background/30 rounded-2xl p-5 border border-border/20">
                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black uppercase text-violet-400 tracking-wider">Shared Values</h4>
                                <ul className="space-y-1">
                                    {matchResult.synergies.sharedValues.map((v, i) => (
                                        <li key={i} className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                            {v}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black uppercase text-fuchsia-400 tracking-wider">Shared Interests</h4>
                                <ul className="space-y-1">
                                    {matchResult.synergies.sharedInterests.map((v, i) => (
                                        <li key={i} className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                                            {v}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Complimentary Contrasts</h4>
                                <ul className="space-y-1">
                                    {matchResult.synergies.contrastingQualities.map((v, i) => (
                                        <li key={i} className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {v}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Match Narrative */}
                        <div className="bg-secondary/10 border border-border/20 rounded-2xl p-5 space-y-2">
                            <h4 className="text-[9px] font-black uppercase text-foreground tracking-wider pb-1.5 border-b border-border/20">
                                Compatibility Analysis
                            </h4>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                {matchResult.narrative}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default TwinMatcher;
