import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

function IntentionWall({ onSubmit }) {
    const [task, setTask] = useState('');
    const [isExiting, setIsExiting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (task.trim().length >= 5) {
            setIsExiting(true);
            setTimeout(() => onSubmit(task.trim()), 600);
        }
    };

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                        className="w-full max-w-xl px-6"
                    >
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                                className="text-5xl mb-4"
                            >
                                ⭐
                            </motion.div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                                What&apos;s the ONE thing
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                that would make today great?
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="e.g. Finish the API integration"
                                autoFocus
                                className="w-full px-6 py-4 text-xl bg-card border-2 border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />

                            <div className="flex items-center justify-between">
                                <span className={`text-sm ${task.length >= 5 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                    {task.length < 5 ? `${5 - task.length} more characters` : '✓ Ready'}
                                </span>
                                <motion.button
                                    type="submit"
                                    disabled={task.trim().length < 5}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
                                >
                                    Let&apos;s Go →
                                </motion.button>
                            </div>
                        </form>

                        <p className="text-center text-sm text-muted-foreground mt-8 italic">
                            "The secret of getting ahead is getting started."
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default IntentionWall;
