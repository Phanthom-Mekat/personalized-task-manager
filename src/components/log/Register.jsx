import apiClient from "../../lib/apiClient";
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { 
    Eye, EyeOff, Mail, Lock, User, 
    Image as ImageIcon, AlertCircle, 
    ArrowRight, Fingerprint, 
    UserPlus, ShieldPlus 
} from 'lucide-react';
import toast, { Toaster } from "react-hot-toast";
import Lottie from "lottie-react";
import { motion } from "framer-motion";

import LottieLogin from '../../assets/login.json';
import { AuthContext } from "../../provider/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Register = () => {
    const { createNewUser, setUser, updateUserProfile, signInWithGoogle } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const validatePassword = (password) => {
        if (password.length < 6) return "Length Mismatch: Min 6 tokens";
        if (!/[A-Z]/.test(password)) return "Security Gap: Missing uppercase";
        if (!/[a-z]/.test(password)) return "Security Gap: Missing lowercase";
        return null;
    };

    const registerUserInDB = async (userData) => {
        try {
            const data = await apiClient.post("/users", userData);
            toast.success(data.message === 'User already exists' ? "Welcome Back" : "Node Initialized");
            return true;
        } catch (error) {
            toast.error(error.message || "Internal Sync Error");
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const name = form.get("name");
        const email = form.get("email");
        const photo = form.get("photo");
        const password = form.get("password");

        setError({});
        if (name.length < 3) {
            setError({ name: "Identifier too short" });
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError({ password: passwordError });
            return;
        }

        try {
            const result = await createNewUser(email, password);
            const user = result.user;
            setUser(user);
            await updateUserProfile({ displayName: name, photoURL: photo });

            const userData = {
                uid: user.uid,
                name,
                email,
                photo,
                role: 'student'
            };

            if (await registerUserInDB(userData)) {
                navigate("/");
            }
        } catch (err) {
            setError({ register: err.message });
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithGoogle();
            const user = result.user;
            setUser(user);

            const userData = {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photo: user.photoURL,
                role: 'student'
            };

            if (await registerUserInDB(userData)) {
                navigate("/");
            }
        } catch (err) {
            setError({ google: err.message });
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Matrix */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none">
                <div className="grid grid-cols-12 h-full w-full">
                    {Array.from({ length: 120 }).map((_, i) => (
                        <div key={i} className="border-[0.5px] border-foreground p-8 flex items-center justify-center">
                            <span className="text-[6px] font-mono opacity-20">{i.toString(16).padStart(4, '0')}</span>
                        </div>
                    ))}
                </div>
            </div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10"
            >
                {/* Visual Identity Block */}
                <div className="hidden md:flex flex-col items-center justify-center space-y-8">
                   <div className="relative w-full max-w-sm aspect-square">
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
                        <Lottie animationData={LottieLogin} loop={true} className="relative z-10 opacity-80" />
                   </div>
                   <div className="text-center space-y-3 px-12">
                        <Badge variant="outline" className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">Protocol v.4.0</Badge>
                        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">New Node Initialization</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-40">Registering your unique vector within the global Life OS ecosystem.</p>
                   </div>
                </div>

                {/* Registration Vault */}
                <Card className="rounded-[32px] md:rounded-[40px] border-border bg-card/50 backdrop-blur-3xl shadow-2xl shadow-black/20 p-1 md:p-2 overflow-hidden">
                    <CardContent className="p-6 md:p-10 space-y-4 md:space-y-6">
                        <header className="space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <ShieldPlus className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-tight">Create Node</h1>
                            <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-40">Establish a New Identity in the Grid</p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 opacity-50">Identity Name</span>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            name="name"
                                            placeholder="System User"
                                            required
                                            className="h-11 pl-11 rounded-xl bg-secondary/30 border-border text-xs focus:ring-4 focus:ring-primary/5 font-bold"
                                        />
                                    </div>
                                    {error.name && <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1">{error.name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 opacity-50">Avatar Vector (URL)</span>
                                    <div className="relative group">
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            name="photo"
                                            type="url"
                                            placeholder="https://..."
                                            required
                                            className="h-11 pl-11 rounded-xl bg-secondary/30 border-border text-[10px] focus:ring-4 focus:ring-primary/5 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 opacity-50">Communication Hub (Email)</span>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="user@system.vector"
                                        required
                                        className="h-11 pl-11 rounded-xl bg-secondary/30 border-border font-mono text-xs focus:ring-4 focus:ring-primary/5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 opacity-50">Security Cipher</span>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        className="h-11 pl-11 pr-11 rounded-xl bg-secondary/30 border-border font-mono text-xs focus:ring-4 focus:ring-primary/5"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-20 hover:opacity-100 transition-opacity"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {error.password && <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1">{error.password}</p>}
                            </div>

                            {error.register && (
                                <div className="flex items-center gap-3 text-rose-500 text-[10px] p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl font-black uppercase tracking-widest">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error.register}</span>
                                </div>
                            )}

                            <Button 
                                type="submit"
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 flex items-center justify-center gap-3 group mt-4 overflow-hidden"
                            >
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] relative z-10">Initialize Identity</span>
                                <UserPlus className="w-4 h-4 relative z-10 transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-foreground/10 to-primary translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </Button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full bg-border/50" />
                                </div>
                                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                                    <span className="bg-card px-4 opacity-50">Federated Creation</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleSignIn}
                                className="w-full h-12 rounded-xl border-border bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center gap-3 transition-all"
                            >
                                <FaGoogle className="text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Google Sync Protocol</span>
                            </Button>
                        </form>
                        
                        <footer className="text-center">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                Existing Identity?{' '}
                                <Link 
                                    to="/auth/login" 
                                    className="text-primary hover:underline"
                                >
                                    Re-Access Vault
                                </Link>
                            </p>
                        </footer>
                    </CardContent>
                </Card>
            </motion.div>
            <Toaster position="bottom-center" />
        </div>
    );
};

export default Register;