import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHaptics } from '../../hooks/useHaptics';

function TimeBlock({ slot, index, onChange }) {
    const { triggerSuccess } = useHaptics();
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging
    } = useSortable({ id: `slot-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            layout
            className={`group flex items-center gap-3 px-4 py-3 rounded-md border transition-all duration-200 ${isDragging ? 'z-50 scale-[1.02] shadow-xl bg-background border-primary/50' : 'bg-card/50 border-border hover:border-primary/30'} ${slot.done ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
            {/* Drag handle */}
            <div
                {...listeners}
                className="cursor-grab text-muted-foreground/30 hover:text-primary transition-colors flex-shrink-0"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Time label */}
            <span className={`text-[10px] font-black w-10 flex-shrink-0 font-mono tracking-tighter ${slot.done ? 'text-muted-foreground/40' : 'text-muted-foreground/70'}`}>
                {slot.time}
            </span>

            {/* Task input */}
            <input
                type="text"
                value={slot.task}
                onChange={(e) => onChange(index, { ...slot, task: e.target.value })}
                placeholder="Declare intention..."
                className={`flex-1 bg-transparent text-sm border-none outline-none placeholder:text-muted-foreground/20 font-medium transition-all ${slot.done ? 'line-through text-muted-foreground/40' : 'text-foreground'}`}
            />

            {/* Done checkbox */}
            <button
                onClick={() => {
                    const nextDone = !slot.done;
                    if (nextDone) triggerSuccess();
                    onChange(index, { ...slot, done: nextDone });
                }}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${slot.done
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50'
                    }`}
            >
                {slot.done && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                        <Check className="w-3 h-3 stroke-[3]" />
                    </motion.div>
                )}
            </button>
        </motion.div>
    );
}

export default TimeBlock;
