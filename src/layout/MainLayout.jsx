import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";


const MainLayout = () => {
    return ( 
        <div className="dark:bg-gray-900 " >
            <Navbar/>
            <Outlet/>
        </div>
    );
};

export default MainLayout;