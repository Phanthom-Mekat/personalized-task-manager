import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../provider/AuthProvider';
import { API_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Brain, Network, Clock, Sparkles,
    Download, Upload, Settings, ChevronRight, ChevronDown, BookOpen, X, Printer, Copy, Check, Loader2,
    Volume2, TrendingUp, Zap
} from 'lucide-react';

import CloneChat from '../../components/companion/CloneChat';
import CloneInterview from '../../components/companion/CloneInterview';
import SecondBrainGraph from '../../components/companion/SecondBrainGraph';
import LifeTimeline from '../../components/companion/LifeTimeline';
import MemoryVault from '../../components/companion/MemoryVault';
import VoiceBriefing from '../../components/companion/VoiceBriefing';
import TrajectorySimulator from '../../components/companion/TrajectorySimulator';
import DailyInsights from '../../components/companion/DailyInsights';

const TABS = [
    { id: 'chat',       label: 'Twin Chat',     icon: MessageCircle },
    { id: 'vault',      label: 'Memory Vault',  icon: Brain },
    { id: 'training',   label: 'Train Clone',   icon: Sparkles },
    { id: 'graph',      label: 'Brain Graph',   icon: Network },
    { id: 'timeline',   label: 'Life Timeline', icon: Clock },
    { id: 'briefing',   label: 'Voice Brief',   icon: Volume2 },
    { id: 'simulator',  label: 'Simulator',     icon: TrendingUp },
    { id: 'insights',   label: 'Nudges',        icon: Zap },
];

function parseMarkdown(md) {
    if (!md) return null;
    return md.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
            return <h1 key={i} className="text-lg font-extrabold text-foreground tracking-tight mt-6 mb-3 border-b border-border/30 pb-1">{trimmed.slice(2)}</h1>;
        }
        if (trimmed.startsWith('## ')) {
            return <h2 key={i} className="text-sm font-bold text-violet-400 mt-5 mb-2">{trimmed.slice(3)}</h2>;
        }
        if (trimmed.startsWith('### ')) {
            return <h3 key={i} className="text-xs font-bold text-fuchsia-400 mt-4 mb-2">{trimmed.slice(4)}</h3>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return <li key={i} className="text-[11px] text-muted-foreground ml-4 list-disc mb-1 leading-relaxed">{trimmed.slice(2)}</li>;
        }
        if (trimmed.startsWith('> ')) {
            return <blockquote key={i} className="border-l-2 border-violet-500 bg-violet-500/5 px-3 py-2 text-xs italic my-3 text-muted-foreground rounded-r-md">{trimmed.slice(2)}</blockquote>;
        }
        if (!trimmed) {
            return <div key={i} className="h-2" />;
        }
        
        // Basic bold parser
        const boldRegex = /\*\*(.*?)\*\*/g;
        let parts = [];
        let lastIndex = 0;
        let match;
        while ((match = boldRegex.exec(trimmed)) !== null) {
            if (match.index > lastIndex) {
                parts.push(trimmed.slice(lastIndex, match.index));
            }
            parts.push(<strong key={match.index} className="font-bold text-foreground">{match[1]}</strong>);
            lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < trimmed.length) {
            parts.push(trimmed.slice(lastIndex));
        }
        return <p key={i} className="text-[11px] text-muted-foreground leading-relaxed mb-2">{parts.length > 0 ? parts : trimmed}</p>;
    });
}

