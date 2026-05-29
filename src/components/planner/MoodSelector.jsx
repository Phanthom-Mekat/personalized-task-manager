import { motion } from 'framer-motion';

const emojiSets = {
    energy: ['😴', '😑', '🙂', '😊', '⚡'],
    mood: ['😢', '😕', '😐', '😊', '🤩'],
};

function MoodSelector({ type = 'energy', value = 3, onChange, label }) {
    const emojis = emojiSets[type] || emojiSets.energy;

    return (
        <div className="space-y-1.5">
            {label && (
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                </span>
            )}
            <div className="flex gap-2">
                {emojis.map((emoji, i) => {
                    const level = i + 1;
                    const isSelected = value === level;
                    return (
                        <motion.button
                            key={level}
                            type="button"
                            onClick={() => onChange(level)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${isSelected
                                ? 'bg-primary/15 ring-2 ring-primary shadow-md scale-110'
                                : 'bg-card border border-border hover:bg-accent'
                                }`}
                        >
                            {emoji}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

export default MoodSelector;
