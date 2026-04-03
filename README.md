# Personalized Task Manager 🚀

A modern, intuitive, and highly interactive task management application designed to streamline your daily workflow. Organize, prioritize, and track your tasks with ease using our seamless drag-and-drop interface.

## 🔗 Live Links
- **Client Application:** [Live URL](https://personalized-taskmanager.netlify.app/)


---

## ✨ Key Features

- **🔐 Secure Authentication:** Seamlessly sign in with Google or create a dedicated account via Firebase Authentication.
- **📑 Smart Categorization:** Organize tasks into three distinct stages: **To-Do**, **In Progress**, and **Done**.
- **🖱️ Drag & Drop Interface:** Effortlessly reorder tasks within a category or move them across different stages using a smooth, interactive interface powered by `@dnd-kit`.
- **🔄 Real-time Persistence:** Every change—whether it's adding, updating, deleting, or reordering—is instantly saved to a MongoDB database.
- **📝 Task Details:** Add titles (up to 50 characters) and detailed descriptions (up to 200 characters) to keep your work well-documented.
- **📱 Responsive & Modern UI:** A fully responsive design that looks stunning on desktops, tablets, and mobile devices, featuring **Dark Mode** support and optimized user experience.
- **🔔 Interactive Feedback:** Instant notifications for every action using `react-hot-toast` and beautiful modal confirmations with `sweetalert`.

---

## 🛠️ Technologies Used

### Frontend
- **React.js (Vite)** - Modern UI development
- **Tailwind CSS & DaisyUI** - Sleek, responsive styling
- **@dnd-kit** - Powerful drag-and-drop functionality
- **Firebase Auth** - Secure user authentication
- **Lucide React** - High-quality iconography
- **Axios** - Efficient API communication

### Backend
- **Node.js & Express** - Scalable server architecture
- **MongoDB** - Robust NoSQL database for persistent storage
- **Socket.io** - Prepared for real-time collaborative features
- **Vercel** - High-performance backend hosting

---

## 🚀 Getting Started

Follow these steps to get the project running locally:

### 1. Clone the repository
```bash
git clone https://github.com/Phanthom-Mekat/personalized-task-manager.git
cd personalized-task-manager
```

### 2. Install dependencies
**Frontend:**
```bash
cd personalized-task-manager
npm install
```

**Backend:**
```bash
cd personalized-task-manager-server
npm install
```

### 3. Environment Variables
Create a `.env` file in both directories and add the necessary credentials (MongoDB URI, Firebase Config, etc.).

### 4. Run the application
**Start Backend:**
```bash
# Inside personalized-task-manager-server
npm run dev
```

**Start Frontend:**
```bash
# Inside personalized-task-manager
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 📸 Screenshots
*(Add your app screenshots here to showcase the UI)*

---

## 📄 License
This project is licensed under the MIT License.

