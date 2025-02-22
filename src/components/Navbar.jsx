import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ThemeContext } from '../provider/ThemeProvider';
import { AuthContext } from '../provider/AuthProvider';

const Navbar = () => {
    const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
    const { user, logOut } = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logOut()
            .then(() => {
                navigate('/');
            })
            .catch(err => console.log(err));
    };

    const activeClassName =
        "text-blue-600 font-semibold border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400 transition-all duration-300";
    const inactiveClassName =
        "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300";

    const navLinks = (
        <>
            <li>
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `px-3 py-2 ${isActive ? activeClassName : inactiveClassName}`
                    }
                >
                    Home
                </NavLink>
            </li>
            
        </>
    );

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-600 text-transparent bg-clip-text">
                                Task Manager
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        <ul className="flex space-x-4">{navLinks}</ul>
                    </div>

                    {/* Theme Toggle and Profile/Logout */}
                    <div className="flex items-center space-x-4">
                        <label className="swap swap-rotate">
                            <input
                                type="checkbox"
                                onChange={toggleDarkMode}
                                checked={isDarkMode}
                                className="theme-controller"
                            />
                            <svg
                                className="swap-on fill-current w-6 h-6 text-gray-600 dark:text-gray-300"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                            </svg>
                            <svg
                                className="swap-off fill-current w-6 h-6 text-gray-600 dark:text-gray-300"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                            </svg>
                        </label>
                        {user ? (
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-10 h-10 rounded-full ring-2 ring-blue-600 dark:ring-blue-400 overflow-hidden">
                                        <img
                                            src={user?.photoURL || "/api/placeholder/40/40"}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="hidden md:block text-gray-700 dark:text-gray-300">
                                        {user?.displayName}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-300"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/auth/login"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-300"
                            >
                                Sign In
                            </Link>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400"
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4">
                        <ul className="flex flex-col space-y-2">{navLinks}</ul>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
