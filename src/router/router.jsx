import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import AuthLayout from "../layout/AuthLayout";
import Login from "../components/log/Login";
import Register from "../components/log/Register";
import MainPage from "../pages/MainPage";
import PlannerLayout from "../pages/Planner/PlannerLayout";
import DailyPlanner from "../pages/Planner/DailyPlanner";
import GrowthTracker from "../pages/Planner/GrowthTracker";
import WeeklyPlanner from "../pages/Planner/WeeklyPlanner";
import MonthlyPlanner from "../pages/Planner/MonthlyPlanner";
import YearlyPlanner from "../pages/Planner/YearlyPlanner";
import BudgetPlanner from "../pages/Planner/BudgetPlanner";
import Notebook from "../pages/Planner/Notebook";
import PlannerCalendar from "../pages/Planner/PlannerCalendar";
import RoadmapPlanner from "../pages/Planner/RoadmapPlanner";
import LibraryIndex from "../pages/Planner/Library";
import CompanionVault from "../pages/Planner/CompanionVault";
import ProtectedRoute from "../components/ProtectedRoute";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout/>,
        children: [
            {
                path: "/",
                element: <MainPage />,
            },
        ],
    },
    {
        path: "planner",
        element: <ProtectedRoute><PlannerLayout /></ProtectedRoute>,
        children: [
            { index: true, element: <Navigate to="daily" replace /> },
            { path: "daily", element: <DailyPlanner /> },
            { path: "growth", element: <GrowthTracker /> },
            { path: "weekly", element: <WeeklyPlanner /> },
            { path: "monthly", element: <MonthlyPlanner /> },
            { path: "yearly", element: <YearlyPlanner /> },
            { path: "budget", element: <BudgetPlanner /> },
            { path: "notebook", element: <Notebook /> },
            { path: "roadmaps", element: <RoadmapPlanner /> },
            { path: "roadmaps/:routeId", element: <RoadmapPlanner /> },
            { path: "library", element: <LibraryIndex /> },
            { path: "calendar", element: <PlannerCalendar /> },
            { path: "companion", element: <CompanionVault /> },
        ],
    },
    {
        path: 'auth',
        element: <AuthLayout />,
        children: [
            {
                path: 'login',
                element: <Login/>
            },
            {
                path: 'register',
                element: <Register/>
            }
        ]
    }
]);

export default router;
