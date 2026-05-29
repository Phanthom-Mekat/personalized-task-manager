import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { usePlanner } from '../../provider/PlannerProvider';

const RitualBanner = ({ onOpen }) => {
    const { pendingRituals } = usePlanner();

    if (!pendingRituals || pendingRituals.length === 0) return null;

    const current = pendingRituals[0];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-2xl mx-auto mt-6 mb-2 px-4"
            >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                            ✨
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm leading-tight">
                                {current.title} Pending
                            </h4>
                            <p className="text-indigo-100 text-xs opacity-80">
                                Reflect on {current.period} to maintain your momentum.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onOpen}
                        className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-50 transition-colors flex items-center gap-2 group"
                    >
                        Begin Ritual
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RitualBanner;
