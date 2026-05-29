import apiClient from "../../lib/apiClient";
import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import toast from "react-hot-toast";
import Lottie from "lottie-react";
import { 
    Eye, EyeOff, Mail, Lock, 
    AlertCircle, CheckCircle2, 
    Milestone, ShieldCheck, 
    ArrowRight, Fingerprint, 
    Hexagon
} from 'lucide-react';
import { motion } from "framer-motion";

import LottieLogin from '../../assets/login.json';
import { AuthContext } from "../../provider/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Login = () => {
    const { userLogin, setUser, signInWithGoogle, setEmail } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;

        setSuccess(false);
        setError('');
        if (password.length < 6) {
            setError('System Access Denied: Password length mismatch');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setError('Security Violation: Missing uppercase token');
            return;
        }

        userLogin(email, password)
            .then(async (result) => {
                const user = result.user;
                
                // Sync user to database incase they aren't there but exist in Firebase
                const saveUser = {
                    name: user.displayName || "Unknown",
                    email: user.email,
                    photo: user.photoURL || "",
                    role: "student",
                    uid: user.uid
                };
                
                try {
                    await apiClient.post("/users", saveUser);
                } catch (syncError) {
                    console.error("Auth sync failed", syncError);
                }

                setSuccess(true);
                setUser(user);
                toast.success('Initialize Protocol Complete');
                navigate(location?.state ? location.state : "/");
            })
            .catch((err) => {
                setSuccess(false);
                setError('Unauthorized: Credentials invalid');
                toast.error(`Authentication Failed`);
            });
    };

    const handleGoogleSignIn = () => {
        signInWithGoogle()
            .then(async (result) => {
                const loggedUser = result.user;
                const saveUser = {
                    name: loggedUser.displayName,
                    email: loggedUser.email,
                    photo: loggedUser.photoURL,
                    role: "student",
                    uid: loggedUser.uid
                };
    
                try {
                    await apiClient.post("/users", saveUser);
                    setUser(loggedUser);
                    toast.success('External Proxy Connection Established');
                    navigate(location?.state ? location.state : "/");
                } catch (error) {
                    toast.error('Sync Error');
                }
            })
            .catch(() => toast.error('Google Auth Failed'));
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
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10"
            >
                {/* Visual Identity Block */}
                <div className="hidden md:flex flex-col items-center justify-center space-y-8">
                   <div className="relative w-full max-w-sm aspect-square">
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
                        <Lottie animationData={LottieLogin} loop={true} className="relative z-10 opacity-80" />
                   </div>
                   <div className="text-center space-y-3 px-12">
                        <Badge variant="outline" className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">Secure Channel 0xAF</Badge>
                        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Operational Intelligence</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-40">Unifying fragmented task vectors into a singular strategic core.</p>
                   </div>
                </div>

                {/* Authentication Vault */}
                <Card className="rounded-[32px] md:rounded-[40px] border-border bg-card/50 backdrop-blur-3xl shadow-2xl shadow-black/20 p-1 md:p-2 overflow-hidden">
                    <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
                        <header className="space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <Fingerprint className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-tight">Identity Access</h1>
                            <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-40">System Login Required for Data Access</p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 ml-1 opacity-50">Authorized Email</span>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="user@system.vector"
                                        required
                                        className="h-12 pl-12 rounded-2xl bg-secondary/30 border-border font-mono text-xs focus:ring-4 focus:ring-primary/5"
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Cipher Key</span>
                                    <Link to="/auth/forgot" className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline">Lost Token?</Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        className="h-12 pl-12 pr-12 rounded-2xl bg-secondary/30 border-border font-mono text-xs focus:ring-4 focus:ring-primary/5"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-20 hover:opacity-100 transition-opacity"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 text-rose-500 text-[10px] p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl font-black uppercase tracking-widest">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button 
                                type="submit"
                                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 flex items-center justify-center gap-3 group overflow-hidden"
                            >
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] relative z-10">Authorize Terminal</span>
                                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-foreground/10 to-primary translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </Button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full bg-border/50" />
                                </div>
                                <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span className="bg-card px-4">Federated Entry</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleSignIn}
                                className="w-full h-14 rounded-2xl border-border bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center gap-3 transition-all"
                            >
                                <FaGoogle className="text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Google Auth Protocol</span>
                            </Button>
                        </form>
                        
                        <footer className="text-center pt-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                Unregistered Entity?{' '}
                                <Link 
                                    to="/auth/register" 
                                    className="text-primary hover:underline"
                                >
                                    Create New Node
                                </Link>
                            </p>
                        </footer>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;