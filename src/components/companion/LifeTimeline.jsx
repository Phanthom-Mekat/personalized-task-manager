import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    GraduationCap, Briefcase, Heart, Baby, Star,
    MapPin, Trophy, Lightbulb, Clock, Loader2
} from 'lucide-react';

const CATEGORY_CONFIG = {
    education: { icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    career:    { icon: Briefcase,      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    love:      { icon: Heart,          color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    childhood: { icon: Baby,           color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    milestone: { icon: Trophy,         color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    goals:     { icon: Lightbulb,      color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    default:   { icon: Star,           color: 'text-muted-foreground', bg: 'bg-secondary/30', border: 'border-border/40' },
};

function getCategory(item) {
    const text = (item || '').toLowerCase();
    if (text.includes('school') || text.includes('university') || text.includes('degree') || text.includes('graduat')) return 'education';
    if (text.includes('job') || text.includes('work') || text.includes('company') || text.includes('career')) return 'career';
    if (text.includes('love') || text.includes('relationship') || text.includes('partner') || text.includes('dating')) return 'love';
    if (text.includes('born') || text.includes('child') || text.includes('grew up') || text.includes('childhood')) return 'childhood';
    if (text.includes('goal') || text.includes('dream') || text.includes('plan') || text.includes('ambition')) return 'goals';
    if (text.includes('achievement') || text.includes('award') || text.includes('milestone')) return 'milestone';
    return 'default';
}

function LifeTimeline({ profile, apiCall }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        apiCall('GET', '/memories')
            .then(data => {
                if (active && data) {
                    setMemories(data);
                }
            })
            .catch(err => console.error('Failed to load memories:', err))
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [apiCall]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
        );
    }

    // Build timeline items from profile data
    const items = [];

    if (profile?.basics?.birthplace) {
        items.push({ text: `Born in ${profile.basics.birthplace}`, period: 'Origins', raw: 'born childhood' });
    }
    if (profile?.basics?.birthday) {
        items.push({ text: `Birthday: ${profile.basics.birthday}`, period: 'Origins', raw: 'born childhood' });
    }

    // Schools
    for (const school of (profile?.educationAndCareer?.schools || [])) {
        items.push({ text: `Attended ${school}`, period: 'Education', raw: `school education ${school}` });
    }
    if (profile?.educationAndCareer?.university) {
        items.push({ text: `University: ${profile.educationAndCareer.university}`, period: 'Education', raw: 'university education' });
    }
    if (profile?.educationAndCareer?.degree) {
        items.push({ text: `Degree: ${profile.educationAndCareer.degree}`, period: 'Education', raw: 'degree education graduated' });
    }

    // Work history
    for (const job of (profile?.educationAndCareer?.workHistory || [])) {
        items.push({ text: `${job.role} at ${job.company}${job.duration ? ` (${job.duration})` : ''}`, period: 'Career', raw: `job work career ${job.role}` });
    }
    if (profile?.educationAndCareer?.currentJob) {
        items.push({ text: `Current: ${profile.educationAndCareer.currentJob} at ${profile.educationAndCareer.company || ''}`, period: 'Career', raw: 'current job career work' });
    }

    // Relationships
    if (profile?.relationships?.loveLife) {
        items.push({ text: profile.relationships.loveLife, period: 'Relationships', raw: 'love relationship' });
    }

    // Ambitions as future timeline
    for (const ambition of (profile?.personality?.ambitions || [])) {
        items.push({ text: ambition, period: 'Future', raw: `goal ambition dream plan ${ambition}` });
    }

    // Dynamic semantic memories
    for (const mem of memories) {
        let period = 'Adulthood';
        const cat = (mem.category || '').toLowerCase();

        if (cat === 'education') period = 'Education';
        else if (cat === 'career') period = 'Career';
        else if (cat === 'relationships' || cat === 'family') period = 'Relationships';
        else if (cat === 'milestones') period = 'Origins';
        else if (cat === 'finance') period = 'Future';
        
        if (!['Origins', 'Education', 'Career', 'Relationships', 'Future'].includes(period)) {
            period = 'Adulthood';
        }

        const textLower = mem.content.toLowerCase();
        const isDuplicate = items.some(it => textLower.includes(it.text.toLowerCase()) || it.text.toLowerCase().includes(textLower));
        
        if (!isDuplicate) {
            items.push({ text: mem.content, period, raw: `${mem.category} ${mem.content}` });
        }
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center border border-violet-500/10">
                    <Clock className="w-6 h-6 text-violet-400" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Your life timeline is empty. Share memories with your companion or answer training questions to build it.
                </p>
            </div>
        );
    }

    // Group by period
    const groups = {};
    for (const item of items) {
        if (!groups[item.period]) groups[item.period] = [];
        groups[item.period].push(item);
    }

    const periodOrder = ['Origins', 'Education', 'Career', 'Relationships', 'Adulthood', 'Future'];
    const sortedPeriods = Object.keys(groups).sort((a, b) => {
        const ai = periodOrder.indexOf(a);
        const bi = periodOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-base font-bold">Life Timeline</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {items.length} milestones across {sortedPeriods.length} life periods
                </p>
            </div>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border/40" />

                <div className="space-y-8">
                    {sortedPeriods.map((period, pi) => (
                        <div key={period}>
                            {/* Period Header */}
                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/10 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-violet-400" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {period}
                                </span>
                            </div>

                            {/* Items */}
                            <div className="space-y-3 pl-14">
                                {groups[period].map((item, ii) => {
                                    const cat = getCategory(item.raw);
                                    const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.default;
                                    const Icon = cfg.icon;

                                    return (
                                        <motion.div
                                            key={`${period}-${ii}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: pi * 0.1 + ii * 0.05, duration: 0.3 }}
                                            className={`flex items-start gap-3 p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}
                                        >
                                            <div className={`mt-0.5 ${cfg.color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default LifeTimeline;
