import React, { useEffect, useState, useMemo } from 'react';
import { usePlanner } from '../../provider/PlannerProvider';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, ArrowUpRight, ChevronLeft, ChevronRight, Target,
    TrendingUp, Plus, Receipt, PiggyBank, BarChart3, LayoutGrid,
    Sparkles, Gauge, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import CompletionRing from '../../components/planner/CompletionRing';
import BudgetCategoryList from '../../components/planner/BudgetCategoryList';
import BudgetLedger from '../../components/planner/BudgetLedger';
import BudgetIncomeSourceList from '../../components/planner/BudgetIncomeSourceList';
import BudgetDonutChart from '../../components/planner/BudgetDonutChart';
import BudgetInsights from '../../components/planner/BudgetInsights';
import BudgetSavingsGoals from '../../components/planner/BudgetSavingsGoals';
import BudgetSimulator from '../../components/planner/BudgetSimulator';
import BudgetSubscriptions from '../../components/planner/BudgetSubscriptions';

const DEFAULT_CATEGORIES = [
    { name: 'Food', planned: 0, actual: 0, emoji: '🍚' },
    { name: 'Rent', planned: 0, actual: 0, emoji: '🏠' },
    { name: 'Transport', planned: 0, actual: 0, emoji: '🚌' },
    { name: 'Phone/Internet', planned: 0, actual: 0, emoji: '📱' },
    { name: 'Entertainment', planned: 0, actual: 0, emoji: '🎮' },
    { name: 'Health', planned: 0, actual: 0, emoji: '💊' },
    { name: 'Learning', planned: 0, actual: 0, emoji: '📚' },
    { name: 'Other', planned: 0, actual: 0, emoji: '💳' },
];

