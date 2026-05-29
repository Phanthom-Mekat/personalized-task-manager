import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const MainLayout = () => {
    return ( 
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 transition-colors duration-300" >
            <Navbar/>
            <main className="relative z-10 pt-20">
                <Outlet/>
            </main>
        </div>
    );
};

export default MainLayout;