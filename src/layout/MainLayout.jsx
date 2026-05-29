import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import PlannerSidebar from "../components/planner/PlannerSidebar";

const MainLayout = () => {
    return ( 
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 transition-colors duration-300 relative" >
            <Navbar/>
            <main className="relative z-10 pt-20">
                <Outlet/>
            </main>
            <PlannerSidebar />
        </div>
    );
};

export default MainLayout;