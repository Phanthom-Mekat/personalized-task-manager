import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlanner } from '../../provider/PlannerProvider';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
    Rocket, Plus, ArrowLeft, ChevronRight, Trash2, Check,
    Target, DollarSign, TrendingUp, StickyNote, Flag,
    MoreHorizontal, Pause, Play, CheckCircle2, Archive,
    Calendar, Zap, PackageOpen, GripVertical, X, Smile, Send
} from 'lucide-react';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// ─── ROUTE LIBRARY VIEW ─────────────────────────────────────
function RouteLibrary({ routes, loading, onCreate, onSelect }) {
    const { generateRouteBlueprint } = usePlanner();
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newEmoji, setNewEmoji] = useState('🚀');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [useAI, setUseAI] = useState(false);
    const [generating, setGenerating] = useState(false);
    const emojiRef = useRef(null);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setGenerating(true);
        try {
            let payload = { title: newTitle.trim(), emoji: newEmoji };
            if (useAI) {
                const blueprint = await generateRouteBlueprint(newTitle.trim(), newTitle.trim());
                if (blueprint) {
                    payload = {
                        ...payload,
                        phases: blueprint.phases,
                        actions: blueprint.actions,
                        metrics: blueprint.metrics,
                        milestones: blueprint.milestones
                    };
                }
            }
            const route = await onCreate(payload);
            setNewTitle('');
            setNewEmoji('🚀');
            setUseAI(false);
            setShowCreate(false);
            if (route) onSelect(route.routeId);
        } catch (err) {
            console.error("AI Route generation failed:", err);
            toast.error(useAI ? "Failed to generate AI roadmap. Let's create an empty route for now!" : "Failed to launch route. Please check your network connection.");
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statusColors = {
        active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        paused: 'bg-amber-100 text-amber-700 border-amber-200',
        completed: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 mb-32 md:mb-12 space-y-12 bg-white min-h-screen text-zinc-900"
        >
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 pb-10 border-b-2 border-zinc-100">
                <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Roadmap Command Center</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-black uppercase leading-[0.85]">
                        Roadmap<span className="text-zinc-200">.Planner</span>
                    </h1>
                    <p className="text-sm text-zinc-400 font-medium max-w-lg">
                        Turn every business idea into an executable blueprint. Each roadmap is a command center for your venture.
                    </p>
                </div>

                <Button
                    onClick={() => setShowCreate(true)}
                    className="bg-black text-white hover:bg-zinc-800 rounded-full px-8 h-12 text-sm font-bold tracking-wider uppercase gap-2 shadow-xl shadow-black/10 transition-all hover:shadow-2xl hover:shadow-black/20"
                >
                    <Plus className="w-4 h-4" />
                    New Roadmap
                </Button>
            </div>

            {/* Route Grid */}
            {routes.length === 0 && !loading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center min-h-[40vh] gap-6"
                >
                    <div className="p-6 bg-zinc-50 rounded-[32px] border-2 border-dashed border-zinc-200">
                        <Rocket className="w-12 h-12 text-zinc-300" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-black uppercase tracking-wider text-zinc-300">No Roadmaps Yet</h3>
                        <p className="text-sm text-zinc-400 max-w-sm">Launch your first venture by creating a roadmap above.</p>
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route, idx) => {
                        const progress = route._computed?.overallProgress || 0;
                        const actionsDone = route.actions?.filter(a => a.done).length || 0;
                        const actionsTotal = route.actions?.length || 0;

                        return (
                            <motion.div
                                key={route.routeId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card
                                    onClick={() => onSelect(route.routeId)}
                                    className="bg-white border-2 border-zinc-100 rounded-[32px] overflow-hidden group hover:border-black transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-zinc-200/50"
                                >
                                    <CardContent className="p-5 sm:p-8 space-y-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl">{route.emoji || '🚀'}</span>
                                                <div>
                                                    <h3 className="text-lg font-black tracking-tight text-black group-hover:text-black transition-colors">{route.title}</h3>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                        {route.phases?.length || 0} phases · {actionsTotal} actions
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider ${statusColors[route.status] || statusColors.active}`}>
                                                {route.status}
                                            </Badge>
                                        </div>

                                        {/* Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    className="h-full bg-black rounded-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions summary */}
                                        <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                                                {actionsDone}/{actionsTotal} actions done
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-md rounded-[32px] border-2 border-zinc-100 p-0 overflow-hidden">
                    {generating ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-50/50 min-h-[320px]">
                            <div className="relative">
                                <motion.div 
                                    className="w-16 h-16 rounded-full border-4 border-zinc-100 border-t-black border-r-black animate-spin"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="absolute inset-0 flex items-center justify-center text-xl"
                                >
                                    ⚡
                                </motion.div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-black">Consulting AI Startup Advisor</h3>
                                <p className="text-[10px] font-bold text-zinc-400 max-w-xs uppercase tracking-wide leading-relaxed">
                                    Mapping logical phases, actionable steps, critical milestones, and margins. Please stand by...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <DialogHeader className="p-8 pb-4">
                                <DialogTitle className="text-xl font-black uppercase tracking-tight">Launch New Roadmap</DialogTitle>
                            </DialogHeader>
                            <div className="px-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative" ref={emojiRef}>
                                        <button
                                            onClick={() => setShowEmojiPicker(p => !p)}
                                            className="w-14 h-14 rounded-2xl bg-zinc-50 border-2 border-zinc-200 hover:border-black transition-all flex items-center justify-center text-2xl"
                                        >
                                            {newEmoji}
                                        </button>
                                        {showEmojiPicker && (
                                            <div className="absolute top-16 left-0 z-50">
                                                <Picker
                                                    data={data}
                                                    onEmojiSelect={(e) => { setNewEmoji(e.native); setShowEmojiPicker(false); }}
                                                    theme="light"
                                                    previewPosition="none"
                                                    skinTonePosition="none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <Input
                                        placeholder="e.g. Jersey Business"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                        className="flex-1 h-14 text-lg font-bold border-2 border-zinc-200 focus:border-black rounded-2xl px-5"
                                        autoFocus
                                    />
                                </div>

                                {/* Gemini AI Toggle Integration */}
                                <div className="flex items-center justify-between p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl hover:border-zinc-200 transition-colors">
                                    <div className="flex items-center gap-3 text-left">
                                        <span className="text-xl">⚡</span>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-wide text-zinc-800">Generate Roadmap with AI</h4>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Populate with phases, milestones & cost metrics</p>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={useAI} 
                                        onChange={(e) => setUseAI(e.target.checked)} 
                                        className="w-5 h-5 rounded-md accent-black border-2 border-zinc-300 focus:ring-black cursor-pointer"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="p-8 pt-6">
                                <Button
                                    onClick={handleCreate}
                                    disabled={!newTitle.trim()}
                                    className="w-full bg-black text-white hover:bg-zinc-800 rounded-full h-12 text-sm font-bold tracking-wider uppercase gap-2"
                                >
                                    <Rocket className="w-4 h-4" />
                                    Launch Roadmap
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

// ─── STATUS SELECTOR ──────────────────────────────────────────
function StatusSelector({ status, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const statuses = [
        { value: 'active', label: 'Active', icon: Play, color: 'text-emerald-600' },
        { value: 'paused', label: 'Paused', icon: Pause, color: 'text-amber-600' },
        { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-blue-600' },
    ];

    const current = statuses.find(s => s.value === status) || statuses[0];

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 hover:border-black transition-all text-xs font-bold uppercase tracking-wider">
                <current.icon className={`w-3.5 h-3.5 ${current.color}`} />
                {current.label}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-10 right-0 bg-white border-2 border-zinc-100 rounded-2xl shadow-xl z-50 p-2 min-w-[140px]"
                    >
                        {statuses.map(s => (
                            <button
                                key={s.value}
                                onClick={() => { onChange(s.value); setOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-colors ${s.value === status ? 'bg-zinc-100' : ''}`}
                            >
                                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                                {s.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


// ─── ROUTE DASHBOARD VIEW ────────────────────────────────────
function RouteDashboard({ routeId }) {
    const {
        data, fetchRoute, updateRouteItem, deleteRouteItem,
        addRouteAction, deleteRouteAction, toggleRouteAction,
        fetchDaily, updateDaily
    } = usePlanner();
    const navigate = useNavigate();

    const [newActionText, setNewActionText] = useState('');
    const [newPhase, setNewPhase] = useState({ name: '', startDate: '', endDate: '' });
    const [showAddPhase, setShowAddPhase] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ text: '', targetDate: '' });
    const [showAddMilestone, setShowAddMilestone] = useState(false);
    const [newCustomField, setNewCustomField] = useState({ label: '', value: '', emoji: '📊' });
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState('');
    const titleRef = useRef(null);

    // Launch to Daily state
    const [launchDialog, setLaunchDialog] = useState({ open: false, action: null });
    const [launchDate, setLaunchDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [launchSuccess, setLaunchSuccess] = useState(null);

    const route = data.routes?.find(r => r.routeId === routeId);

    useEffect(() => {
        if (routeId) fetchRoute(routeId);
    }, [routeId, fetchRoute]);

    useEffect(() => {
        if (route?.title) setTitleValue(route.title);
    }, [route?.title]);

    if (!route) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse text-zinc-300 text-sm font-bold uppercase tracking-widest">Loading Roadmap...</div>
            </div>
        );
    }

    const computed = route._computed || {};
    const phases = route.phases || [];
    const actions = route.actions || [];
    const metrics = route.metrics || {};
    const milestones = route.milestones || [];
    const pendingActions = actions.filter(a => !a.done).sort((a, b) => a.priority - b.priority).slice(0, 5);
    const doneActions = actions.filter(a => a.done);

    const handleAddAction = async () => {
        if (!newActionText.trim()) return;
        await addRouteAction(routeId, { text: newActionText.trim() });
        setNewActionText('');
    };

    // ─── LAUNCH TO DAILY ──────────────────────────────────
    const defaultSchedule = Array.from({ length: 18 }, (_, i) => ({
        time: `${String(i + 6).padStart(2, '0')}:00`,
        task: '',
        done: false
    }));

    const handleLaunchToDaily = async () => {
        if (!launchDialog.action) return;
        const dateStr = launchDate;
        try {
            // Fetch the target day's data
            const dailyData = await fetchDaily(dateStr);
            const schedule = dailyData?.schedule || [...defaultSchedule];

            // Find first empty slot
            const emptyIdx = schedule.findIndex(s => !s.task);
            if (emptyIdx === -1) {
                // All slots full — append to last slot as fallback
                schedule[schedule.length - 1] = {
                    ...schedule[schedule.length - 1],
                    task: `${route.emoji} ${launchDialog.action.text}`,
                    done: false
                };
            } else {
                schedule[emptyIdx] = {
                    ...schedule[emptyIdx],
                    task: `${route.emoji} ${launchDialog.action.text}`,
                    done: false
                };
            }

            await updateDaily(dateStr, { schedule });
            setLaunchSuccess(launchDialog.action.id);
            setLaunchDialog({ open: false, action: null });

            // Clear success indicator after 2s
            setTimeout(() => setLaunchSuccess(null), 2000);
        } catch (err) {
            console.error('Failed to launch to daily:', err);
        }
    };

    const handleAddPhase = () => {
        if (!newPhase.name.trim()) return;
        const newPhases = [...phases, {
            id: crypto.randomUUID(),
            name: newPhase.name,
            startDate: newPhase.startDate,
            endDate: newPhase.endDate,
            status: 'pending',
            order: phases.length
        }];
        updateRouteItem(routeId, { phases: newPhases });
        setNewPhase({ name: '', startDate: '', endDate: '' });
        setShowAddPhase(false);
    };

    const togglePhaseStatus = (phaseId) => {
        const statusCycle = ['pending', 'in-progress', 'completed'];
        const updated = phases.map(p => {
            if (p.id === phaseId) {
                const idx = statusCycle.indexOf(p.status);
                return { ...p, status: statusCycle[(idx + 1) % statusCycle.length] };
            }
            return p;
        });
        updateRouteItem(routeId, { phases: updated });
    };

    const deletePhase = (phaseId) => {
        updateRouteItem(routeId, { phases: phases.filter(p => p.id !== phaseId) });
    };

    const handleAddMilestone = () => {
        if (!newMilestone.text.trim()) return;
        const updated = [...milestones, {
            id: crypto.randomUUID(),
            text: newMilestone.text,
            targetDate: newMilestone.targetDate,
            achieved: false,
            achievedAt: null
        }];
        updateRouteItem(routeId, { milestones: updated });
        setNewMilestone({ text: '', targetDate: '' });
        setShowAddMilestone(false);
    };

    const toggleMilestone = (id) => {
        const updated = milestones.map(m =>
            m.id === id ? { ...m, achieved: !m.achieved, achievedAt: m.achieved ? null : new Date().toISOString() } : m
        );
        updateRouteItem(routeId, { milestones: updated });
    };

    const deleteMilestone = (id) => {
        updateRouteItem(routeId, { milestones: milestones.filter(m => m.id !== id) });
    };

    const handleAddCustomField = () => {
        if (!newCustomField.label.trim()) return;
        const existing = metrics.customFields || [];
        updateRouteItem(routeId, {
            metrics: { ...metrics, customFields: [...existing, { ...newCustomField }] }
        });
        setNewCustomField({ label: '', value: '', emoji: '📊' });
    };

    const updateCustomField = (idx, updates) => {
        const fields = [...(metrics.customFields || [])];
        fields[idx] = { ...fields[idx], ...updates };
        updateRouteItem(routeId, { metrics: { ...metrics, customFields: fields } });
    };

    const deleteCustomField = (idx) => {
        const fields = (metrics.customFields || []).filter((_, i) => i !== idx);
        updateRouteItem(routeId, { metrics: { ...metrics, customFields: fields } });
    };

    const handleTitleSave = () => {
        if (titleValue.trim() && titleValue !== route.title) {
            updateRouteItem(routeId, { title: titleValue.trim() });
        }
        setEditingTitle(false);
    };

    const phaseStatusColors = {
        'pending': 'bg-zinc-200',
        'in-progress': 'bg-amber-400',
        'completed': 'bg-emerald-500'
    };

    const phaseStatusLabels = {
        'pending': 'Pending',
        'in-progress': 'Active',
        'completed': 'Done'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 mb-32 md:mb-12 space-y-10 bg-white min-h-screen text-zinc-900"
        >
            {/* Dashboard Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-8 border-b-2 border-zinc-100">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/planner/roadmaps')}
                            className="rounded-full p-2 h-auto hover:bg-zinc-100"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="w-2.5 h-2.5 bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Roadmap Command</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-4xl">{route.emoji}</span>
                        {editingTitle ? (
                            <input
                                ref={titleRef}
                                value={titleValue}
                                onChange={(e) => setTitleValue(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-black uppercase bg-transparent border-none focus:outline-none leading-[0.9] w-full"
                                autoFocus
                            />
                        ) : (
                            <h1
                                onClick={() => setEditingTitle(true)}
                                className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-black uppercase leading-[0.9] cursor-pointer hover:text-zinc-600 transition-colors"
                            >
                                {route.title}
                            </h1>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Overall Progress */}
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Overall Progress</span>
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${computed.overallProgress || 0}%` }}
                                    className="h-full bg-black rounded-full"
                                />
                            </div>
                            <span className="text-lg font-black tabular-nums leading-none">{computed.overallProgress || 0}%</span>
                        </div>
                    </div>

                    <StatusSelector
                        status={route.status}
                        onChange={(s) => updateRouteItem(routeId, { status: s })}
                    />

                    <Button
                        variant="ghost"
                        onClick={async () => { await deleteRouteItem(routeId); navigate('/planner/roadmaps'); }}
                        className="rounded-full p-2 h-auto text-zinc-400 hover:text-red-500 hover:bg-red-50"
                        title="Archive Roadmap"
                    >
                        <Archive className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

                {/* ─── PHASE MAP (2 cols) ─────────────────── */}
                <Card className="md:col-span-2 bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-100/50 rounded-[32px] overflow-hidden group hover:border-black transition-all duration-500">
                    <CardHeader className="p-5 sm:p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-50 rounded-xl group-hover:bg-black transition-colors">
                                    <Target className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 group-hover:text-black transition-colors">Phase Map</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black tracking-wider border-zinc-200">
                                {phases.filter(p => p.status === 'completed').length}/{phases.length} PHASES
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-8 pt-0 space-y-4">
                        {/* Phase Timeline Bar */}
                        {phases.length > 0 && (
                            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-zinc-50">
                                {phases.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        className={`flex-1 rounded-full ${phaseStatusColors[p.status]} transition-all cursor-pointer hover:opacity-80`}
                                        onClick={() => togglePhaseStatus(p.id)}
                                        title={`${p.name}: ${phaseStatusLabels[p.status]}`}
                                        whileHover={{ scaleY: 1.5 }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Phase List */}
                        <div className="space-y-3">
                            {phases.map((phase, idx) => (
                                <div key={phase.id} className="flex items-center gap-4 group/phase">
                                    <button
                                        onClick={() => togglePhaseStatus(phase.id)}
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                            phase.status === 'completed' ? 'bg-emerald-500 text-white' :
                                            phase.status === 'in-progress' ? 'bg-amber-400 text-white animate-pulse' :
                                            'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                                        }`}
                                    >
                                        {phase.status === 'completed' ? <Check className="w-4 h-4" /> :
                                         <span className="text-[10px] font-black">{String(idx + 1).padStart(2, '0')}</span>}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-sm font-bold tracking-tight ${phase.status === 'completed' ? 'line-through text-zinc-300' : 'text-black'}`}>
                                            {phase.name}
                                        </span>
                                        {(phase.startDate || phase.endDate) && (
                                            <div className="text-[10px] text-zinc-400 font-medium mt-0.5">
                                                {phase.startDate && phase.startDate}{phase.startDate && phase.endDate && ' → '}{phase.endDate && phase.endDate}
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant="outline" className={`text-[8px] font-black tracking-wider border px-2 ${
                                        phase.status === 'completed' ? 'border-emerald-200 text-emerald-600' :
                                        phase.status === 'in-progress' ? 'border-amber-200 text-amber-600' :
                                        'border-zinc-200 text-zinc-400'
                                    }`}>
                                        {phaseStatusLabels[phase.status]}
                                    </Badge>
                                    <button onClick={() => deletePhase(phase.id)} className="opacity-0 group-hover/phase:opacity-100 text-zinc-300 hover:text-red-400 transition-all">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Phase */}
                        {showAddPhase ? (
                            <div className="space-y-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <Input
                                    placeholder="Phase name..."
                                    value={newPhase.name}
                                    onChange={(e) => setNewPhase(p => ({ ...p, name: e.target.value }))}
                                    className="h-10 text-sm font-bold border-zinc-200 rounded-xl"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={newPhase.startDate}
                                        onChange={(e) => setNewPhase(p => ({ ...p, startDate: e.target.value }))}
                                        className="h-9 text-xs border-zinc-200 rounded-xl"
                                    />
                                    <Input
                                        type="date"
                                        value={newPhase.endDate}
                                        onChange={(e) => setNewPhase(p => ({ ...p, endDate: e.target.value }))}
                                        className="h-9 text-xs border-zinc-200 rounded-xl"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleAddPhase} className="bg-black text-white rounded-xl h-9 text-xs font-bold flex-1">Add Phase</Button>
                                    <Button variant="ghost" onClick={() => setShowAddPhase(false)} className="rounded-xl h-9 text-xs">Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddPhase(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-black text-zinc-400 hover:text-black transition-all text-xs font-bold uppercase tracking-wider"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Phase
                            </button>
                        )}
                    </CardContent>
                </Card>

                {/* ─── ACTION QUEUE ────────────────────────── */}
                <Card className="bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-100/50 rounded-[32px] overflow-hidden group hover:border-black transition-all duration-500 flex flex-col">
                    <CardHeader className="p-5 sm:p-8 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-50 rounded-xl group-hover:bg-black transition-colors">
                                <Zap className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 group-hover:text-black transition-colors">Action Queue</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-8 pt-0 flex-1 flex flex-col">
                        <div className="flex-1 space-y-2">
                            <AnimatePresence mode="popLayout">
                                {pendingActions.map((action) => (
                                    <motion.div
                                        key={action.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10, height: 0 }}
                                        className="flex items-center gap-3 group/action"
                                    >
                                        <button
                                            onClick={() => toggleRouteAction(routeId, action.id)}
                                            className="w-6 h-6 rounded-lg border-2 border-zinc-200 flex items-center justify-center flex-shrink-0 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                                        >
                                            <Check className="w-3 h-3 text-transparent group-hover/action:text-emerald-500 transition-colors" />
                                        </button>
                                        <span className="text-sm font-medium text-zinc-700 flex-1">{action.text}</span>

                                        {/* Launch to Daily button */}
                                        {launchSuccess === action.id ? (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-[9px] font-black uppercase tracking-widest text-emerald-500"
                                            >
                                                ✓ Launched
                                            </motion.span>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLaunchDialog({ open: true, action }); setLaunchDate(dayjs().format('YYYY-MM-DD')); }}
                                                className="opacity-0 group-hover/action:opacity-100 text-zinc-300 hover:text-black transition-all"
                                                title="Launch to Daily Planner"
                                            >
                                                <Rocket className="w-3.5 h-3.5" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => deleteRouteAction(routeId, action.id)}
                                            className="opacity-0 group-hover/action:opacity-100 text-zinc-300 hover:text-red-400 transition-all"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {doneActions.length > 0 && (
                                <div className="pt-3 mt-3 border-t border-zinc-50">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 mb-2 block">Completed ({doneActions.length})</span>
                                    {doneActions.slice(0, 3).map(action => (
                                        <div key={action.id} className="flex items-center gap-3 py-1 group/done">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-emerald-500" />
                                            </div>
                                            <span className="text-xs font-medium text-zinc-300 line-through flex-1">{action.text}</span>
                                            <button
                                                onClick={() => toggleRouteAction(routeId, action.id)}
                                                className="opacity-0 group-hover/done:opacity-100 text-zinc-300 hover:text-amber-500 transition-all text-[9px] font-bold"
                                            >
                                                UNDO
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add action inline */}
                        <div className="flex gap-2 pt-4 mt-auto">
                            <Input
                                placeholder="Add next step..."
                                value={newActionText}
                                onChange={(e) => setNewActionText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
                                className="flex-1 h-10 text-sm border-zinc-200 rounded-xl"
                            />
                            <Button
                                onClick={handleAddAction}
                                disabled={!newActionText.trim()}
                                className="bg-black text-white rounded-xl h-10 w-10 p-0"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── VENTURE METRICS ─────────────────────── */}
                <Card className="bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-100/50 rounded-[32px] overflow-hidden group hover:border-black transition-all duration-500">
                    <CardHeader className="p-5 sm:p-8 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-50 rounded-xl group-hover:bg-black transition-colors">
                                <DollarSign className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 group-hover:text-black transition-colors">Venture Metrics</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-8 pt-0 space-y-5">
                        {/* Core Financial Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Cost/Unit', key: 'costPerUnit', prefix: '৳' },
                                { label: 'Retail Price', key: 'retailPrice', prefix: '৳' },
                                { label: 'Target Units', key: 'targetUnits', prefix: '#' },
                            ].map(({ label, key, prefix }) => (
                                <div key={key} className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-300 font-bold">{prefix}</span>
                                        <input
                                            type="number"
                                            value={metrics[key] || ''}
                                            onChange={(e) => updateRouteItem(routeId, {
                                                metrics: { ...metrics, [key]: parseFloat(e.target.value) || 0 }
                                            })}
                                            className="w-full h-10 pl-7 pr-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:border-black transition-colors"
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Launch Date</label>
                                <input
                                    type="date"
                                    value={metrics.launchDate || ''}
                                    onChange={(e) => updateRouteItem(routeId, {
                                        metrics: { ...metrics, launchDate: e.target.value }
                                    })}
                                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>

                        <Separator className="opacity-30" />

                        {/* Auto-Computed Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Margin', value: `${computed.profitMargin || 0}%`, color: (computed.profitMargin || 0) > 30 ? 'text-emerald-600' : 'text-amber-600' },
                                { label: 'Revenue', value: `৳${(computed.projectedRevenue || 0).toLocaleString()}`, color: 'text-black' },
                                { label: 'Break-Even', value: `${computed.breakEvenUnits || 0}u`, color: 'text-zinc-600' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="text-center p-2 sm:p-3 bg-zinc-50 rounded-xl border border-zinc-100 min-w-0">
                                    <div className={`text-xs xs:text-sm sm:text-base md:text-lg font-black tabular-nums truncate ${color}`} title={value}>{value}</div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-1 truncate">{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Custom KPI Fields */}
                        {(metrics.customFields || []).length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Custom KPIs</span>
                                {(metrics.customFields || []).map((field, idx) => (
                                    <div key={idx} className="flex items-center gap-2 group/kpi">
                                        <span className="text-sm">{field.emoji}</span>
                                        <span className="text-xs font-bold text-zinc-500 flex-1">{field.label}</span>
                                        <input
                                            value={field.value}
                                            onChange={(e) => updateCustomField(idx, { value: e.target.value })}
                                            className="w-20 h-7 px-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-right focus:outline-none focus:border-black"
                                        />
                                        <button onClick={() => deleteCustomField(idx)} className="opacity-0 group-hover/kpi:opacity-100 text-zinc-300 hover:text-red-400 transition-all">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Custom Field */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="KPI name..."
                                value={newCustomField.label}
                                onChange={(e) => setNewCustomField(f => ({ ...f, label: e.target.value }))}
                                className="h-8 text-xs border-zinc-200 rounded-lg flex-1"
                            />
                            <Button onClick={handleAddCustomField} disabled={!newCustomField.label.trim()} className="h-8 bg-black text-white rounded-lg text-xs px-3">
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── QUICK NOTES ─────────────────────────── */}
                <Card className="bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-100/50 rounded-[32px] overflow-hidden group hover:border-black transition-all duration-500">
                    <CardHeader className="p-5 sm:p-8 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-50 rounded-xl group-hover:bg-black transition-colors">
                                <StickyNote className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 group-hover:text-black transition-colors">Quick Notes</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-8 pt-0">
                        <textarea
                            placeholder="Brain dump ideas, links, contacts, competitor info..."
                            value={route.notes || ''}
                            onChange={(e) => updateRouteItem(routeId, { notes: e.target.value })}
                            className="w-full h-48 bg-transparent border-none text-sm font-medium leading-relaxed focus:outline-none placeholder:text-zinc-200 text-zinc-700 resize-none"
                        />
                    </CardContent>
                </Card>

                {/* ─── MILESTONES ──────────────────────────── */}
                <Card className="bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-100/50 rounded-[32px] overflow-hidden group hover:border-black transition-all duration-500">
                    <CardHeader className="p-5 sm:p-8 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-50 rounded-xl group-hover:bg-black transition-colors">
                                <Flag className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 group-hover:text-black transition-colors">Milestones</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-8 pt-0 space-y-3">
                        {milestones.map((m) => (
                            <div key={m.id} className="flex items-start gap-3 group/ms">
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center gap-1 pt-1">
                                    <button
                                        onClick={() => toggleMilestone(m.id)}
                                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                                            m.achieved ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 hover:border-black'
                                        }`}
                                    />
                                    <div className="w-px h-6 bg-zinc-100" />
                                </div>
                                <div className="flex-1 min-w-0 pb-2">
                                    <span className={`text-sm font-bold ${m.achieved ? 'line-through text-zinc-300' : 'text-black'}`}>{m.text}</span>
                                    {m.targetDate && (
                                        <div className="text-[10px] text-zinc-400 font-medium mt-0.5 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {m.targetDate}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => deleteMilestone(m.id)} className="opacity-0 group-hover/ms:opacity-100 text-zinc-300 hover:text-red-400 transition-all mt-1">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {showAddMilestone ? (
                            <div className="space-y-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                <Input
                                    placeholder="Milestone..."
                                    value={newMilestone.text}
                                    onChange={(e) => setNewMilestone(m => ({ ...m, text: e.target.value }))}
                                    className="h-9 text-xs border-zinc-200 rounded-lg"
                                    autoFocus
                                />
                                <Input
                                    type="date"
                                    value={newMilestone.targetDate}
                                    onChange={(e) => setNewMilestone(m => ({ ...m, targetDate: e.target.value }))}
                                    className="h-9 text-xs border-zinc-200 rounded-lg"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleAddMilestone} className="bg-black text-white rounded-lg h-8 text-xs font-bold flex-1">Add</Button>
                                    <Button variant="ghost" onClick={() => setShowAddMilestone(false)} className="rounded-lg h-8 text-xs">Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddMilestone(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-zinc-200 hover:border-black text-zinc-400 hover:text-black transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                                <Plus className="w-3 h-3" />
                                Add Milestone
                            </button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ─── LAUNCH TO DAILY DIALOG ─────────────────── */}
            <Dialog open={launchDialog.open} onOpenChange={(open) => setLaunchDialog(d => ({ ...d, open }))}>
                <DialogContent className="sm:max-w-sm rounded-[32px] border-2 border-zinc-100 p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-3">
                        <DialogTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                            <Rocket className="w-4 h-4" />
                            Launch to Daily
                        </DialogTitle>
                        <p className="text-xs text-zinc-400 font-medium mt-1">
                            Inject this action into your daily schedule
                        </p>
                    </DialogHeader>
                    <div className="px-6 space-y-4">
                        {/* Action preview */}
                        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Action</span>
                            <span className="text-sm font-bold text-black">{route.emoji} {launchDialog.action?.text}</span>
                        </div>

                        {/* Quick date chips */}
                        <div className="flex gap-2">
                            {[
                                { label: 'Today', date: dayjs().format('YYYY-MM-DD') },
                                { label: 'Tomorrow', date: dayjs().add(1, 'day').format('YYYY-MM-DD') },
                            ].map(({ label, date }) => (
                                <button
                                    key={label}
                                    onClick={() => setLaunchDate(date)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                        launchDate === date
                                            ? 'bg-black text-white'
                                            : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 border border-zinc-200'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Date picker */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Or pick a date</label>
                            <Input
                                type="date"
                                value={launchDate}
                                onChange={(e) => setLaunchDate(e.target.value)}
                                className="h-10 text-sm font-bold border-zinc-200 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-4">
                        <Button
                            onClick={handleLaunchToDaily}
                            className="w-full bg-black text-white hover:bg-zinc-800 rounded-full h-11 text-sm font-bold tracking-wider uppercase gap-2 shadow-lg shadow-black/10"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Launch to {launchDate === dayjs().format('YYYY-MM-DD') ? 'Today' : launchDate === dayjs().add(1, 'day').format('YYYY-MM-DD') ? 'Tomorrow' : launchDate}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}


// ─── MAIN COMPONENT ──────────────────────────────────────────
function RoadmapPlanner() {
    const routeId = useParams().routeId;
    const navigate = useNavigate();
    const { data, loading, fetchRoutes, createRouteItem } = usePlanner();

    useEffect(() => {
        fetchRoutes();
    }, [fetchRoutes]);

    if (routeId) {
        return <RouteDashboard routeId={routeId} />;
    }

    return (
        <RouteLibrary
            routes={data.routes || []}
            loading={loading.routes}
            onCreate={createRouteItem}
            onSelect={(id) => navigate(`/planner/roadmaps/${id}`)}
        />
    );
}

export default RoadmapPlanner;
