"use client"

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Task from "./Task";
import { 
    ClipboardList, Zap, Target, 
    CheckCircle2, ChevronDown, Activity, 
    Layers, Plus 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function TaskList({ category, tasks, onTaskUpdate }) {
  const { setNodeRef, isOver } = useDroppable({
    id: category,
    data: {
      type: "TaskList",
      category,
    },
  });

  const getCategoryTheme = (category) => {
    switch (category) {
      case "To-Do":
        return { icon: Target, color: "text-rose-500", label: "Macro Pending" };
      case "In Progress":
        return { icon: Activity, color: "text-amber-500", label: "Active Vector" };
      case "Done":
        return { icon: CheckCircle2, color: "text-emerald-500", label: "Archive Secure" };
      default:
        return { icon: Layers, color: "text-primary", label: "General" };
    }
  };

  const theme = getCategoryTheme(category);

  return (
    <Card 
      className={`rounded-3xl border-border bg-secondary/5 shadow-none group transition-all duration-300 flex flex-col h-full min-h-[500px] ${
        isOver ? "bg-secondary/10 border-primary/30 ring-4 ring-primary/5" : "hover:border-primary/10"
      }`}
    >
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-background border border-border shadow-sm transition-transform group-hover:scale-105`}>
              <theme.icon className={`h-4 w-4 ${theme.color} opacity-70`} />
            </div>
            <div className="flex flex-col">
                <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                    {category}
                </h2>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 leading-none mt-1">
                    {theme.label}
                </span>
            </div>
          </div>
          <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-mono font-bold bg-background border-border text-muted-foreground opacity-60">
             {tasks.length.toString().padStart(2, '0')}
          </Badge>
        </div>
      </CardHeader>

      <div className="px-6 py-4">
        <Separator className="bg-border/30" />
      </div>

      <CardContent
        ref={setNodeRef}
        className={`flex-1 p-4 pt-0 transition-colors rounded-b-3xl ${
          isOver ? "bg-primary/[0.02]" : "bg-transparent"
        }`}
      >
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex h-[300px] flex-col items-center justify-center gap-4 opacity-10 group"
            >
              <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-muted-foreground flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Empty Matrix</p>
            </motion.div>
          ) : (
            <SortableContext
              items={tasks.map(task => task._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <Task
                    key={task._id}
                    task={task}
                    index={index}
                    onTaskUpdate={onTaskUpdate}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default TaskList;
