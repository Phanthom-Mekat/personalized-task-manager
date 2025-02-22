"use client"

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
import { AlertCircle } from "lucide-react"

function MainPage() {
  const { user } = useContext(AuthContext)
  const [tasks, setTasks] = useState({
    "To-Do": [],
    "In Progress": [],
    Done: [],
  })
  const [activeId, setActiveId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Configure DND sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`https://personalized-task-manager-server.onrender.com/tasks/${user.uid}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const categorizedTasks = {
        "To-Do": data.filter((task) => task.category === "To-Do"),
        "In Progress": data.filter((task) => task.category === "In Progress"),
        Done: data.filter((task) => task.category === "Done"),
      }
      setTasks(categorizedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Error loading tasks. Please refresh the page.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskChange = (change) => {
    if (change.type === "create" || change.type === "update") {
      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks }
        const task = change.task
        newTasks[task.category] = [
          ...newTasks[task.category].filter((t) => t._id !== task._id),
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

    // If no change in position or category, exit early
    if (activeTask._id === over.id && sourceCategory === destCategory) return

    // Store original tasks state for rollback
    const originalTasks = JSON.parse(JSON.stringify(tasks))

    try {
      const newTasks = { ...tasks }

      // Remove from source
      newTasks[sourceCategory] = newTasks[sourceCategory].filter(
        task => task._id !== activeTask._id
      )

      const updatedTask = { ...activeTask, category: destCategory }

      // Initialize destination category if it doesn't exist
      if (!newTasks[destCategory]) {
        newTasks[destCategory] = []
      }

      if (overTask) {
        // Get the destination index
        const overIndex = newTasks[destCategory].findIndex(
          task => task._id === overTask._id
        )

        if (sourceCategory === destCategory) {
          const activeIndex = tasks[sourceCategory].findIndex(
            task => task._id === activeTask._id
          )
          // Correct insertion index calculation for both up and down movements
          const insertIndex = overIndex > activeIndex ? overIndex : overIndex + 1
          newTasks[destCategory].splice(insertIndex, 0, updatedTask)
        } else {
          // For cross-category moves, insert at the target position
          newTasks[destCategory].splice(overIndex + 1, 0, updatedTask)
        }
      } else {
        // If dropping onto an empty category or at the end
        newTasks[destCategory].push(updatedTask)
      }

      // Update orders for affected categories
      const tasksToUpdate = []
      const categoriesToUpdate = new Set([sourceCategory, destCategory])
      
      categoriesToUpdate.forEach(category => {
        if (newTasks[category]) {
          newTasks[category].forEach((task, index) => {
            tasksToUpdate.push({
              _id: task._id,
              category: task.category,
              order: index
            })
          })
        }
      })

      // Optimistically update UI
      setTasks(newTasks)
      setActiveId(null)

      // Save to server
      const response = await fetch(`https://personalized-task-manager-server.onrender.com/tasks/reorder/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: tasksToUpdate }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save task order')
      }
    } catch (error) {
      console.error("Error updating task order:", error)
      setTasks(originalTasks)
      setError("Failed to save task order. Please try again.")
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
      const response = await fetch("https://personalized-task-manager-server.onrender.com/tasks", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ 
          ...newTask, 
          userId: user.uid,
          category: newTask.category || 'To-Do'
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }
      
      handleTaskChange({ type: 'create', task: data })
    } catch (error) {
      console.error("Error adding task:", error)
      setError(`Failed to add task: ${error.message}`)
      setTimeout(() => setError(null), 5000)
    }
  }



  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-8 text-center shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">
            Welcome to Task Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access your tasks.
          </p>
        </div>
      </div>
    )
  }

  return (
    // Apply the dark class based on state
    <div className={` min-h-screen bg-gray-50 dark:bg-gray-900 p-6`}>
      <main className="mx-auto max-w-7xl">
        {/* Header with Dark Mode Toggle */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Task Manager</h1>
          
        </header>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-600 px-4 py-3 text-red-700 dark:text-red-200" role="alert">
            <AlertCircle className="h-5 w-5" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}
                
        <div className="mb-8">
          <AddTaskForm onAddTask={addTask} />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-lg text-gray-600 dark:text-gray-300">Loading tasks...</div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(event) => setActiveId(event.active.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(tasks).map(([category, categoryTasks]) => (
                <SortableContext
                  key={category}
                  items={categoryTasks.map(task => task._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <TaskList
                    category={category}
                    tasks={categoryTasks}
                    onTaskUpdate={handleTaskChange}
                  />
                </SortableContext>
              ))}
            </div>
            <DragOverlay>
              {activeId ? (
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                  {findTaskById(activeId)?.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  )
}

export default MainPage
