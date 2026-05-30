import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePlanner } from '../../provider/PlannerProvider';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
    Home, CalendarDays, TrendingUp, Target, CalendarRange,
    BookOpen, Wallet, NotebookPen, Map, ChevronLeft, ChevronRight, Flame, Rocket, Library,
    MoreHorizontal, Brain, Download, Network
} from 'lucide-react';

const navItems = [
    { icon: Home, label: 'Main Dashboard', path: '/', isExit: true },
    { icon: CalendarDays, label: 'Daily', path: '/planner/daily' },
    { icon: TrendingUp, label: 'Growth', path: '/planner/growth' },
    { icon: CalendarRange, label: 'Weekly', path: '/planner/weekly' },
    { icon: Target, label: 'Monthly', path: '/planner/monthly' },
    { icon: BookOpen, label: 'Yearly', path: '/planner/yearly' },
    { icon: Wallet, label: 'Budget', path: '/planner/budget' },
    { icon: NotebookPen, label: 'Notebook', path: '/planner/notebook' },
    { icon: Rocket, label: 'Roadmaps', path: '/planner/roadmaps' },
    { icon: Library, label: 'Library', path: '/planner/library' },
    { icon: Map, label: 'Calendar', path: '/planner/calendar' },
    { icon: Brain, label: 'AI Companion', path: '/planner/companion' },
    { icon: Network, label: 'Social Graph', path: '/planner/social' },
];

