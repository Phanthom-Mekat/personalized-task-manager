import React, { useState } from "react"
import { Plus, ListTodo, ChevronDown, ChevronUp, Sparkles, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function AddTaskForm({ onAddTask }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("To-Do")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (title.trim()) {
      onAddTask({ title, description, category })
      setTitle("")
      setDescription("")
      setCategory("To-Do")
      setIsExpanded(false)
    }
  }

  return (
    <Card className="rounded-3xl border-border bg-card shadow-sm shadow-black/5 overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="divide-y divide-border/50">
          {/* Primary Input Area */}
          <div className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-primary opacity-50 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onClick={() => setIsExpanded(true)}
              placeholder="Inject new task data..."
              maxLength={50}
              required
              className="flex-1 bg-transparent border-none text-lg font-black text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-0 uppercase tracking-tighter"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-xl text-muted-foreground transition-transform duration-300"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <ChevronDown className="h-5 w-5 opacity-40" />
            </Button>
          </div>

          {/* Expanded Configuration Buffer */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-6 bg-secondary/5">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Operational Context</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add high-fidelity description..."
                      maxLength={200}
                      rows={3}
                      className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/20 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none scrollbar-hide"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mr-2">Status Vector</span>
                        <Select value={category} onValueChange={(val) => setCategory(val)}>
                            <SelectTrigger className="w-full sm:w-[160px] rounded-xl bg-background border-border text-[10px] font-black uppercase tracking-widest h-9">
                                <SelectValue placeholder="To-Do" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                                <SelectItem value="To-Do" className="text-[10px] font-black uppercase tracking-widest">TO-DO</SelectItem>
                                <SelectItem value="In Progress" className="text-[10px] font-black uppercase tracking-widest">IN-PROGRESS</SelectItem>
                                <SelectItem value="Done" className="text-[10px] font-black uppercase tracking-widest">DONE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsExpanded(false)}
                        className="flex-1 sm:flex-none h-10 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 sm:flex-none h-10 rounded-xl px-8 flex items-center gap-2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:bg-primary/90"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Initialize Task
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </CardContent>
    </Card>
  )
}

export default AddTaskForm;
