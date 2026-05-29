import React from 'react';
import dayjs from 'dayjs';

/**
 * A GitHub-style habit contribution graph.
 * @param {Object} data - The map of date strings (YYYY-MM-DD) to growth entries.
 * @param {string} habitKey - Which habit to track (e.g., 'exercised', 'noReels', or 'overall' productivity)
 * @param {string} startDate - YYYY-MM-DD
 * @param {number} days - Number of days to display (e.g., 30 for a month, 365 for a year)
 */
function HabitGrid({ data = {}, habitKey = 'noReels', startDate, days = 30 }) {
    const start = dayjs(startDate);
    
    // Generate an array of dates
    const gridDays = Array.from({ length: days }, (_, i) => {
        const d = start.add(i, 'day');
        const dateStr = d.format('YYYY-MM-DD');
        const entry = data[dateStr];
        
        let level = 0; // 0: no data, 1-4: intensity

        if (entry) {
            if (habitKey === 'overall') {
                // Map productivity 1-10 to 4 levels
                const score = entry.productivityScore || 0;
                if (score >= 8) level = 4;
                else if (score >= 6) level = 3;
                else if (score >= 4) level = 2;
                else if (score > 0) level = 1;
            } else if (entry.habits && entry.habits[habitKey]) {
                level = 4; // Checkmark is max intensity
            } else {
                level = 1; // Logged but didn't do the habit
            }
        }

        return { date: dateStr, level, d };
    });

    // Helper to get Tailwind color classes based on level
    const getColorClass = (lvl) => {
        if (habitKey === 'noReels') {
            const colors = [
                'bg-muted/30 border-transparent', // 0
                'bg-orange-500/20 border-orange-500/10', // 1
                'bg-orange-500/40 border-orange-500/20', // 2
                'bg-orange-500/70 border-orange-500/40', // 3
                'bg-orange-500 border-orange-600',       // 4
            ];
            return colors[lvl] || colors[0];
        }
        
        // Emerald for general habits/overall
        const colors = [
            'bg-muted/30 border-transparent', // 0
            'bg-emerald-500/20 border-emerald-500/10', // 1
            'bg-emerald-500/40 border-emerald-500/20', // 2
            'bg-emerald-500/70 border-emerald-500/40', // 3
            'bg-emerald-500 border-emerald-600',       // 4
        ];
        return colors[lvl] || colors[0];
    };

    return (
        <div className="flex flex-wrap gap-1.5 md:gap-2">
            {gridDays.map((day, i) => (
                <div
                    key={day.date}
                    title={`${day.d.format('MMM D')}: ${day.level > 0 ? 'Logged' : 'No Data'}`}
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-sm border transition-colors ${getColorClass(day.level)} hover:ring-2 hover:ring-ring focus:outline-none`}
                />
            ))}
        </div>
    );
}

export default HabitGrid;
