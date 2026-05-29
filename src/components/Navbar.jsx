import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Rocket, LayoutGrid, LogOut, Settings, User as UserIcon, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../provider/ThemeProvider';
import { AuthContext } from '../provider/AuthProvider';

import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

    const activeClassName = "text-foreground font-black border-b-2 border-primary transition-all duration-300";
    const inactiveClassName = "text-muted-foreground font-bold hover:text-foreground transition-all duration-300 opacity-60 hover:opacity-100";

    const renderNavLinks = (onLinkClick) => (
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-8">
            <NavLink
                to="/"
                onClick={onLinkClick}
                className={({ isActive }) =>
                    `px-1 py-4 text-[10px] uppercase tracking-[0.2em] ${isActive ? activeClassName : inactiveClassName}`
                }
            >
                Tasks
            </NavLink>
            <NavLink
                to="/planner"
                onClick={onLinkClick}
                className={({ isActive }) =>
                    `px-1 py-4 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 ${isActive ? activeClassName : inactiveClassName}`
                }
            >
                <Rocket className="w-3 h-3" />
                Planner
            </NavLink>
        </div>
    );

    return (
        <nav className="bg-background/80 backdrop-blur-xl border-b border-border fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between h-20 items-center">
                    {/* Brand Industrial Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 shrink-0">
                                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg sm:text-xl font-black text-foreground tracking-tighter leading-none">LIFE OS</span>
                                <span className="text-[8px] sm:text-[9px] font-black tracking-widest sm:tracking-[0.35em] text-muted-foreground opacity-40 uppercase leading-none mt-1">Industrial Logic</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Matrix Navigation */}
                    <div className="hidden md:flex items-center">
                        {renderNavLinks()}
                    </div>

                    {/* Operational Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleDarkMode}
                            className="rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>

                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0 border border-border overflow-hidden hover:bg-muted transition-colors">
                                        <Avatar className="h-full w-full rounded-none">
                                            <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                                            <AvatarFallback className="bg-secondary text-[10px] font-black uppercase">{user?.displayName?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 mt-2 rounded-2xl p-2 border-border shadow-xl backdrop-blur-xl" align="end">
                                    <DropdownMenuLabel className="px-3 py-3">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-xs font-black uppercase tracking-tight text-foreground">{user?.displayName}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono truncate">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground focus:text-foreground flex items-center gap-3">
                                        <UserIcon className="w-4 h-4" />
                                        Protocol Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground focus:text-foreground flex items-center gap-3">
                                        <Settings className="w-4 h-4" />
                                        System Config
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    <DropdownMenuItem 
                                        onClick={handleLogout}
                                        className="rounded-xl px-3 py-2.5 text-xs font-black text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 flex items-center gap-3 cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        TERMINATE SESSION
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link to="/auth/login">
                                <Button className="rounded-xl px-6 h-10 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10">
                                    INITIALIZE
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Override */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Buffer Navigation */}
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden py-6 border-t border-border"
                    >
                        {renderNavLinks(() => setIsMenuOpen(false))}
                    </motion.div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
