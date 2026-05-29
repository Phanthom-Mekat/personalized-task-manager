"use client"
import dayjs from "dayjs"

import React, { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
    Pencil, Trash2, Save, 
    GripVertical, X, Check, 
    MoreVertical, Zap, Layers, 
    Activity, Target, ArrowLeft, ArrowRight
} from "lucide-react"
import swal from "sweetalert"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

import apiClient from "../lib/apiClient"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator";

function Task({ task, index, onTaskUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedDescription, setEditedDescription] = useState(task.description)
  const [isUpdating, setIsUpdating] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: "Task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  }
  
  const handleEdit = async () => {
    if (isEditing && (editedTitle !== task.title || editedDescription !== task.description)) {
      setIsUpdating(true)
      try {
        const updatedTask = await apiClient.put(`/tasks/${task._id}`, { 
          title: editedTitle, 
          description: editedDescription,
          category: task.category,
          order: task.order
        })

        onTaskUpdate({ type: "update", task: updatedTask })
        toast.success("Buffer Updated")
        setIsEditing(false)
      } catch (error) {
        toast.error("Process Failed")
        setEditedTitle(task.title)
        setEditedDescription(task.description)
      } finally {
        setIsUpdating(false)
      }
    } else if (isEditing) {
        setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  const handleDelete = async () => {
    swal({
      title: "Terminate Task?",
      text: "Permanent de-allocation of this record. Proceed?",
      icon: "warning",
      buttons: ["No", "YES"],
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await apiClient.delete(`/tasks/${task._id}`)
          onTaskUpdate({ type: "delete", taskId: task._id })
          toast.success("Buffer Purged")
        } catch (error) {
          toast.error("Operation Denied")
        }
      }
    })
  }

  const handleCancel = () => {
    setEditedTitle(task.title)
    setEditedDescription(task.description)
    setIsEditing(false)
  }

  const handleShiftStatus = async (newCategory) => {
    setIsUpdating(true)
    const toastId = toast.loading("Transitioning task vector...")
    try {
      const updatedTask = await apiClient.put(`/tasks/${task._id}`, { 
        title: task.title, 
        description: task.description,
        category: newCategory,
        order: 0
      })

      onTaskUpdate({ type: "update", task: updatedTask })
      toast.success(`Vector transitioned to ${newCategory}`, { id: toastId })
    } catch (error) {
      toast.error("Transition failed", { id: toastId })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      layout
      className={`group relative rounded-2xl border border-border bg-card p-4 transition-all shadow-sm hover:shadow-md hover:border-primary/20 ${
        isDragging ? "rotate-2 opacity-50 shadow-2xl scale-105 z-50 ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Main Content Area */}
        <div className="flex items-start gap-3">
          {/* Grip Area */}
          <div
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground opacity-20 hover:opacity-100 transition-opacity shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {isEditing ? (
              <div className="space-y-4">
                 <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30">Descriptor</span>
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      maxLength={50}
                      disabled={isUpdating}
                      className="h-9 mt-1 rounded-xl bg-secondary/50 border-border text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/5"
                    />
                 </div>
                 <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30">Contextual Node</span>
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      maxLength={200}
                      rows={3}
                      disabled={isUpdating}
                      className="mt-1 rounded-xl bg-secondary/50 border-border text-xs font-bold text-foreground placeholder:text-muted-foreground/20 focus:ring-4 focus:ring-primary/5 resize-none"
                    />
                 </div>
                 <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="h-8 rounded-lg px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary/50"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      disabled={isUpdating}
                      className="h-8 rounded-lg px-6 text-[9px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isUpdating ? "Syncing..." : "Update Buffer"}
                    </Button>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 font-sans">
                 <h3 className="text-xs font-black uppercase tracking-tight text-foreground break-words leading-tight">
                   {task.title}
                 </h3>
                {task.description && (
                  <p className="text-[11px] font-bold text-muted-foreground/60 leading-normal font-mono break-words">
                    {task.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Area: Actions & Badges */}
        {!isEditing && (
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            {/* Status Indicator Badge */}
            <div className="flex items-center gap-1.5 opacity-60">
              <Badge variant="outline" className="px-1.5 h-4.5 text-[7px] font-black border-border/50 bg-secondary/35 text-muted-foreground tracking-widest">
                {task.category.toUpperCase()}
              </Badge>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {/* Mobile/Touch Status Quick Shifters */}
                <div className="flex items-center gap-1 border-r border-border/30 pr-1.5 mr-0.5">
                    {task.category === "To-Do" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isUpdating}
                            onClick={() => handleShiftStatus("In Progress")}
                            className="h-7 w-7 rounded-lg text-primary hover:text-primary-foreground hover:bg-primary/20 bg-primary/5 border border-primary/10 shrink-0"
                            title="Start Task"
                        >
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    )}
                    {task.category === "In Progress" && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={isUpdating}
                                onClick={() => handleShiftStatus("To-Do")}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 shrink-0"
                                title="Move Back to To-Do"
                            >
                                <ArrowLeft className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={isUpdating}
                                onClick={() => handleShiftStatus("Done")}
                                className="h-7 w-7 rounded-lg text-emerald-500 hover:text-emerald-foreground hover:bg-emerald-500/20 bg-emerald-500/5 border border-emerald-500/10 shrink-0"
                                title="Complete Task"
                            >
                                <Check className="h-3 w-3 font-bold" />
                            </Button>
                        </>
                    )}
                    {task.category === "Done" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isUpdating}
                            onClick={() => handleShiftStatus("In Progress")}
                            className="h-7 w-7 rounded-lg text-amber-500 hover:text-amber-foreground hover:bg-amber-500/20 bg-amber-500/5 border border-amber-500/10 shrink-0"
                            title="Re-open Task"
                        >
                            <ArrowLeft className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    disabled={isUpdating}
                    onClick={() => setIsEditing(true)}
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 shrink-0"
                    title="Edit Task"
                >
                    <Pencil className="h-3 w-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={isUpdating}
                    onClick={handleDelete}
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 shrink-0"
                    title="Delete Task"
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Task;
