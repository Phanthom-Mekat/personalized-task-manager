import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const SkeletonLoader = ({ type = 'generic' }) => {
    // Pulse animation styles using modern HSL tailwind colors matching the zinc/dark premium theme
    const pulseBg = "bg-secondary/20 animate-pulse rounded-xl";
    const pulseTextShort = "h-3.5 bg-secondary/35 animate-pulse rounded-md w-24";
    const pulseTextLong = "h-3 bg-secondary/25 animate-pulse rounded-md w-full";
    const pulseTextMedium = "h-3 bg-secondary/30 animate-pulse rounded-md w-2/3";
    const pulseCircle = "w-8 h-8 rounded-full bg-secondary/30 animate-pulse shrink-0";

    const renderTasksSkeleton = () => (
        <div className="space-y-8 sm:space-y-12">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/30 pb-6 sm:pb-8 gap-6">
                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-primary/20 animate-pulse rounded-full" />
                        <div className="h-3 w-32 bg-secondary/30 animate-pulse rounded-md" />
                    </div>
                    <div className="h-10 sm:h-12 w-64 bg-secondary/30 animate-pulse rounded-xl" />
                    <div className="h-4 w-48 bg-secondary/20 animate-pulse rounded-md" />
                </div>
                <div className="hidden lg:flex items-center gap-8">
                    <div className="space-y-2">
                        <div className="h-2 w-12 bg-secondary/20 animate-pulse rounded" />
                        <div className="h-6 w-20 bg-secondary/30 animate-pulse rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 w-12 bg-secondary/20 animate-pulse rounded" />
                        <div className="h-6 w-20 bg-secondary/30 animate-pulse rounded-md" />
                    </div>
                </div>
            </div>

            {/* Add Task Form Skeleton */}
            <div className="p-4 sm:p-6 bg-card border border-border/50 rounded-3xl space-y-4">
                <div className="flex gap-4">
                    <div className="h-12 bg-secondary/20 animate-pulse rounded-2xl flex-1" />
                    <div className="h-12 w-24 bg-secondary/30 animate-pulse rounded-2xl" />
                </div>
            </div>

            {/* 3 Columns Task Board Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((col) => (
                    <div key={col} className="space-y-6">
                        {/* Column Header */}
                        <div className="flex justify-between items-center px-2">
                            <div className="h-4 w-24 bg-secondary/30 animate-pulse rounded-md" />
                            <div className="h-5 w-8 bg-secondary/20 animate-pulse rounded-full" />
                        </div>
                        {/* Column Content Cards */}
                        <div className="space-y-4">
                            {[1, 2].map((card) => (
                                <Card key={card} className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5 flex-1">
                                            <div className="w-4 h-4 rounded bg-secondary/30 animate-pulse" />
                                            <div className="space-y-2 flex-1">
                                                <div className={pulseTextMedium} />
                                                <div className={pulseTextLong} />
                                            </div>
                                        </div>
                                        <div className="w-5 h-5 rounded-md bg-secondary/30 animate-pulse" />
                                    </div>
                                    <Separator className="opacity-30" />
                                    <div className="flex items-center justify-between">
                                        <div className="h-4 w-12 bg-secondary/20 animate-pulse rounded-full" />
                                        <div className="h-3 w-16 bg-secondary/20 animate-pulse rounded" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderWeeklySkeleton = () => (
        <div className="space-y-8 md:space-y-12">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 md:pb-8 border-b border-border/30">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-secondary/20 animate-pulse rounded-full" />
                    <div className="h-10 sm:h-12 w-80 bg-secondary/30 animate-pulse rounded-xl" />
                </div>
                <div className="h-12 w-full md:w-48 bg-secondary/20 animate-pulse rounded-2xl" />
            </div>

            {/* Weekly Progress Bar Skeleton */}
            <div className="space-y-3">
                <div className="flex justify-between px-2">
                    <div className="h-4 w-40 bg-secondary/30 animate-pulse rounded-md" />
                    <div className="h-6 w-12 bg-secondary/35 animate-pulse rounded-md" />
                </div>
                <div className="h-4 w-full bg-secondary/15 animate-pulse rounded-full border border-border/30" />
            </div>

            {/* AI Review Panel Skeleton */}
            <Card className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary/35 animate-pulse" />
                    <div className="h-4 w-44 bg-secondary/35 animate-pulse rounded-md" />
                </div>
                <div className="space-y-3">
                    <div className="h-6 w-3/4 bg-secondary/30 animate-pulse rounded-md" />
                    <div className="h-4 w-full bg-secondary/20 animate-pulse rounded-md" />
                    <div className="h-4 w-5/6 bg-secondary/20 animate-pulse rounded-md" />
                </div>
            </Card>

            {/* Core Strategy Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Theme card */}
                <Card className="bg-card border border-border/40 rounded-3xl p-6 sm:p-8 space-y-4">
                    <div className="h-4 w-32 bg-secondary/30 animate-pulse rounded-md" />
                    <div className="h-8 w-full bg-secondary/20 animate-pulse rounded-xl" />
                </Card>
                {/* Priority Focus */}
                <Card className="bg-card border border-border/40 rounded-3xl p-6 sm:p-8 space-y-4">
                    <div className="h-4 w-32 bg-secondary/30 animate-pulse rounded-md" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-3 w-4 bg-secondary/20 animate-pulse rounded" />
                                <div className="h-4 bg-secondary/25 animate-pulse rounded-md flex-1" />
                                <div className="w-3 h-3 rounded-full bg-secondary/30 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderDailySkeleton = () => (
        <div className="space-y-8">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/30 pb-6 sm:pb-8 gap-6">
                <div className="space-y-2">
                    <div className="h-4 w-28 bg-secondary/20 animate-pulse rounded-full" />
                    <div className="h-10 sm:h-12 w-64 bg-secondary/30 animate-pulse rounded-xl" />
                </div>
                <div className="h-12 w-full md:w-48 bg-secondary/20 animate-pulse rounded-2xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Sliders & Sleep */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-card border border-border/40 rounded-3xl p-6 space-y-6">
                        <div className="h-4 w-28 bg-secondary/35 animate-pulse rounded-md" />
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-3 w-16 bg-secondary/30 animate-pulse rounded" />
                                    <div className="h-3 w-6 bg-secondary/30 animate-pulse rounded" />
                                </div>
                                <div className="h-2 w-full bg-secondary/15 animate-pulse rounded-full" />
                            </div>
                        ))}
                    </Card>
                </div>

                {/* Right Panel: Time-Blocks */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border border-border/40 rounded-3xl p-6 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-border/20">
                            <div className="h-4 w-36 bg-secondary/35 animate-pulse rounded-md" />
                            <div className="h-4 w-20 bg-secondary/25 animate-pulse rounded-md" />
                        </div>
                        {/* Time Slots */}
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-secondary/5 border border-border/25 rounded-2xl">
                                    <div className="h-5 w-12 bg-secondary/30 animate-pulse rounded-md text-center" />
                                    <div className="h-4 bg-secondary/20 animate-pulse rounded-md flex-1" />
                                    <div className="w-5 h-5 rounded-full bg-secondary/30 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );

    const renderGenericSkeleton = () => (
        <div className="space-y-8 animate-pulse">
            <div className="h-10 w-48 bg-secondary/30 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64 bg-secondary/15 border border-border/30 rounded-3xl" />
                <div className="h-64 bg-secondary/15 border border-border/30 rounded-3xl" />
            </div>
        </div>
    );

    switch (type) {
        case 'tasks':
            return renderTasksSkeleton();
        case 'weekly':
            return renderWeeklySkeleton();
        case 'daily':
            return renderDailySkeleton();
        case 'generic':
        default:
            return renderGenericSkeleton();
    }
};

export default SkeletonLoader;
