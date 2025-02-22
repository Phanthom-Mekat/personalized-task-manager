"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Pencil, Trash2, Save, Grip, X } from "lucide-react"
import swal from "sweetalert"
import toast from "react-hot-toast"

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
  }
  
  const handleEdit = async () => {
    if (isEditing && (editedTitle !== task.title || editedDescription !== task.description)) {
      setIsUpdating(true)
      try {
        const response = await fetch(`http://localhost:5000/tasks/${task._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ 
            title: editedTitle, 
            description: editedDescription,
            category: task.category,
            order: task.order
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update task')
        }

        const updatedTask = await response.json()
        onTaskUpdate({ type: "update", task: updatedTask })
        toast.success("Task updated successfully!")
        setIsEditing(false)
      } catch (error) {
        console.error("Error updating task:", error)
        toast.error("Failed to update task!")
        // Revert to original values
        setEditedTitle(task.title)
        setEditedDescription(task.description)
      } finally {
        setIsUpdating(false)
      }
    } else {
      setIsEditing(!isEditing)
    }
  }

  const handleDelete = async () => {
    swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this task!",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const response = await fetch(`http://localhost:5000/tasks/${task._id}`, { 
            method: "DELETE",
            credentials: 'include'
          })

          if (!response.ok) {
            throw new Error('Failed to delete task')
          }

          onTaskUpdate({ type: "delete", taskId: task._id })
          swal("Task has been deleted!", { icon: "success" })
        } catch (error) {
          console.error("Error deleting task:", error)
          swal("Failed to delete task!", { icon: "error" })
        }
      }
    })
  }

  const handleCancel = () => {
    setEditedTitle(task.title)
    setEditedDescription(task.description)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group mb-2 rounded-lg border bg-white p-4 shadow-sm transition-all ${
        isDragging ? "rotate-2 shadow-lg opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...listeners}
          className="mt-1 cursor-grab text-gray-400 hover:text-gray-600"
        >
          <Grip className="h-4 w-4" />
        </div>

        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                maxLength={50}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Task title"
                disabled={isUpdating}
              />
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                maxLength={200}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Task description"
                rows={3}
                disabled={isUpdating}
              />
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-gray-900">{task.title}</h3>
              {task.description && (
                <p className="mt-1 text-sm text-gray-500">{task.description}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="rounded-full p-1 text-green-600 hover:bg-green-50"
                title="Save"
                disabled={isUpdating}
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                className="rounded-full p-1 text-gray-600 hover:bg-gray-50"
                title="Cancel"
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="rounded-full p-1 text-blue-600 hover:bg-blue-50"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="rounded-full p-1 text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Task