"use client"
 
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Task from "./Task";
import { ClipboardList } from "lucide-react";

function TaskList({ category, tasks, onTaskUpdate }) {
  const { setNodeRef, isOver } = useDroppable({
    id: category,
    data: {
      type: "TaskList",
      category,
    },
  });

  // Function to get background color and border based on category
  const getCategoryStyles = (category) => {
    switch (category) {
      case "To-Do":
        return "bg-red-50 border-red-200";
      case "In Progress":
        return "bg-yellow-50 border-yellow-200";
      case "Done":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  // Function to get header color based on category
  const getHeaderColor = (category) => {
    switch (category) {
      case "To-Do":
        return "text-red-700";
      case "In Progress":
        return "text-yellow-700";
      case "Done":
        return "text-green-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div 
      className={`rounded-lg border ${getCategoryStyles(category)} p-4 shadow-sm transition-all ${
        isOver ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className={`h-5 w-5 ${getHeaderColor(category)}`} />
          <h2 className={`font-semibold ${getHeaderColor(category)}`}>
            {category}
            <span className="ml-2 rounded-full bg-white px-2 py-1 text-sm">
              {tasks.length}
            </span>
          </h2>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[200px] rounded-md transition-colors ${
          isOver ? "bg-white/50" : "bg-white/30"
        }`}
      >
        <SortableContext
          items={tasks.map(task => task._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-gray-500">
              No tasks in this category
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <Task
                  key={task._id}
                  task={task}
                  index={index}
                  onTaskUpdate={onTaskUpdate}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default TaskList;