function BudgetPlanner() {
    const { data, fetchBudget, updateBudget, addDailyBudgetEntry, deleteBudgetEntry, getTodayDate, parseExpenseCommand } = usePlanner();

    const [year, setYear] = useState(dayjs().year());
    const [month, setMonth] = useState(dayjs().month() + 1);
    const [activeTab, setActiveTab] = useState('overview');
    const [smartSurplusDismissed, setSmartSurplusDismissed] = useState(false);

    const budgetKey = `${year}-${month}`;
    const budgetData = data.budget[budgetKey] || null;

    useEffect(() => {
        fetchBudget(year, month);
    }, [year, month, fetchBudget]);

    // Transaction form state
    const [entryAmount, setEntryAmount] = useState('');
    const [entryCategory, setEntryCategory] = useState('');
    const [entryNote, setEntryNote] = useState('');

    // AI Query State
    const [aiQuery, setAiQuery] = useState('');
    const [aiParsing, setAiParsing] = useState(false);

    const handleAiParse = async (e) => {
        if (e) e.preventDefault();
        if (!aiQuery.trim()) return;
        setAiParsing(true);
        try {
            const result = await parseExpenseCommand(aiQuery.trim());
            if (result && result.amount) {
                setEntryAmount(result.amount.toString());
                
                // Parse extracted category defensively, checking if the first token is an emoji prefix
                const rawCat = result.category || 'Other';
                const tokens = rawCat.trim().split(' ');
                const hasEmoji = tokens.length > 1 && /[\p{Emoji}\u200d]+/u.test(tokens[0]);
                const extractedName = hasEmoji ? tokens.slice(1).join(' ') : rawCat;

                const matchedCat = categories.find(c => 
                    c.name.toLowerCase() === extractedName.toLowerCase() ||
                    c.name.toLowerCase().includes(extractedName.toLowerCase()) ||
                    extractedName.toLowerCase().includes(c.name.toLowerCase())
                );
                
                if (matchedCat) {
                    setEntryCategory(matchedCat.name);
                } else {
                    setEntryCategory(categories[categories.length - 1]?.name || 'Other');
                }
                
                setEntryNote(result.label || '');
                toast.success(`AI Extracted: $${result.amount} under "${extractedName}"`, { icon: '🪄' });
                setAiQuery('');
            } else {
                toast.error("AI couldn't extract transactional fields. Please try manually.");
            }
        } catch (err) {
            console.error("AI ledger parser failed:", err);
            toast.error("AI connection issues.");
        } finally {
            setAiParsing(false);
        }
    };

    // Computed values — use DEFAULT_CATEGORIES if budget exists but categories are missing/empty
    const categories = useMemo(() => {
        const cats = budgetData?.categories;
        const validCats = Array.isArray(cats) 
            ? cats.filter(c => c && typeof c === 'object' && c.name) 
            : [];
        
        return validCats.length > 0 ? validCats : DEFAULT_CATEGORIES;
    }, [budgetData]);

    const dailyEntries = useMemo(() => budgetData?.dailyEntries || [], [budgetData]);
    const incomeSources = useMemo(() => budgetData?.incomeSources || [], [budgetData]);
    const savingsGoals = useMemo(() => budgetData?.savingsGoals || [], [budgetData]);
    const subscriptions = useMemo(() => budgetData?.subscriptions || [], [budgetData]);
    
    const totalIncome = useMemo(() => {
        const directIncome = parseFloat(budgetData?.income) || 0;
        const sourcedIncome = incomeSources.reduce((acc, src) => acc + (parseFloat(src.amount) || 0), 0);
        return directIncome + sourcedIncome;
    }, [budgetData, incomeSources]);

    const savingsGoal = useMemo(() => parseFloat(budgetData?.savingsGoal) || 0, [budgetData]);

    const totalSubBurn = useMemo(() => 
        subscriptions.filter(s => s.active).reduce((acc, sub) => acc + (parseFloat(sub.amount) || 0), 0), [subscriptions]);
    
    const totalPlanned = useMemo(() =>
        categories.reduce((acc, cat) => acc + (parseFloat(cat?.planned) || 0), 0) + totalSubBurn, [categories, totalSubBurn]);
    const totalActual = useMemo(() =>
        categories.reduce((acc, cat) => acc + (parseFloat(cat?.actual) || 0), 0) + totalSubBurn, [categories, totalSubBurn]);
    const totalSaved = useMemo(() => 
        savingsGoals.reduce((acc, goal) => acc + (parseFloat(goal.currentAmount) || 0), 0), [savingsGoals]);
    
    const cashOnHand = totalIncome - totalActual;
    const availableSurplus = cashOnHand - totalSaved;
    
    const monthlySurplus = Math.max(cashOnHand, 0);
    const savingsProgress = savingsGoal > 0 ? Math.min((totalActual < totalIncome ? (totalIncome - totalActual) : 0) / savingsGoal * 100, 100) : 0;
    const unallocated = totalIncome - totalPlanned - totalSaved;
    const remainingBudget = totalPlanned - totalActual;

    const currentMonthObj = dayjs().year(year).month(month - 1);

    // Pace metric: spending velocity vs expected pace
    const dayOfMonth = dayjs().date();
    const daysInMonth = currentMonthObj.daysInMonth();
    const timeProgress = daysInMonth > 0 ? dayOfMonth / daysInMonth : 0; // how far through the month
    const spendProgress = totalPlanned > 0 ? totalActual / totalPlanned : 0; // how much budget used
    const paceRatio = (totalPlanned > 0 && timeProgress > 0) ? spendProgress / timeProgress : 0;
    const pacePercent = totalPlanned > 0 ? Math.min(spendProgress * 100, 100) : 0;

    const smartSurplusSuggestion = useMemo(() => {
        if (availableSurplus <= 0 || savingsGoals.length === 0) return null;

        const activeGoals = savingsGoals
            .map((goal) => ({
                ...goal,
                targetAmount: parseFloat(goal?.targetAmount) || 0,
                currentAmount: parseFloat(goal?.currentAmount) || 0,
                allocationPercent: parseFloat(goal?.allocationPercent) || 0,
            }))
            .filter((goal) => goal.targetAmount > goal.currentAmount);

        if (activeGoals.length === 0) return null;

        const emergencyGoal = activeGoals.find((goal) => /emergency/i.test(goal?.name || ''));
        const highPriorityGoal = activeGoals.find((goal) => goal?.priority === 'high');
        const targetGoal = emergencyGoal || highPriorityGoal || activeGoals[0];
        if (!targetGoal) return null;

        const remaining = Math.max(targetGoal.targetAmount - targetGoal.currentAmount, 0);
        if (remaining <= 0) return null;

        const baseMonthlyContribution = monthlySurplus * (targetGoal.allocationPercent / 100);
        const baselineSuggestion = baseMonthlyContribution > 0 ? baseMonthlyContribution : availableSurplus * 0.25;
        const suggestedAmount = Math.min(remaining, availableSurplus, baselineSuggestion);
        if (suggestedAmount <= 0) return null;

        const monthsToGoal = baseMonthlyContribution > 0
            ? Math.ceil(remaining / baseMonthlyContribution)
            : null;
        const monthsAfterBoost = baseMonthlyContribution > 0
            ? Math.ceil(Math.max(remaining - suggestedAmount, 0) / baseMonthlyContribution)
            : null;
        const monthsEarlier = (monthsToGoal && monthsAfterBoost !== null)
            ? Math.max(monthsToGoal - monthsAfterBoost, 0)
            : null;

        return {
            goalId: targetGoal.id,
            goalName: targetGoal.name,
            availableSurplus,
            suggestedAmount,
            monthsEarlier,
        };
    }, [availableSurplus, monthlySurplus, savingsGoals]);

    useEffect(() => {
        setSmartSurplusDismissed(false);
    }, [year, month, smartSurplusSuggestion?.goalId]);

    // Handlers
    const handleUpdate = (field, value) => {
        updateBudget(year, month, { [field]: value });
    };

    const handleCategoryUpdate = (idx, updatedCat) => {
        updateBudget(year, month, (currentBudget) => {
            if (!currentBudget) return { categories: DEFAULT_CATEGORIES };
            const cats = currentBudget.categories || [...DEFAULT_CATEGORIES];
            const newCats = [...cats];
            newCats[idx] = updatedCat;
            return { categories: newCats };
        });
    };

    const handleAddCategory = (newCat) => {
        updateBudget(year, month, (currentBudget) => {
            if (!currentBudget) return { categories: [...DEFAULT_CATEGORIES, newCat] };
            const cats = currentBudget.categories || [...DEFAULT_CATEGORIES];
            return { categories: [...cats, newCat] };
        });
        toast.success('Category added', { icon: '📁' });
    };

    const handleDeleteCategory = (idx) => {
        updateBudget(year, month, (currentBudget) => {
            if (!currentBudget) return {};
            const cats = [...(currentBudget.categories || [])];
            cats.splice(idx, 1);
            return { categories: cats };
        });
        toast.success('Category removed', { icon: '🗑️' });
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!entryAmount || !entryCategory) return toast.error("Please enter amount and select a category");

        const amountNum = parseFloat(entryAmount);
        if (isNaN(amountNum) || amountNum <= 0) return toast.error("Please enter a valid amount");

        const today = getTodayDate();
        const entry = {
            id: Date.now().toString(),
            amount: amountNum,
            category: entryCategory,
            note: entryNote,
            timestamp: new Date().toISOString()
        };

        try {
            await addDailyBudgetEntry(year, month, today, [entry]);
            toast.success("Expense added!", { icon: '💳' });
            setEntryAmount('');
            setEntryNote('');
        } catch (err) {
            toast.error("Failed to add expense");
        }
    };

    const handleDeleteEntry = async (entryId, entry) => {
        try {
            await deleteBudgetEntry(year, month, entryId);
            toast.success("Expense deleted", { icon: '🗑️' });
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleApplySmartSurplus = () => {
        if (!smartSurplusSuggestion) return;

        const updatedGoals = savingsGoals.map((goal) => {
            if (goal.id !== smartSurplusSuggestion.goalId) return goal;
            const currentAmount = parseFloat(goal?.currentAmount) || 0;
            const targetAmount = parseFloat(goal?.targetAmount) || 0;
            return {
                ...goal,
                currentAmount: Math.min(currentAmount + smartSurplusSuggestion.suggestedAmount, targetAmount),
            };
        });

        handleUpdate('savingsGoals', updatedGoals);
        setSmartSurplusDismissed(true);
        toast.success(
            `Moved $${smartSurplusSuggestion.suggestedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} to ${smartSurplusSuggestion.goalName}`,
            { icon: '💸' }
        );
    };

    // Loading state
    if (!budgetData) {
        return (
            <div className="flex h-full items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Loading budget...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 py-6 mb-20 md:mb-6 space-y-6 font-sans"
        >
            {/* ═══ HEADER ═══ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary">
                            {year}
                        </Badge>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Monthly Budget</h1>
                    <p className="text-xs text-muted-foreground">Track your income, expenses, and savings in one place</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-muted/20 p-0.5 rounded-lg border border-border/50">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5 inline mr-1" /> Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <BarChart3 className="w-3.5 h-3.5 inline mr-1" /> Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('wealth')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'wealth' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <PiggyBank className="w-3.5 h-3.5 inline mr-1" /> Wealth
                        </button>
                    </div>

                    {/* Month Nav */}
                    <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50">
                        <Button
                            variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
                            onClick={() => {
                                if (month === 1) { setMonth(12); setYear(y => y - 1); }
                                else { setMonth(m => m - 1); }
                            }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="px-4 py-1 flex flex-col items-center min-w-[110px]">
                            <span className="text-xs font-black uppercase tracking-widest text-primary leading-none">{currentMonthObj.format('MMMM')}</span>
                            <span className="text-[9px] font-mono opacity-30 font-bold">{year}</span>
                        </div>
                        <Button
                            variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
                            onClick={() => {
                                if (month === 12) { setMonth(1); setYear(y => y + 1); }
                                else { setMonth(m => m + 1); }
                            }}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ═══ DASHBOARD CARDS ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Income */}
                <Card className="bg-secondary/10 shadow-none border-border group hover:border-primary/30 transition-all">
                    <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Income</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 opacity-50 group-hover:opacity-100" />
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-xl sm:text-2xl font-black text-foreground font-mono">
                            ${totalIncome.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 mt-1 opacity-60 hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Base:</span>
                            <span className="text-[9px] font-mono opacity-30">$</span>
                            <input
                                type="number"
                                value={budgetData.income || ''}
                                onChange={(e) => handleUpdate('income', parseFloat(e.target.value) || 0)}
                                className="w-16 bg-transparent border-none text-[10px] font-mono font-bold focus:outline-none p-0 text-foreground dark:text-zinc-200"
                            />
                        </div>
                        {incomeSources.length > 0 && (
                            <p className="text-[9px] text-emerald-500 font-bold mt-1">+{incomeSources.length} sources included</p>
                        )}
                    </CardContent>
                </Card>

                {/* Allocated */}
                <Card className="bg-secondary/10 shadow-none border-border group hover:border-primary/30 transition-all">
                    <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Budgeted</span>
                        <Target className="w-3.5 h-3.5 text-blue-500 opacity-50 group-hover:opacity-100" />
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-xl sm:text-2xl font-black text-foreground font-mono">${totalPlanned.toLocaleString()}</p>
                        {unallocated !== 0 && totalIncome > 0 && (
                            <p className={`text-[9px] font-mono mt-0.5 ${unallocated > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                {unallocated > 0 ? `$${unallocated.toLocaleString()} unassigned` : `$${Math.abs(unallocated).toLocaleString()} overspent`}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Spent */}
                <Card className="bg-secondary/10 shadow-none border-border group hover:border-primary/30 transition-all">
                    <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Spent</span>
                        <TrendingUp className="w-3.5 h-3.5 text-orange-500 opacity-50 group-hover:opacity-100" />
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-xl sm:text-2xl font-black text-foreground font-mono">${totalActual.toLocaleString()}</p>
                        <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">
                            Includes <span className="text-orange-400 font-bold">${totalSubBurn.toLocaleString()}</span> in subscriptions
                        </p>
                    </CardContent>
                </Card>

                {/* Available Surplus */}
                <Card className={`shadow-none border-border group transition-all ${availableSurplus < 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-secondary/10 hover:border-primary/30'}`}>
                    <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Available Surplus</span>
                        <Wallet className={`w-3.5 h-3.5 opacity-50 group-hover:opacity-100 ${availableSurplus < 0 ? 'text-red-500' : 'text-primary'}`} />
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className={`text-xl sm:text-2xl font-black font-mono ${availableSurplus < 0 ? 'text-red-400' : 'text-foreground'}`}>
                            {availableSurplus < 0 ? '-' : ''}${Math.abs(availableSurplus).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5">
                            {availableSurplus < 0 ? 'Negative cashflow' : 'Truly unassigned cash'}
                        </p>
                    </CardContent>
                </Card>

                {/* Total Saved */}
                <Card className="bg-secondary/10 shadow-none border-border group hover:border-emerald-500/30 transition-all">
                    <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Saved</span>
                        <PiggyBank className="w-3.5 h-3.5 text-emerald-500 opacity-50 group-hover:opacity-100" />
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <p className="text-xl sm:text-2xl font-black font-mono text-foreground">${totalSaved.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5">Stored in wealth goals</p>
                    </CardContent>
                </Card>

                {/* Spending Pace */}
                <Card className={`bg-secondary/10 shadow-none border-border group transition-all ${totalPlanned <= 0 ? '' : paceRatio > 1.2 && availableSurplus < 500 ? 'border-red-500/20 bg-red-500/5' : paceRatio > 0.9 ? 'border-amber-500/20' : 'hover:border-emerald-500/20'}`}>
                    <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Budget Usage vs Time</span>
                        <Gauge className={`w-3.5 h-3.5 opacity-50 group-hover:opacity-100 ${totalPlanned <= 0 ? 'text-muted-foreground' : paceRatio > 1.2 && availableSurplus < 500 ? 'text-red-400' : paceRatio > 0.9 ? 'text-amber-400' : 'text-emerald-400'}`} />
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        {totalPlanned > 0 ? (
                            <>
                                <div className="flex items-baseline gap-2">
                                    <p className={`text-xl sm:text-2xl font-black font-mono ${paceRatio > 1.2 && availableSurplus < 500 ? 'text-red-400' : 'text-slate-500'}`}>
                                        {(spendProgress * 100).toFixed(0)}%
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/30 font-mono">budget used</p>
                                </div>
                                <p className="text-[9px] text-muted-foreground/50 mt-1">
                                    {paceRatio > 1.2
                                        ? `Spending velocity is high — ${(timeProgress * 100).toFixed(0)}% of month gone`
                                        : paceRatio > 0.9
                                        ? `Pacing according to schedule — Day ${dayOfMonth} of ${daysInMonth}`
                                        : `Spending slower than expected — Day ${dayOfMonth} of ${daysInMonth}`
                                    }
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-black font-mono text-muted-foreground/30">—</p>
                                <p className="text-[9px] text-muted-foreground/30 mt-0.5">Set a category budget to track</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ═══ MAIN CONTENT ═══ */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* LEFT: Categories */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Planned Expenses</h3>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0 h-5 border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                                   ${totalPlanned.toLocaleString()} Total
                                </Badge>
                            </div>
                            <BudgetCategoryList
                                categories={categories}
                                totalIncome={totalIncome}
                                onCategoryUpdate={handleCategoryUpdate}
                                onAddCategory={handleAddCategory}
                                onDeleteCategory={handleDeleteCategory}
                            />
                        </div>

                        {/* RIGHT: Management */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Add Expense Form */}
                            <Card className="bg-zinc-950 dark:bg-zinc-900/60 border border-zinc-800 dark:border-zinc-800/80 shadow-2xl p-5 text-zinc-100 relative overflow-hidden group rounded-3xl">
                                <div className="absolute top-0 right-0 p-3 opacity-[0.05] pointer-events-none -rotate-12 scale-150 transition-transform group-hover:scale-125">
                                    <Receipt className="w-28 h-28 text-white" />
                                </div>

                                <div className="relative z-10 space-y-4">
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest leading-none mb-0.5 text-zinc-100">Quick Ledger</h2>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Record your spending</p>
                                    </div>

                                    {/* AI Quick Command Bar */}
                                    <div className="space-y-1 text-left">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-0.5 flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5 text-primary" /> AI Quick Command
                                        </label>
                                        <div className="relative">
                                            <Input
                                                placeholder="e.g. Spent ৳350 on Uber transport..."
                                                value={aiQuery}
                                                onChange={(e) => setAiQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAiParse(e)}
                                                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 h-9 pr-10 text-xs font-bold w-full"
                                                disabled={aiParsing}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAiParse}
                                                disabled={aiParsing || !aiQuery.trim()}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 disabled:opacity-35 transition-colors cursor-pointer flex items-center justify-center h-8 w-8"
                                            >
                                                {aiParsing ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative flex py-1 items-center">
                                        <div className="flex-grow border-t border-zinc-800"></div>
                                        <span className="flex-shrink mx-2 text-[8px] font-black uppercase tracking-widest text-zinc-500">Or manual input</span>
                                        <div className="flex-grow border-t border-zinc-800"></div>
                                    </div>

                                    <form onSubmit={handleAddExpense} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-0.5">Amount</label>
                                                <Input
                                                    type="number" step="0.01" placeholder="0.00"
                                                    value={entryAmount}
                                                    onChange={(e) => setEntryAmount(e.target.value)}
                                                    className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 h-9 font-mono font-bold text-sm"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-0.5">Category</label>
                                                <select
                                                    value={entryCategory}
                                                    onChange={(e) => setEntryCategory(e.target.value)}
                                                    className="w-full h-9 bg-zinc-900/50 border border-zinc-800 rounded-md px-2.5 text-xs font-bold text-zinc-100 focus:outline-none appearance-none cursor-pointer"
                                                    required
                                                >
                                                    <option value="" disabled className="text-zinc-500 bg-zinc-900">Pick one...</option>
                                                    {categories.map((c, i) => (
                                                        <option key={i} value={c.name} className="text-zinc-100 bg-zinc-900">{c.emoji} {c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-0.5">Note</label>
                                            <Input
                                                placeholder="e.g. Lunch, Coffee..."
                                                value={entryNote}
                                                onChange={(e) => setEntryNote(e.target.value)}
                                                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 h-9 font-bold text-xs"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full h-10 bg-white text-zinc-950 hover:bg-zinc-200 font-black uppercase tracking-[0.15em] text-[10px] shadow-lg shadow-black/20 cursor-pointer rounded-xl border-none"
                                        >
                                            Log Transaction <Plus className="w-3 h-3 ml-1.5" />
                                        </Button>
                                    </form>
                                </div>
                            </Card>

                            {/* Income Streams List */}
                            <BudgetIncomeSourceList
                                sources={incomeSources}
                                onAdd={(newSource) => handleUpdate('incomeSources', [...incomeSources, newSource])}
                                onDelete={(idx) => handleUpdate('incomeSources', incomeSources.filter((_, i) => i !== idx))}
                            />

                            {/* Mini Ledger */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-2">History</h3>
                                <div className="h-[300px] overflow-hidden rounded-2xl border border-border/50 bg-secondary/5">
                                    <BudgetLedger
                                        dailyEntries={dailyEntries}
                                        categories={categories}
                                        onDeleteEntry={handleDeleteEntry}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : activeTab === 'analytics' ? (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left: Donut Chart */}
                            <div className="lg:col-span-5">
                                <Card className="bg-secondary/10 shadow-none border-border">
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" /> Where Your Money Goes
                                        </CardTitle>
                                        <CardDescription className="text-[10px] text-muted-foreground/50">
                                            Spending breakdown by category
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2 flex justify-center">
                                        <BudgetDonutChart
                                            categories={categories}
                                            totalIncome={totalIncome}
                                            size={200}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right: Insights */}
                            <div className="lg:col-span-7">
                                <Card className="bg-secondary/10 shadow-none border-border">
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-primary" /> Budget Health
                                        </CardTitle>
                                        <CardDescription className="text-[10px] text-muted-foreground/50">
                                            How well you're staying within your budget
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        <BudgetInsights
                                            categories={categories}
                                            totalIncome={totalIncome}
                                            dailyEntries={dailyEntries}
                                            year={year}
                                            month={month}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Subscriptions */}
                        <Card className="bg-secondary/10 shadow-none border-border">
                            <CardContent className="p-5">
                                <BudgetSubscriptions
                                    subscriptions={subscriptions}
                                    totalIncome={totalIncome}
                                    onUpdate={(updated) => handleUpdate('subscriptions', updated)}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    /* ═══ WEALTH TAB ═══ */
                    <motion.div
                        key="wealth"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {smartSurplusSuggestion && !smartSurplusDismissed && (
                            <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
                                <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                            Smart Surplus Coach
                                        </p>
                                        <p className="text-xs text-foreground/90">
                                            You have <span className="font-bold text-emerald-500">${smartSurplusSuggestion.availableSurplus.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> extra this month;
                                            consider moving <span className="font-bold">${smartSurplusSuggestion.suggestedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> to your
                                            {' '}<span className="font-bold">{smartSurplusSuggestion.goalName}</span>
                                            {smartSurplusSuggestion.monthsEarlier && smartSurplusSuggestion.monthsEarlier > 0
                                                ? ` to hit your goal ${smartSurplusSuggestion.monthsEarlier} month${smartSurplusSuggestion.monthsEarlier > 1 ? 's' : ''} earlier.`
                                                : ' to hit your goal sooner.'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={handleApplySmartSurplus}
                                            className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500"
                                        >
                                            Move ${smartSurplusSuggestion.suggestedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSmartSurplusDismissed(true)}
                                            className="h-8 px-3 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Not now
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Savings Goals */}
                        <Card className="bg-secondary/10 shadow-none border-border">
                            <CardContent className="p-5">
                                <BudgetSavingsGoals
                                    goals={savingsGoals}
                                    totalIncome={totalIncome}
                                    totalActual={totalActual}
                                    onUpdate={(updated) => handleUpdate('savingsGoals', updated)}
                                />
                            </CardContent>
                        </Card>

                        {/* Can I Afford It? */}
                        <Card className="bg-secondary/10 shadow-none border-border">
                            <CardContent className="p-5">
                                <BudgetSimulator
                                    totalIncome={totalIncome}
                                    totalActual={totalActual}
                                    totalPlanned={totalPlanned}
                                    savingsGoals={savingsGoals}
                                    monthlySurplus={monthlySurplus}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default BudgetPlanner;
