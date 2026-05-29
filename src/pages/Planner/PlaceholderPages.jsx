import { motion } from 'framer-motion';

function PlaceholderPage({ title, emoji, description }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4"
        >
            <span className="text-6xl mb-4">{emoji}</span>
            <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground text-center max-w-md">
                {description}
            </p>
            <div className="mt-6 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Coming in Phase 2
            </div>
        </motion.div>
    );
}

export const MonthlyPlanner = () => (
    <PlaceholderPage title="Monthly Planner" emoji="📅" description="Set monthly intentions, track habits with a heatmap grid, and reflect on what worked." />
);

export const YearlyPlanner = () => (
    <PlaceholderPage title="Yearly Planner" emoji="🎯" description="Define your year's vision, set 12 monthly goals, and review each quarter." />
);

export const BudgetPlanner = () => (
    <PlaceholderPage title="Budget Planner" emoji="💰" description="Track monthly budgets by category and log daily expenses. Know where your money goes." />
);

export const Notebook = () => (
    <PlaceholderPage title="Notebook" emoji="📓" description="12 freeform pages with markdown support and tagging. Your personal knowledge base." />
);

export const PlannerCalendar = () => (
    <PlaceholderPage title="Calendar" emoji="🗺️" description="See your 6-month journey at a glance with color-coded dot indicators." />
);