function PlannerSidebar() {
    const { getNoReelsStreak, fetchGrowthRange, getTodayDate, syncStatus, outboxCount } = usePlanner();
    const [collapsed, setCollapsed] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // Hydrate from global state if already set before component mount
        if (window.deferredPrompt) {
            setInstallPrompt(window.deferredPrompt);
        }

        const handlePromptAvailable = () => {
            setInstallPrompt(window.deferredPrompt);
        };
        const handleInstalled = () => {
            setInstallPrompt(null);
        };

        window.addEventListener('pwa-install-available', handlePromptAvailable);
        window.addEventListener('pwa-installed', handleInstalled);

        return () => {
            window.removeEventListener('pwa-install-available', handlePromptAvailable);
            window.removeEventListener('pwa-installed', handleInstalled);
        };
    }, []);

    const triggerInstall = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                setInstallPrompt(null);
                window.deferredPrompt = null;
            }
        });
    };

    useEffect(() => {
        setIsMoreOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const today = getTodayDate();
        const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        fetchGrowthRange(thirtyDaysAgo, today);
    }, [fetchGrowthRange, getTodayDate]);

    useEffect(() => {
        setStreak(getNoReelsStreak());
    }, [getNoReelsStreak]);

    const weekNumber = dayjs().isoWeek();

    return (
        <>
            {/* Desktop sidebar */}
            {location.pathname.startsWith('/planner') && (
                <aside
                    className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-4 border-b border-border">
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                    Week {weekNumber}
                                    <span className="inline-flex items-center">
                                        {syncStatus === 'synced' && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" title="All changes saved to cloud" />
                                        )}
                                        {syncStatus === 'syncing' && (
                                            <span className="w-2 h-2 rounded-full border border-t-transparent border-primary animate-spin" title="Syncing with database..." />
                                        )}
                                        {syncStatus === 'offline-queued' && (
                                            <span className="text-[8px] font-mono font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title={`${outboxCount} offline changes queued`}>
                                                {outboxCount} QUEUED
                                            </span>
                                        )}
                                    </span>
                                </span>
                                <span className="text-sm font-semibold text-foreground">
                                    {dayjs().format('ddd, MMM D')}
                                </span>
                            </div>
                        )}
                        {collapsed && (
                            <div className="flex flex-col items-center justify-center w-full gap-2">
                                {syncStatus === 'synced' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />}
                                {syncStatus === 'syncing' && <span className="w-2 h-2 rounded-full border border-t-transparent border-primary animate-spin" />}
                                {syncStatus === 'offline-queued' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />}
                                <button
                                    onClick={() => setCollapsed(false)}
                                    className="p-1 rounded-md hover:bg-accent text-muted-foreground transition-colors mt-1"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        {!collapsed && (
                            <button
                                onClick={() => setCollapsed(true)}
                                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-3 space-y-1">
                        {navItems.map(({ icon: Icon, label, path, isExit }) => (
                            <React.Fragment key={path}>
                                {isExit && <div className="mb-2" />}
                                <NavLink
                                    to={path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'bg-secondary text-secondary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                        } ${collapsed ? 'justify-center px-0' : ''}`
                                    }
                                    title={collapsed ? label : undefined}
                                >
                                    <Icon className={`w-4 h-4 flex-shrink-0 ${location.pathname === path ? 'text-primary' : 'text-muted-foreground/70'}`} />
                                    {!collapsed && <span>{label}</span>}
                                </NavLink>
                                {isExit && <Separator className="my-2 opacity-50" />}
                            </React.Fragment>
                        ))}
                    </nav>

                    {/* Custom PWA Install Trigger */}
                    {installPrompt && (
                        <div className={collapsed ? 'px-2 mb-2 flex justify-center' : 'px-3 mb-2'}>
                            <button
                                onClick={triggerInstall}
                                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 cursor-pointer ${
                                    collapsed ? 'p-2 justify-center w-auto' : ''
                                }`}
                                title="Install Life OS App"
                            >
                                <Download className="w-4 h-4 flex-shrink-0" />
                                {!collapsed && <span>Install App</span>}
                            </button>
                        </div>
                    )}

                    {/* Streak Footer */}
                    <div className={`p-4 border-t border-border ${collapsed ? 'flex justify-center' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-secondary/50 ${collapsed ? 'p-1.5' : ''}`}>
                                <Flame className={`w-4 h-4 ${streak >= 7 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
                            </div>
                            {!collapsed && (
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold truncate">{streak} Day Streak</span>
                                        {streak >= 7 && <Badge variant="outline" className="h-4 px-1 text-[10px] border-orange-500 text-orange-500">PRO</Badge>}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold opacity-50">No Reels</span>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            {/* Mobile bottom nav capsule */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 select-none">
                <nav className="bg-card/85 backdrop-blur-lg border border-border/80 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] px-2.5 py-3 relative">
                    <div className="flex justify-around items-center">
                        {[
                            { icon: Home, label: 'Home', path: '/' },
                            { icon: CalendarDays, label: 'Daily', path: '/planner/daily' },
                            { icon: CalendarRange, label: 'Weekly', path: '/planner/weekly' },
                            { icon: Target, label: 'Monthly', path: '/planner/monthly' },
                        ].map(({ icon: Icon, label, path }) => {
                            const isActive = location.pathname === path;
                            return (
                                <NavLink
                                    key={path}
                                    to={path}
                                    className="flex-1 flex flex-col items-center justify-center py-1 text-[10px] font-black uppercase tracking-wider relative transition-colors select-none"
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className={`flex flex-col items-center justify-center w-full h-full relative z-10 ${isActive ? 'text-primary font-bold' : 'text-muted-foreground/60'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 mb-0.5" />
                                        <span className="text-[8px] font-black tracking-widest">{label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="mobile-nav-active"
                                                className="absolute -inset-x-2 -inset-y-1.5 bg-primary/10 rounded-2xl -z-10 border border-primary/10"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                </NavLink>
                            );
                        })}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsMoreOpen(true)}
                            className={`flex-1 flex flex-col items-center justify-center py-1 text-[10px] font-black uppercase tracking-wider transition-colors select-none ${isMoreOpen ? 'text-primary' : 'text-muted-foreground/60'
                                }`}
                        >
                            <MoreHorizontal className="w-5 h-5 mb-0.5" />
                            <span className="text-[8px] font-black tracking-widest">More</span>
                        </motion.button>
                    </div>
                </nav>
            </div>

            {/* Mobile More Bottom Sheet Drawer */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div
                            key="more-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 bg-black/60 z-[190] backdrop-blur-sm md:hidden"
                        />
                        {/* Panel bottom drawer with physical pull-to-dismiss drag mechanics */}
                        <motion.div
                            key="more-panel"
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0.05, bottom: 0.7 }}
                            onDragEnd={(event, info) => {
                                if (info.offset.y > 100) {
                                    setIsMoreOpen(false);
                                }
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed bottom-0 left-0 right-0 z-[200] bg-card border-t border-border rounded-t-[32px] px-6 pt-3 pb-12 max-h-[85vh] overflow-y-auto md:hidden shadow-2xl flex flex-col"
                        >
                            {/* Drag handle visual bar & touch target */}
                            <div className="w-full py-3 flex justify-center shrink-0 active:scale-95 transition-transform cursor-grab active:cursor-grabbing">
                                <div className="w-12 h-1.5 bg-muted rounded-full" />
                            </div>

                            <div className="flex items-center justify-between mt-2 mb-6 shrink-0 select-none">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Operational Modules</h3>
                                <div className="flex items-center gap-2">
                                    {syncStatus === 'synced' && (
                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                                            Synced
                                        </div>
                                    )}
                                    {syncStatus === 'syncing' && (
                                        <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-xl border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 rounded-full border border-t-transparent border-primary animate-spin" />
                                            Syncing
                                        </div>
                                    )}
                                    {syncStatus === 'offline-queued' && (
                                        <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                                            {outboxCount} Queued
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border">
                                        <Flame className={`w-4 h-4 ${streak >= 7 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground">{streak} Day Streak</span>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Mobile PWA Install Trigger */}
                            {installPrompt && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 shrink-0"
                                >
                                    <button
                                        onClick={triggerInstall}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Install Standalone App</span>
                                    </button>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-3 gap-4 pb-6 select-none">
                                {[
                                    { icon: TrendingUp, label: 'Growth', path: '/planner/growth' },
                                    { icon: BookOpen, label: 'Yearly', path: '/planner/yearly' },
                                    { icon: Wallet, label: 'Budget', path: '/planner/budget' },
                                    { icon: NotebookPen, label: 'Notebook', path: '/planner/notebook' },
                                    { icon: Rocket, label: 'Roadmaps', path: '/planner/roadmaps' },
                                    { icon: Library, label: 'Library', path: '/planner/library' },
                                    { icon: Map, label: 'Calendar', path: '/planner/calendar' },
                                    { icon: Brain, label: 'AI Twin', path: '/planner/companion' },
                                    { icon: Network, label: 'Social Graph', path: '/planner/social' },
                                ].map(({ icon: Icon, label, path }) => {
                                    const isActive = location.pathname === path;
                                    return (
                                        <NavLink
                                            key={path}
                                            to={path}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 ${isActive
                                                    ? 'bg-primary/5 border-primary/20 text-primary shadow-sm shadow-primary/5'
                                                    : 'bg-secondary/10 border-border/20 text-muted-foreground hover:bg-secondary/20 hover:text-foreground'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-background border border-border/50 text-muted-foreground/80'}`}>
                                                <Icon className="w-5 h-5 flex-shrink-0" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-tight">{label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default PlannerSidebar;