function CompanionVault() {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('chat');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    
    // Dossier states
    const [dossierMarkdown, setDossierMarkdown] = useState('');
    const [compilingDossier, setCompilingDossier] = useState(false);
    const [showDossierModal, setShowDossierModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const apiCall = useCallback(async (method, path, body = null) => {
        if (!user?.uid) return null;
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${API_URL}/companion/${user.uid}${path}`, opts);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }, [user]);

    useEffect(() => {
        if (!user?.uid) return;
        setLoading(true);
        apiCall('GET', '/profile')
            .then(data => setProfile(data))
            .catch(err => console.error('Profile fetch failed:', err))
            .finally(() => setLoading(false));
    }, [user, apiCall]);

    const completeness = profile?.metadata?.completenessPercentage || 0;

    const handleExport = async () => {
        try {
            const backup = await apiCall('GET', '/backup/export');
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `second-brain-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const backup = JSON.parse(text);
                await apiCall('POST', '/backup/import', backup);
                const freshProfile = await apiCall('GET', '/profile');
                setProfile(freshProfile);
            } catch (err) {
                console.error('Import failed:', err);
            }
        };
        input.click();
    };

    // Dossier Generation
    const handleCompileDossier = async () => {
        setCompilingDossier(true);
        setShowDossierModal(true);
        try {
            const res = await apiCall('POST', '/dossier/generate');
            setDossierMarkdown(res.markdown || '');
        } catch (err) {
            console.error('Dossier compilation failed:', err);
            setDossierMarkdown('Error compiling intelligence dossier. Please ensure you have stored memories.');
        } finally {
            setCompilingDossier(false);
        }
    };

    const handleCopyDossier = () => {
        if (!dossierMarkdown) return;
        navigator.clipboard.writeText(dossierMarkdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrintDossier = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Digital Twin Identity Dossier</title>
                <style>
                    body { font-family: -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
                    h1 { border-bottom: 2px solid #5b21b6; padding-bottom: 8px; color: #5b21b6; font-size: 24px; }
                    h2 { color: #7c3aed; margin-top: 30px; font-size: 18px; }
                    p, li { font-size: 14px; color: #333; }
                    blockquote { border-left: 4px solid #7c3aed; padding-left: 15px; font-style: italic; color: #555; }
                </style>
            </head>
            <body>
                ${dossierMarkdown.replace(/\n/g, '<br>')}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground font-medium">Loading your Digital Twin…</span>
                </div>
            </div>
        );
    }

    const activeTabObj = TABS.find(t => t.id === activeTab);

    return (
        <div className="px-4 py-6 md:px-6 space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">AI Companion Vault</h1>
                        <p className="text-xs text-muted-foreground">
                            {profile?.basics?.fullName
                                ? `${profile.basics.fullName}'s Digital Twin`
                                : 'Your Personal Digital Twin'}
                        </p>
                    </div>
                </div>

                {/* Clone Completeness + Actions */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                    <button
                        onClick={handleCompileDossier}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:border-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Compile Dossier</span>
                    </button>

                    <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2 border border-border/50">
                        <div className="w-16 sm:w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${completeness}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                        <span className="text-xs font-bold text-foreground">{completeness}%</span>
                    </div>

                    <div className="flex items-center gap-1 bg-secondary/20 rounded-xl p-1 border border-border/30">
                        <button
                            onClick={handleExport}
                            className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                            title="Export Second Brain"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleImport}
                            className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                            title="Import Second Brain"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            {/* Mobile Dropdown Tab Selector */}
            <div className="relative md:hidden z-20">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-full flex items-center justify-between bg-secondary/40 hover:bg-secondary/60 active:scale-[0.99] border border-border/50 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-all"
                >
                    <div className="flex items-center gap-2">
                        {activeTabObj && <activeTabObj.icon className="w-4 h-4 text-violet-400" />}
                        <span>{activeTabObj?.label}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 mt-2 z-20 bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden p-1.5 space-y-0.5"
                            >
                                {TABS.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => {
                                            setActiveTab(id);
                                            setMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider transition-colors ${
                                            activeTab === id
                                                ? 'bg-secondary text-foreground'
                                                : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${activeTab === id ? 'text-violet-400' : 'text-muted-foreground'}`} />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex gap-1 bg-secondary/30 rounded-xl p-1 border border-border/40 overflow-x-auto scrollbar-none">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === id
                                ? 'bg-background text-foreground shadow-sm border border-border/60'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'chat' && (
                        <CloneChat apiCall={apiCall} profile={profile} />
                    )}
                    {activeTab === 'vault' && (
                        <MemoryVault apiCall={apiCall} />
                    )}
                    {activeTab === 'training' && (
                        <CloneInterview apiCall={apiCall} completeness={completeness} onProfileUpdate={setProfile} />
                    )}
                    {activeTab === 'graph' && (
                        <SecondBrainGraph apiCall={apiCall} />
                    )}
                    {activeTab === 'timeline' && (
                        <LifeTimeline profile={profile} apiCall={apiCall} />
                    )}
                    {activeTab === 'briefing' && (
                        <VoiceBriefing apiCall={apiCall} />
                    )}
                    {activeTab === 'simulator' && (
                        <TrajectorySimulator apiCall={apiCall} />
                    )}
                    {activeTab === 'insights' && (
                        <DailyInsights apiCall={apiCall} />
                    )}

                </motion.div>
            </AnimatePresence>

            {/* Premium Narrative Identity Dossier Modal */}
            <AnimatePresence>
                {showDossierModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border/80 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="bg-secondary/40 border-b border-border/60 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-violet-400" />
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider">Digital Twin Identity Dossier</h3>
                                        <p className="text-[10px] text-muted-foreground">Premium Narrative Synthesis Briefing</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {dossierMarkdown && (
                                        <>
                                            <button
                                                onClick={handleCopyDossier}
                                                className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                                title="Copy Dossier Markdown"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>Copy</span>
                                            </button>
                                            <button
                                                onClick={handlePrintDossier}
                                                className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                                title="Print Dossier"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                <span>Print</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowDossierModal(false)}
                                        className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 scrollbar-thin">
                                {compilingDossier ? (
                                    <div className="flex flex-col items-center justify-center py-32 gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                                        <span className="text-xs text-muted-foreground font-semibold">Running Identity Synthesis Agent...</span>
                                        <p className="text-[10px] text-muted-foreground/60 max-w-xs text-center">
                                            Analyzing relationships, mapping personality vectors, and summarizing childhood milestones into a cohesive briefing.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        {parseMarkdown(dossierMarkdown)}
                                    </div>
                                )}
                            </div>
                            
                            {/* Footer */}
                            <div className="bg-secondary/20 border-t border-border/40 px-6 py-3.5 flex justify-end text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                Classification: Strictly Confidential • Personal Use Only
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CompanionVault;
