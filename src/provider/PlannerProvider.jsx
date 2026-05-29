import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AuthContext } from './AuthProvider';
import { API_URL } from '../config';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Preferences } from '@capacitor/preferences';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

// Safe helper to write to Capacitor shared native storage for home screen widgets
const syncToCapacitor = async (key, val) => {
    try {
        await Preferences.set({ key, value: String(val) });
    } catch (e) {
        // Quiet fallback in pure web browser envs
    }
};

// Caching helpers for production-grade offline availability
const writeCache = async (key, val) => {
    try {
        await Preferences.set({ key: `CapacitorStorage.cache.${key}`, value: JSON.stringify(val) });
    } catch (e) {
        try {
            localStorage.setItem(`CapacitorStorage.cache.${key}`, JSON.stringify(val));
        } catch (err) {}
    }
};

const readCache = async (key) => {
    try {
        const res = await Preferences.get({ key: `CapacitorStorage.cache.${key}` });
        if (res?.value) return JSON.parse(res.value);
    } catch (e) {}
    try {
        const val = localStorage.getItem(`CapacitorStorage.cache.${key}`);
        if (val) return JSON.parse(val);
    } catch (err) {}
    return null;
};


export const PlannerContext = createContext();

export function usePlanner() {
    const context = useContext(PlannerContext);
    if (!context) throw new Error('usePlanner must be used within PlannerProvider');
    return context;
}

const PlannerProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState({
        yearly: null,
        monthly: {},
        weekly: {},
        daily: {},
        growth: {},
        budget: {},
        notebook: null,
        journal: {},
        routes: [],
        library: [],
    });
    const [pendingRituals, setPendingRituals] = useState([]);
    const [loading, setLoading] = useState({});
    const [error, setError] = useState(null);
    
    // Offline-first outbox synchronization states
    const [syncStatus, setSyncStatus] = useState('synced');
    const [outboxCount, setOutboxCount] = useState(0);
    const outbox = useRef([]);
    
    const saveTimers = useRef({});
    const saveQueues = useRef({}); // Accumulator for pending updates

    // Background outbox sync runner
    const flushOutbox = useCallback(async () => {
        if (!user?.uid || outbox.current.length === 0) {
            setSyncStatus('synced');
            setOutboxCount(0);
            return;
        }

        if (saveQueues.current.flushing) return;
        saveQueues.current.flushing = true;
        setSyncStatus('syncing');

        const remaining = [...outbox.current];
        let networkFailed = false;

        while (remaining.length > 0 && !networkFailed) {
            const currentItem = remaining[0];
            const opts = {
                method: currentItem.method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            };
            if (currentItem.body) opts.body = JSON.stringify(currentItem.body);

            try {
                const res = await fetch(`${API_URL}/planner/${user.uid}${currentItem.path}`, opts);
                if (res.ok) {
                    remaining.shift();
                } else if (res.status >= 400 && res.status < 500) {
                    // Client validation / payload errors -> discard to avoid blocking outbox
                    console.warn(`Discarding malformed offline payload to ${currentItem.path}:`, res.status);
                    remaining.shift();
                } else {
                    // Server-side errors -> keep in outbox and stop processing
                    networkFailed = true;
                }
            } catch (err) {
                // Connection/network disconnections -> keep in outbox and stop
                networkFailed = true;
            }
        }

        outbox.current = remaining;
        setOutboxCount(remaining.length);
        try {
            await Preferences.set({
                key: 'CapacitorStorage.offlineOutbox',
                value: JSON.stringify(remaining)
            });
        } catch (e) {
            console.error("Preferences write failed:", e);
        }

        saveQueues.current.flushing = false;

        if (networkFailed) {
            setSyncStatus('offline-queued');
        } else {
            setSyncStatus('synced');
        }
    }, [user]);

    const apiCall = useCallback(async (method, path, body = null) => {
        if (!user?.uid) return null;
        setError(null);

        // Immediate cache serve if offline and querying via GET
        if (method === 'GET' && !navigator.onLine) {
            const cached = await readCache(path);
            if (cached) {
                setSyncStatus('offline-queued');
                return cached;
            }
        }

        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        };
        if (body) opts.body = JSON.stringify(body);

        try {
            const res = await fetch(`${API_URL}/planner/${user.uid}${path}`, opts);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const resData = await res.json();
            
            // Cache successful read operations
            if (method === 'GET') {
                writeCache(path, resData);
            }
            return resData;
        } catch (err) {
            // Check for connection/network failures
            const isNetworkError = err.message?.includes('Failed to fetch') || 
                                   err.message?.includes('network') || 
                                   err.message?.includes('API error: 5') ||
                                   !navigator.onLine;

            if (isNetworkError) {
                if (method === 'GET') {
                    const cached = await readCache(path);
                    if (cached) {
                        setSyncStatus('offline-queued');
                        return cached;
                    }
                } else {
                    // Queue state mutations in outbox
                    const newItem = {
                        id: Date.now().toString(),
                        method,
                        path,
                        body,
                        timestamp: Date.now()
                    };
                    outbox.current.push(newItem);
                    setOutboxCount(outbox.current.length);
                    Preferences.set({
                        key: 'CapacitorStorage.offlineOutbox',
                        value: JSON.stringify(outbox.current)
                    }).catch(e => console.error("Preferences write failed:", e));
                    
                    setSyncStatus('offline-queued');
                    
                    // Throw network error instead of returning blank body, allowing callers to catch disconnections and preserve existing states
                    throw new Error(`Offline queued: network disconnection detected.`);
                }
            }
            setError(err.message);
            throw err;
        }
    }, [user]);

    // Load offline outbox on mount and set up online listener triggers
    useEffect(() => {
        const loadOutbox = async () => {
            try {
                const res = await Preferences.get({ key: 'CapacitorStorage.offlineOutbox' });
                if (res?.value) {
                    outbox.current = JSON.parse(res.value);
                    setOutboxCount(outbox.current.length);
                    if (outbox.current.length > 0) {
                        setSyncStatus('offline-queued');
                        if (navigator.onLine) {
                            flushOutbox();
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load offline outbox:", e);
            }
        };

        if (user?.uid) {
            loadOutbox();
        }
    }, [user, flushOutbox]);

    useEffect(() => {
        const handleOnline = () => {
            flushOutbox();
        };
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [flushOutbox]);

    // ─── SAVE HELPERS (consolidated/accumulated) ─────────────
    const debouncedSave = useCallback((key, updates, saveFn) => {
        // Accumulate changes into the queue for this specific key
        saveQueues.current[key] = {
            ...(saveQueues.current[key] || {}),
            ...updates
        };

        if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
        
        saveTimers.current[key] = setTimeout(async () => {
            const finalUpdates = { ...saveQueues.current[key] };
            // Clear the queue for this key immediately to capture fresh changes during the request
            delete saveQueues.current[key];
            
            try {
                await saveFn(finalUpdates);
            } catch (err) {
                console.error(`Consolidated save failed for ${key}:`, err);
                // Optionally restore updates to queue if failure is retryable
            }
        }, 800);
    }, []);

    const fetchYearly = useCallback(async (year) => {
        setLoading(l => ({ ...l, yearly: true }));
        try {
            const doc = await apiCall('GET', `/yearly/${year}`);
            setData(d => ({ ...d, yearly: doc }));
            return doc;
        } finally { setLoading(l => ({ ...l, yearly: false })); }
    }, [apiCall]);

    const fetchMonthly = useCallback(async (year, month) => {
        const key = `${year}-${month}`;
        setLoading(l => ({ ...l, [`monthly-${key}`]: true }));
        try {
            const doc = await apiCall('GET', `/monthly/${year}/${month}`);
            setData(d => ({ ...d, monthly: { ...d.monthly, [key]: doc } }));
            return doc;
        } finally { setLoading(l => ({ ...l, [`monthly-${key}`]: false })); }
    }, [apiCall]);

    const fetchWeekly = useCallback(async (year, weekNumber) => {
        const key = `${year}-W${weekNumber}`;
        setLoading(l => ({ ...l, [`weekly-${key}`]: true }));
        try {
            const doc = await apiCall('GET', `/weekly/${year}/${weekNumber}`);
            setData(d => ({ ...d, weekly: { ...d.weekly, [key]: doc } }));
            return doc;
        } finally { setLoading(l => ({ ...l, [`weekly-${key}`]: false })); }
    }, [apiCall]);

    const fetchDaily = useCallback(async (date) => {
        setLoading(l => ({ ...l, [`daily-${date}`]: true }));
        try {
            const doc = await apiCall('GET', `/daily/${date}`);
            setData(d => ({ ...d, daily: { ...d.daily, [date]: doc } }));
            
            // Sync today's Top Task to native Capacitor mobile widgets
            const todayStr = dayjs().format('YYYY-MM-DD');
            if (date === todayStr && doc?.topTask !== undefined) {
                syncToCapacitor('todayTopTask', doc.topTask);
            }
            
            return doc;
        } finally { setLoading(l => ({ ...l, [`daily-${date}`]: false })); }
    }, [apiCall]);

    const fetchGrowth = useCallback(async (date) => {
        setLoading(l => ({ ...l, [`growth-${date}`]: true }));
        try {
            const doc = await apiCall('GET', `/growth/${date}`);
            setData(d => ({ ...d, growth: { ...d.growth, [date]: doc } }));
            return doc;
        } finally { setLoading(l => ({ ...l, [`growth-${date}`]: false })); }
    }, [apiCall]);

    const fetchGrowthRange = useCallback(async (startDate, endDate) => {
        try {
            const docs = await apiCall('GET', `/growth/range/${startDate}/${endDate}`) || [];
            const growthMap = {};
            docs.forEach(doc => { growthMap[doc.date] = doc; });
            setData(d => ({ ...d, growth: { ...d.growth, ...growthMap } }));
            return docs;
        } catch (e) { console.error(e); return []; }
    }, [apiCall]);

    const fetchBudget = useCallback(async (year, month) => {
        const key = `${year}-${month}`;
        setLoading(l => ({ ...l, [`budget-${key}`]: true }));
        try {
            const doc = await apiCall('GET', `/budget/${year}/${month}`);
            setData(d => ({ ...d, budget: { ...d.budget, [key]: doc } }));
            return doc;
        } finally { setLoading(l => ({ ...l, [`budget-${key}`]: false })); }
    }, [apiCall]);

    const fetchNotebook = useCallback(async () => {
        setLoading(l => ({ ...l, notebook: true }));
        try {
            const docs = await apiCall('GET', '/notebook') || [];
            setData(d => ({ ...d, notebook: docs }));
            return docs;
        } finally { setLoading(l => ({ ...l, notebook: false })); }
    }, [apiCall]);

    const fetchJournal = useCallback(async () => {
        setLoading(l => ({ ...l, journal: true }));
        try {
            const docs = await apiCall('GET', '/journal') || [];
            const byDate = {};
            docs.forEach((doc) => {
                if (doc?.date) byDate[doc.date] = doc;
            });
            setData(d => ({ ...d, journal: byDate }));
            return docs;
        } finally { setLoading(l => ({ ...l, journal: false })); }
    }, [apiCall]);

    const fetchCalendar = useCallback(async (startDate, endDate) => {
        return await apiCall('GET', `/calendar/${startDate}/${endDate}`);
    }, [apiCall]);

    const fetchTrajectory = useCallback(async (startDate, endDate) => {
        return await apiCall('GET', `/analytics/trajectory/${startDate}/${endDate}`);
    }, [apiCall]);

    const updateYearly = useCallback((year, updatesOrFn) => {
        setData(d => {
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(d.yearly) : updatesOrFn;
            debouncedSave(`yearly-${year}`, updates, (merged) => 
                apiCall('PATCH', `/yearly/${year}`, merged)
            );
            return { ...d, yearly: { ...d.yearly, ...updates } };
        });
    }, [apiCall, debouncedSave]);

    const updateMonthly = useCallback((year, month, updatesOrFn) => {
        const key = `${year}-${month}`;
        setData(d => {
            const current = d.monthly[key];
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(current) : updatesOrFn;
            debouncedSave(`monthly-${key}`, updates, (merged) => 
                apiCall('PATCH', `/monthly/${year}/${month}`, merged)
            );
            return {
                ...d,
                monthly: { ...d.monthly, [key]: { ...current, ...updates } }
            };
        });
    }, [apiCall, debouncedSave]);

    const updateWeekly = useCallback((year, weekNumber, updatesOrFn) => {
        const key = `${year}-W${weekNumber}`;
        setData(d => {
            const current = d.weekly[key];
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(current) : updatesOrFn;
            debouncedSave(`weekly-${key}`, updates, (merged) => 
                apiCall('PATCH', `/weekly/${year}/${weekNumber}`, merged)
            );
            return {
                ...d,
                weekly: { ...d.weekly, [key]: { ...current, ...updates } }
            };
        });
    }, [apiCall, debouncedSave]);

    const updateDaily = useCallback((date, updatesOrFn) => {
        setData(d => {
            const current = d.daily[date];
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(current) : updatesOrFn;
            
            // Sync today's Top Task if updated
            const todayStr = dayjs().format('YYYY-MM-DD');
            if (date === todayStr && updates.topTask !== undefined) {
                syncToCapacitor('todayTopTask', updates.topTask);
            }
            
            debouncedSave(`daily-${date}`, updates, (merged) => 
                apiCall('PATCH', `/daily/${date}`, merged)
            );
            return {
                ...d,
                daily: { ...d.daily, [date]: { ...current, ...updates } }
            };
        });
    }, [apiCall, debouncedSave]);

    const updateGrowth = useCallback((date, updatesOrFn) => {
        setData(d => {
            const current = d.growth[date];
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(current) : updatesOrFn;
            debouncedSave(`growth-${date}`, updates, (merged) => 
                apiCall('POST', '/growth', { date, ...merged })
            );
            return {
                ...d,
                growth: { ...d.growth, [date]: { ...current, ...updates } }
            };
        });
    }, [apiCall, debouncedSave]);

    const updateBudget = useCallback((year, month, updatesOrFn) => {
        const key = `${year}-${month}`;
        setData(d => {
            const current = d.budget[key];
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(current) : updatesOrFn;
            debouncedSave(`budget-${key}`, updates, (merged) => 
                apiCall('PATCH', `/budget/${year}/${month}`, merged)
            );
            return {
                ...d,
                budget: { ...d.budget, [key]: { ...current, ...updates } }
            };
        });
    }, [apiCall, debouncedSave]);

    const addDailyBudgetEntry = useCallback(async (year, month, date, entries) => {
        const key = `${year}-${month}`;
        const newDoc = await apiCall('POST', `/budget/${year}/${month}/daily`, { date, entries });
        setData(d => ({
            ...d,
            budget: { ...d.budget, [key]: newDoc }
        }));
    }, [apiCall]);

    const deleteBudgetEntry = useCallback(async (year, month, entryId) => {
        const key = `${year}-${month}`;
        const newDoc = await apiCall('DELETE', `/budget/${year}/${month}/entry/${entryId}`);
        setData(d => ({
            ...d,
            budget: { ...d.budget, [key]: newDoc }
        }));
        return newDoc;
    }, [apiCall]);

    const updateNotebookPage = useCallback((pageNumber, updatesOrFn) => {
        setData(d => {
            if (!d.notebook) return d;
            const currentPage = d.notebook.find(p => p.pageNumber === pageNumber);
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(currentPage) : updatesOrFn;
            
            debouncedSave(`notebook-${pageNumber}`, updates, (merged) => 
                apiCall('PATCH', `/notebook/${pageNumber}`, merged)
            );

            const pages = d.notebook.map(p =>
                p.pageNumber === pageNumber ? { ...p, ...updates } : p
            );
            return { ...d, notebook: pages };
        });
    }, [apiCall, debouncedSave]);

    const updateJournalEntry = useCallback((date, updatesOrFn) => {
        setData(d => {
            const currentEntry = d.journal?.[date] || {
                date,
                title: '',
                content: '',
                mood: '',
                tags: []
            };
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(currentEntry) : updatesOrFn;

            debouncedSave(`journal-${date}`, updates, (merged) =>
                apiCall('PATCH', `/journal/${date}`, merged)
            );

            return {
                ...d,
                journal: {
                    ...d.journal,
                    [date]: { ...currentEntry, ...updates, date }
                }
            };
        });
    }, [apiCall, debouncedSave]);

    // ─── COMPUTED HELPERS ────────────────────────────────────
    const getNoReelsStreak = useCallback(() => {
        const dates = Object.keys(data.growth).sort().reverse();
        let streak = 0;
        for (const date of dates) {
            if (data.growth[date]?.habits?.noReels) {
                streak++;
            } else {
                break;
            }
        }
        // Sync streak to native mobile Capacitor widgets
        syncToCapacitor('noReelsStreak', streak);
        return streak;
    }, [data.growth]);

    const getTodayDate = useCallback(() => dayjs().format('YYYY-MM-DD'), []);

    const getTodayGrowth = useCallback(() => {
        const today = getTodayDate();
        return data.growth[today] || null;
    }, [data.growth, getTodayDate]);

    const getDailyCompletion = useCallback((date) => {
        const daily = data.daily[date];
        if (!daily?.schedule) return 0;
        const filled = daily.schedule.filter(s => s.task?.trim());
        const done = filled.filter(s => s.done);
        return filled.length > 0 ? Math.round((done.length / filled.length) * 100) : 0;
    }, [data.daily]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            Object.values(saveTimers.current).forEach(clearTimeout);
        };
    }, []);

    // ─── ROUTE PLAN METHODS ────────────────────────────────
    const fetchRoutes = useCallback(async () => {
        setLoading(l => ({ ...l, routes: true }));
        try {
            const docs = await apiCall('GET', '/routes') || [];
            setData(d => ({ ...d, routes: docs }));
            return docs;
        } finally { setLoading(l => ({ ...l, routes: false })); }
    }, [apiCall]);

    const fetchRoute = useCallback(async (routeId) => {
        setLoading(l => ({ ...l, [`route-${routeId}`]: true }));
        try {
            const doc = await apiCall('GET', `/routes/${routeId}`);
            setData(d => ({
                ...d,
                routes: d.routes.map(r => r.routeId === routeId ? doc : r)
            }));
            return doc;
        } finally { setLoading(l => ({ ...l, [`route-${routeId}`]: false })); }
    }, [apiCall]);

    const createRouteItem = useCallback(async (routeData) => {
        const doc = await apiCall('POST', '/routes', routeData);
        setData(d => ({ ...d, routes: [doc, ...d.routes] }));
        return doc;
    }, [apiCall]);

    const updateRouteItem = useCallback((routeId, updatesOrFn) => {
        setData(d => {
            const current = d.routes.find(r => r.routeId === routeId);
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(current) : updatesOrFn;
            debouncedSave(`route-${routeId}`, updates, (merged) =>
                apiCall('PATCH', `/routes/${routeId}`, merged)
            );
            return {
                ...d,
                routes: d.routes.map(r =>
                    r.routeId === routeId ? { ...r, ...updates } : r
                )
            };
        });
    }, [apiCall, debouncedSave]);

    const deleteRouteItem = useCallback(async (routeId) => {
        await apiCall('DELETE', `/routes/${routeId}`);
        setData(d => ({
            ...d,
            routes: d.routes.filter(r => r.routeId !== routeId)
        }));
    }, [apiCall]);

    const addRouteAction = useCallback(async (routeId, actionData) => {
        const doc = await apiCall('POST', `/routes/${routeId}/actions`, actionData);
        setData(d => ({
            ...d,
            routes: d.routes.map(r => r.routeId === routeId ? doc : r)
        }));
        return doc;
    }, [apiCall]);

    const deleteRouteAction = useCallback(async (routeId, actionId) => {
        const doc = await apiCall('DELETE', `/routes/${routeId}/actions/${actionId}`);
        setData(d => ({
            ...d,
            routes: d.routes.map(r => r.routeId === routeId ? doc : r)
        }));
        return doc;
    }, [apiCall]);

    const toggleRouteAction = useCallback(async (routeId, actionId) => {
        const doc = await apiCall('PATCH', `/routes/${routeId}/actions/${actionId}/toggle`);
        setData(d => ({
            ...d,
            routes: d.routes.map(r => r.routeId === routeId ? doc : r)
        }));
        return doc;
    }, [apiCall]);

    // ─── LIBRARY COMPONENT METHODS ─────────────────────────
    const fetchLibrary = useCallback(async () => {
        setLoading(l => ({ ...l, library: true }));
        try {
            const docs = await apiCall('GET', '/library') || [];
            setData(d => ({ ...d, library: docs }));
            return docs;
        } finally { setLoading(l => ({ ...l, library: false })); }
    }, [apiCall]);

    const fetchBook = useCallback(async (bookId) => {
        setLoading(l => ({ ...l, [`library-${bookId}`]: true }));
        try {
            const doc = await apiCall('GET', `/library/${bookId}`);
            setData(d => ({
                ...d,
                library: d.library.map(b => b._id === bookId ? doc : b)
            }));
            return doc;
        } finally { setLoading(l => ({ ...l, [`library-${bookId}`]: false })); }
    }, [apiCall]);

    const createBook = useCallback(async (bookData) => {
        const doc = await apiCall('POST', '/library', bookData);
        setData(d => ({ ...d, library: [doc, ...d.library] }));
        return doc;
    }, [apiCall]);

    const updateBook = useCallback((bookId, updatesOrFn) => {
        setData(d => {
            const current = d.library.find(b => b._id === bookId);
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(current) : updatesOrFn;
            debouncedSave(`library-${bookId}`, updates, (merged) =>
                apiCall('PATCH', `/library/${bookId}`, merged)
            );
            return {
                ...d,
                library: d.library.map(b =>
                    b._id === bookId ? { ...b, ...updates } : b
                )
            };
        });
    }, [apiCall, debouncedSave]);

    const deleteBook = useCallback(async (bookId) => {
        await apiCall('DELETE', `/library/${bookId}`);
        setData(d => ({
            ...d,
            library: d.library.filter(b => b._id !== bookId)
        }));
    }, [apiCall]);

    const addQuote = useCallback(async (bookId, quoteData) => {
        const doc = await apiCall('POST', `/library/${bookId}/quotes`, quoteData);
        setData(d => ({
            ...d,
            library: d.library.map(b => b._id === bookId ? doc : b)
        }));
        return doc;
    }, [apiCall]);

    const deleteQuote = useCallback(async (bookId, quoteId) => {
        const doc = await apiCall('DELETE', `/library/${bookId}/quotes/${quoteId}`);
        setData(d => ({
            ...d,
            library: d.library.map(b => b._id === bookId ? doc : b)
        }));
        return doc;
    }, [apiCall]);

    // ─── RITUAL LOGIC ──────────────────────────────────────────
    
    const checkRitualStatus = useCallback(async () => {
        if (!user?.uid) return;
        
        try {
            const now = dayjs();
            const prevWeek = now.subtract(1, 'week');
            const prevMonth = now.subtract(1, 'month');
            
            const rituals = [];
            
            // Check Previous Week
            const weekNumber = prevWeek.week();
            const weekYear = prevWeek.year();
            
            const weekData = await apiCall('GET', `/weekly/${weekYear}/${weekNumber}`);
            if (weekData && !weekData.ritual?.isCompleted) {
                rituals.push({
                    type: 'weekly',
                    title: `Week ${weekNumber} Reflection`,
                    key: `${weekYear}-W${weekNumber}`,
                    period: prevWeek.startOf('week').format('MMM D') + ' - ' + prevWeek.endOf('week').format('MMM D'),
                    data: weekData
                });
            }
            
            // Check Previous Month
            const monthVal = prevMonth.month() + 1; // 1-indexed for backend
            const monthYear = prevMonth.year();
            
            const monthData = await apiCall('GET', `/monthly/${monthYear}/${monthVal}`);
            if (monthData && !monthData.ritual?.isCompleted) {
                rituals.push({
                    type: 'monthly',
                    title: `${prevMonth.format('MMMM')} Review`,
                    key: `${monthYear}-${monthVal}`,
                    period: prevMonth.format('MMMM YYYY'),
                    data: monthData
                });
            }
            
            setPendingRituals(rituals);
        } catch (err) {
            console.error("Error checking rituals:", err);
        }
    }, [user, apiCall]);

    const completeRitual = useCallback(async (type, key, ritualData) => {
        const [year, part] = key.split(type === 'weekly' ? '-W' : '-');
        const endpoint = type === 'weekly' ? `/weekly/${year}/${part}` : `/monthly/${year}/${part}`;
        
        try {
            const updatedDoc = await apiCall('PATCH', endpoint, { 
                ritual: { 
                    ...ritualData, 
                    isCompleted: true, 
                    completedAt: new Date() 
                } 
            });
            
            // Update local state
            setData(d => {
                const newData = { ...d };
                if (type === 'weekly') newData.weekly[key] = updatedDoc;
                else newData.monthly[key] = updatedDoc;
                return newData;
            });
            
            // Remove from pending
            setPendingRituals(prev => prev.filter(r => r.key !== key));
            return updatedDoc;
        } catch (err) {
            console.error(`Failed to complete ${type} ritual:`, err);
            throw err;
        }
    }, [apiCall]);

    // ─── AI COPILOT METHODS ────────────────────────────────
    const generateRouteBlueprint = useCallback(async (concept, title = '') => {
        return await apiCall('POST', '/ai/route-blueprint', { concept, title });
    }, [apiCall]);

    const evaluateBookRecall = useCallback(async (recallData) => {
        return await apiCall('POST', '/ai/book-recall', recallData);
    }, [apiCall]);

    const parseExpenseCommand = useCallback(async (query) => {
        return await apiCall('POST', '/ai/parse-expense', { query });
    }, [apiCall]);

    const fetchGrowthCoachInsights = useCallback(async (startDate, endDate) => {
        return await apiCall('GET', `/ai/growth-coach/${startDate}/${endDate}`);
    }, [apiCall]);

    const transcribeAudio = useCallback(async (audio, mimeType) => {
        return await apiCall('POST', '/ai/transcribe', { audio, mimeType });
    }, [apiCall]);

    const fetchDailyBriefing = useCallback(async () => {
        return await apiCall('GET', '/ai/daily-briefing');
    }, [apiCall]);

    const optimizeDailySchedule = useCallback(async (tasks) => {
        return await apiCall('POST', '/ai/optimize-schedule', { tasks });
    }, [apiCall]);

    const auditJournalMindset = useCallback(async (content) => {
        return await apiCall('POST', '/ai/journal-cbt', { content });
    }, [apiCall]);

    useEffect(() => {
        if (user?.uid) {
            checkRitualStatus();
        }
    }, [user, checkRitualStatus]);

    const value = {
        data,
        loading,
        pendingRituals,
        // Offline-first and Sync states
        syncStatus,
        outboxCount,
        flushOutbox,
        // Fetchers
        fetchYearly, fetchMonthly, fetchWeekly,
        fetchDaily, fetchGrowth, fetchGrowthRange,
        fetchBudget, fetchNotebook, fetchJournal, fetchCalendar, fetchTrajectory,
        // Route Plan
        fetchRoutes, fetchRoute, createRouteItem, updateRouteItem, deleteRouteItem,
        addRouteAction, deleteRouteAction, toggleRouteAction,
        // Library Command
        fetchLibrary, fetchBook, createBook, updateBook, deleteBook, addQuote, deleteQuote,
        // Updaters (debounced)
        updateYearly, updateMonthly, updateWeekly,
        updateDaily, updateGrowth, updateBudget, addDailyBudgetEntry, deleteBudgetEntry,
        updateNotebookPage, updateJournalEntry,
        // Rituals
        completeRitual, checkRitualStatus,
        // Computed
        getNoReelsStreak, getTodayDate, getTodayGrowth, getDailyCompletion,
        // AI Copilot Extensions
        generateRouteBlueprint, evaluateBookRecall, parseExpenseCommand, fetchGrowthCoachInsights, transcribeAudio,
        fetchDailyBriefing, optimizeDailySchedule, auditJournalMindset,
    };

    return (
        <PlannerContext.Provider value={value}>
            {children}
        </PlannerContext.Provider>
    );
};

export default PlannerProvider;
