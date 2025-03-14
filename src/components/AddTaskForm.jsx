import { useState } from "react"
import { Plus, ListTodo } from "lucide-react"

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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900 p-2">
            <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onClick={() => setIsExpanded(true)}
            placeholder="Add a new task..."
            maxLength={50}
            required
            className="flex-1 border-none bg-transparent text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:outline-none focus:ring-0"
          />
        </div>

        {isExpanded && (
          <div className="space-y-4 pt-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              maxLength={200}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <div className="flex items-center gap-4">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="To-Do">To-Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default AddTaskForm
