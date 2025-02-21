"use client"

import { useState, useEffect, useContext } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import io from "socket.io-client";
import { AuthContext } from "../provider/AuthProvider";
import AddTaskForm from "../components/AddTaskForm";
import TaskList from "../components/TaskList";
import { AlertCircle } from "lucide-react";

function MainPage() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState({
    "To-Do": [],
    "In Progress": [],
    Done: [],
  });
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socketError, setSocketError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Configure DND sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Socket initialization
  useEffect(() => {
    let newSocket = null;

    if (user) {
      newSocket = io("http://localhost:5000", {
        reconnectionAttempts: 3,
        timeout: 10000,
        auth: {
          userId: user.uid
        }
      });

      // Socket event handlers
      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setSocketError("Unable to connect to server. Some features may be unavailable.");
      });

      newSocket.on("connect", () => {
        setSocketError(null);
        console.log("Socket connected successfully");
        newSocket.emit('join', { userId: user.uid });
      });

      newSocket.on("taskChange", handleTaskChange);
      newSocket.on("disconnect", () => {
        setSocketError("Connection lost. Attempting to reconnect...");
      });

      setSocket(newSocket);
      fetchTasks();
    }

    return () => {
      if (newSocket) {
        newSocket.off("taskChange");
        newSocket.off("connect_error");
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.close();
      }
    };
  }, [user]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/tasks/${user.uid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const categorizedTasks = {
        "To-Do": data.filter((task) => task.category === "To-Do"),
        "In Progress": data.filter((task) => task.category === "In Progress"),
        Done: data.filter((task) => task.category === "Done"),
      };
      setTasks(categorizedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setSocketError("Error loading tasks. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskChange = (change) => {
    if (change.type === "create" || change.type === "update") {
      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };
        const task = change.task;
        newTasks[task.category] = [
          ...newTasks[task.category].filter((t) => t._id !== task._id),
          task,
        ].sort((a, b) => a.order - b.order);
        return newTasks;
      });
    } else if (change.type === "delete") {
      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };
        Object.keys(newTasks).forEach((category) => {
          newTasks[category] = newTasks[category].filter(
            (task) => task._id !== change.taskId
          );
        });
        return newTasks;
      });
    } else if (change.type === "reorder") {
      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };
        change.tasks.forEach((task) => {
          const category = task.category;
          newTasks[category] = newTasks[category].filter(
            (t) => t._id !== task._id
          );
          newTasks[category].push(task);
        });
        Object.keys(newTasks).forEach((category) => {
          newTasks[category].sort((a, b) => a.order - b.order);
        });
        return newTasks;
      });
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) return;
  
    const activeTask = findTaskById(active.id);
    const overTask = findTaskById(over.id);
  
    if (!activeTask || !overTask) return;
  
    const sourceCategory = activeTask.category;
    const destCategory = overTask.category;
  
    const newTasks = { ...tasks };
    
    // Remove from source
    newTasks[sourceCategory] = newTasks[sourceCategory].filter(
      task => task._id !== activeTask._id
    );
  
    // Add to destination
    const updatedTask = { ...activeTask, category: destCategory };
    const insertIndex = newTasks[destCategory].findIndex(
      task => task._id === overTask._id
    );
    
    newTasks[destCategory].splice(insertIndex, 0, updatedTask);
  
    // Create array of all tasks that need updating with their new orders
    const tasksToUpdate = [];
    
    // Update both source and destination categories
    [sourceCategory, destCategory].forEach(category => {
      newTasks[category].forEach((task, index) => {
        tasksToUpdate.push({
          _id: task._id,
          category: task.category,
          order: index
        });
      });
    });
  
    // Update local state
    setTasks(newTasks);
    setActiveId(null);
  
    try {
      if (socket && socket.connected) {
        socket.emit('taskReorder', { 
          userId: user.uid,
          tasks: tasksToUpdate 
        });
      } else {
        const response = await fetch(`http://localhost:5000/tasks/reorder/${user.uid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: tasksToUpdate }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const result = await response.json();
        if (!result.success) {
          throw new Error('Server failed to update task order');
        }
      }
    } catch (error) {
      console.error("Error updating task order:", error);
      fetchTasks(); // Revert to previous state on error
      setSocketError("Failed to save task order. Please try again.");
    }
  };

  const findTaskById = (taskId) => {
    for (const category in tasks) {
      const task = tasks[category].find(t => t._id === taskId);
      if (task) return task;
    }
    return null;
  };

  const addTask = async (newTask) => {
    try {
      if (socket && socket.connected) {
        socket.emit('taskCreate', {
          ...newTask,
          userId: user.uid
        });
      } else {
        const response = await fetch("http://localhost:5000/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newTask, userId: user.uid }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTasks((prevTasks) => ({
          ...prevTasks,
          [data.category]: [...prevTasks[data.category], data],
        }));
      }
    } catch (error) {
      console.error("Error adding task:", error);
      setSocketError("Error adding task. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-gray-50 p-8 text-center shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">Welcome to Task Manager</h2>
          <p className="text-gray-600">Please log in to access your tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <main className="mx-auto max-w-7xl">
        {socketError && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-100 border border-red-400 px-4 py-3 text-red-700" role="alert">
            <AlertCircle className="h-5 w-5" />
            <span className="block sm:inline">{socketError}</span>
          </div>
        )}
        
        <div className="mb-8">
          <AddTaskForm onAddTask={addTask} />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-lg text-gray-600">Loading tasks...</div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
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
                    socket={socket}
                  />
                </SortableContext>
              ))}
            </div>
            <DragOverlay>
              {activeId ? (
                <div className="bg-white p-4 rounded shadow-lg border border-gray-200">
                  {findTaskById(activeId)?.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
}

export default MainPage;