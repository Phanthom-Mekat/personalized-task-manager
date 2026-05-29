"use client"
import dayjs from "dayjs"

import apiClient from "../lib/apiClient"
import { useState, useEffect, useContext } from "react"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { AuthContext } from "../provider/AuthProvider"
import AddTaskForm from "../components/AddTaskForm"
import TaskList from "../components/TaskList"
import { 
    AlertCircle, Layers, Shield, 
    Activity, Target, Sparkles, 
    ChevronRight, Zap 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function MainPage() {
  const { user } = useContext(AuthContext)
  const [tasks, setTasks] = useState({
    "To-Do": [],
    "In Progress": [],
    Done: [],
  })
  const [activeId, setActiveId] = useState(null)
  const [activeCategory, setActiveCategory] = useState("To-Do")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => {
    if (user) fetchTasks()
  }, [user])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get(`/tasks/${user.uid}`)
      const categorizedTasks = {
        "To-Do": data.filter((task) => task.category === "To-Do").sort((a, b) => a.order - b.order),
        "In Progress": data.filter((task) => task.category === "In Progress").sort((a, b) => a.order - b.order),
        Done: data.filter((task) => task.category === "Done").sort((a, b) => a.order - b.order),
      }
      setTasks(categorizedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Archive retrieval failed. Please re-sync.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskChange = (change) => {
    if (change.type === "create" || change.type === "update") {
      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks }
        const task = change.task
        
        // Remove task from all categories first to handle transitions correctly
        Object.keys(newTasks).forEach((category) => {
          newTasks[category] = newTasks[category].filter((t) => t._id !== task._id)
        })

        // Insert task into its updated category
        newTasks[task.category] = [
          ...newTasks[task.category],
          task,
        ].sort((a, b) => a.order - b.order)
        
        return newTasks
      })
    } else if (change.type === "delete") {
      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks }
        Object.keys(newTasks).forEach((category) => {
          newTasks[category] = newTasks[category].filter(
            (task) => task._id !== change.taskId
          )
        })
        return newTasks
      })
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!active || !over) return
    const activeTask = findTaskById(active.id)
    if (!activeTask) return

    const sourceCategory = activeTask.category
    const overTask = findTaskById(over.id)
    const destCategory = overTask ? overTask.category : over.id

    if (activeTask._id === over.id && sourceCategory === destCategory) return

    const originalTasks = JSON.parse(JSON.stringify(tasks))

    try {
      const newTasks = { ...tasks }
      newTasks[sourceCategory] = newTasks[sourceCategory].filter(
        task => task._id !== activeTask._id
      )

      const updatedTask = { ...activeTask, category: destCategory }
      if (!newTasks[destCategory]) newTasks[destCategory] = []

      if (overTask) {
        const overIndex = newTasks[destCategory].findIndex(task => task._id === overTask._id)
        if (sourceCategory === destCategory) {
          const activeIndex = tasks[sourceCategory].findIndex(task => task._id === activeTask._id)
          const insertIndex = overIndex > activeIndex ? overIndex : overIndex + 1
          newTasks[destCategory].splice(insertIndex, 0, updatedTask)
        } else {
          newTasks[destCategory].splice(overIndex + 1, 0, updatedTask)
        }
      } else {
        newTasks[destCategory].push(updatedTask)
      }

      const tasksToUpdate = []
      const categoriesToUpdate = new Set([sourceCategory, destCategory])
      
      categoriesToUpdate.forEach(category => {
        if (newTasks[category]) {
          newTasks[category].forEach((task, index) => {
            tasksToUpdate.push({ _id: task._id, category: task.category, order: index })
          })
        }
      })

      setTasks(newTasks)
      setActiveId(null)

      await apiClient.put(`/tasks/reorder/${user.uid}`, { tasks: tasksToUpdate })
    } catch (error) {
      console.error("Error updating task order:", error)
      setTasks(originalTasks)
      setError("Relocation failed. Restoring previous state.")
      setTimeout(() => setError(null), 5000)
    }
  }

  const findTaskById = (taskId) => {
    for (const category in tasks) {
      const task = tasks[category].find(t => t._id === taskId)
      if (task) return task
    }
    return null
  }

  const addTask = async (newTask) => {
    try {
      const data = await apiClient.post(`/tasks`, { ...newTask, userId: user.uid, category: newTask.category || 'To-Do' })
      handleTaskChange({ type: 'create', task: data })
    } catch (error) {
      console.error("Error adding task:", error)
      setError(`Buffer injection failed: ${error.message}`)
      setTimeout(() => setError(null), 5000)
    }
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-background">
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
        >
            <Card className="bg-secondary/5 border-dashed border-border p-12 text-center group hover:border-primary/20 transition-all">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-secondary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Shield className="w-10 h-10 opacity-40" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">Initialize Protocol</h2>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-40">Access Denied // Authentication Required</p>
                    </div>
                </div>
            </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[calc(100vh-80px)] bg-background text-foreground selection:bg-primary/10"
    >
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 sm:pb-8 gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary">Buffer v.3.1</Badge>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-black tracking-wide sm:tracking-widest opacity-30">Active Interval // {dayjs().format('DD.MM.YYYY')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase leading-none">Task Buffer</h1>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                Operational Vector Processing Hub
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-right opacity-30 group">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Stability</span>
                <span className="text-xl font-mono font-bold text-emerald-500">OPTIMAL</span>
             </div>
             <Separator orientation="vertical" className="h-10" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Throughput</span>
                <span className="text-xl font-mono font-bold text-foreground">98.2%</span>
             </div>
          </div>
        </header>

        {/* Compact Industrial Metrics for Mobile/Tablet */}
        <div className="lg:hidden flex items-center justify-start gap-6 px-5 py-4 bg-secondary/5 rounded-2xl border border-border/40 text-left opacity-60">
           <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1.5 text-muted-foreground">Stability Vector</span>
              <span className="text-xs font-mono font-black text-emerald-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                OPTIMAL
              </span>
           </div>
           <Separator orientation="vertical" className="h-8 bg-border/40" />
           <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1.5 text-muted-foreground">Throughput</span>
              <span className="text-xs font-mono font-black text-foreground">98.2%</span>
           </div>
        </div>

        <AnimatePresence>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <Alert variant="destructive" className="border-rose-500/50 bg-rose-500/5 rounded-2xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-[10px] font-black uppercase tracking-widest">System Anomaly</AlertTitle>
                        <AlertDescription className="text-xs font-bold font-mono">{error}</AlertDescription>
                    </Alert>
                </motion.div>
            )}
        </AnimatePresence>

        <section className="relative">
            <div className="absolute -top-4 -left-4 opacity-[0.03] pointer-events-none">
                <Sparkles className="w-32 h-32" />
            </div>
            <AddTaskForm onAddTask={addTask} />
        </section>

        {/* Sliding Segmented Tab Control for Mobile */}
        {!isLoading && (
          <div className="md:hidden p-1.5 bg-secondary/15 backdrop-blur-md rounded-2xl border border-border/40 max-w-lg mx-auto flex relative">
            {Object.keys(tasks).map((cat) => {
              const isActive = cat === activeCategory;
              const count = tasks[cat]?.length || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="relative flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-200 z-10 flex items-center justify-center gap-1.5 select-none"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/10 -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`transition-colors duration-200 ${isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {cat}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`h-4 px-1 rounded text-[8px] font-mono font-bold transition-all duration-200 ${
                      isActive 
                        ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" 
                        : "bg-secondary/50 border-border/50 text-muted-foreground opacity-60"
                    }`}
                  >
                    {count.toString().padStart(2, '0')}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-secondary/10 border border-border/20 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(event) => setActiveId(event.active.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(tasks).map(([category, categoryTasks]) => {
                const isVisibleOnMobile = category === activeCategory;
                return (
                  <div 
                    key={category} 
                    className={`${isVisibleOnMobile ? "block" : "hidden md:block"} h-full`}
                  >
                    <SortableContext
                      items={categoryTasks.map(task => task._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <TaskList
                        category={category}
                        tasks={categoryTasks}
                        onTaskUpdate={handleTaskChange}
                      />
                    </SortableContext>
                  </div>
                );
              })}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeId ? (
                <div className="bg-background border-2 border-primary p-6 rounded-2xl shadow-2xl scale-105 transition-transform rotate-2 ring-1 ring-primary/20 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="text-sm font-black uppercase tracking-tight truncate pr-4">
                        {findTaskById(activeId)?.title}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </motion.div>
  )
}

export default MainPage;
