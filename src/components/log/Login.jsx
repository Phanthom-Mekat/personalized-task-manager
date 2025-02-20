import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import toast from "react-hot-toast";
import Lottie from "lottie-react";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2, Milestone } from 'lucide-react';
import LottieLogin from '../../assets/login.json'
import { AuthContext } from "../../provider/AuthProvider";

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
            setError('Password should be at least 6 characters');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setError('Password should have at least one uppercase letter');
            return;
        }
        if (!/[a-z]/.test(password)) {
            setError('Password should have at least one lowercase letter');
            return;
        }

        userLogin(email, password)
            .then((result) => {
                const user = result.user;
                setSuccess(true);
                setUser(user);
                toast.success('Signed in successfully.');
                navigate(location?.state ? location.state : "/");
            })
            .catch((err) => {
                setSuccess(false);
                setError(err.message);
                toast.error(`Invalid Password or User `);
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
                    const response = await fetch('https://edumanagebackend.vercel.app/users', {
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify(saveUser)
                    });
    
                    if (response.ok) {
                        setUser(loggedUser);
                        toast.success('Signed in successfully with Google!');
                        navigate(location?.state ? location.state : "/");
                    } else {
                        toast.error('Failed to save user data');
                    }
                } catch (error) {
                    toast.error('Error saving user data');
                    console.error(error);
                }
            })
            .catch((error) => {
                toast.error('Google sign-in failed');
                console.error(error);
            });
    };

    const handleEmailChange = (e) => {
        const email = e.target.value;
        setEmail(email);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col md:flex-row items-center justify-center p-6">
            <div className="w-full md:w-1/2 max-w-md transform hover:scale-105 transition-transform duration-500">
                <div className="w-full max-w-sm mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
                    <Lottie animationData={LottieLogin} loop={true} />
                </div>
            </div>
            
            <div className="w-full md:w-1/2 max-w-md z-10">
                <div className="bg-white/80 dark:bg-gray-800 glass backdrop-blur-lg shadow-xl rounded-2xl p-8 w-full transform transition-all duration-300 hover:shadow-2xl">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-300  mb-8">Sign in to continue your journey</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <div className={`relative group ${isEmailFocused ? 'focused' : ''}`}>
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors duration-200" />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                    required
                                    onChange={handleEmailChange}
                                    onFocus={() => setIsEmailFocused(true)}
                                    onBlur={() => setIsEmailFocused(false)}
                                />
                                <label className="absolute left-10 -top-2.5 bg-white px-2 text-sm text-gray-600 transition-all duration-200">
                                    Email Address
                                </label>
                            </div>
                        </div>

                        <div className="relative">
                            <div className={`relative group ${isPasswordFocused ? 'focused' : ''}`}>
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors duration-200" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                    required
                                    onFocus={() => setIsPasswordFocused(true)}
                                    onBlur={() => setIsPasswordFocused(false)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                                <label className="absolute left-10 -top-2.5 bg-white px-2 text-sm text-gray-600 transition-all duration-200">
                                    Password
                                </label>
                            </div>
                        </div>

                        {success && (
                            <div className="flex items-center gap-2 text-green-500 text-sm p-3 bg-green-50 rounded-lg">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Sign in successful!</span>
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 rounded-lg">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Link 
                                to="/auth/forgot" 
                                className="text-sm text-primary hover:text-primary-dark transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-primary text-white py-3 px-4 rounded-xl hover:bg-primary-dark transform hover:-translate-y-0.5 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none shadow-lg hover:shadow-xl"
                        >
                            <Milestone className="w-6 h-6 inline mr-1" />
                            Sign In
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transform hover:-translate-y-0.5 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 focus:outline-none bg-white/50 backdrop-blur-sm"
                        >
                            <FaGoogle className="text-xl text-primary" />
                            <span className="text-gray-700 font-medium">Continue with Google</span>
                        </button>
                    </form>
                    
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Dont have an account?{' '}
                        <Link 
                            to="/auth/register" 
                            className="text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;