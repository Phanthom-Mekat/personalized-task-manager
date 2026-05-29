import React from 'react';

const Logo = ({ className = "w-8 h-8", ...props }) => {
    return (
        <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className={className} 
            {...props}
        >
            <defs>
                {/* Modern vibrant gradient palette */}
                <linearGradient id="cyber-grad-1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" /> {/* Electric Blue */}
                    <stop offset="100%" stopColor="#8b5cf6" /> {/* Neon Purple */}
                </linearGradient>
                <linearGradient id="cyber-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" /> {/* Hot Pink */}
                </linearGradient>
                <linearGradient id="cyber-grad-3" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
            </defs>

            {/* Glowing background halo */}
            <circle cx="50" cy="50" r="30" fill="url(#cyber-grad-1)" opacity="0.15" />

            {/* The Möbius loop segments representing dynamic workflow cycles & intelligence loops */}
            <path 
                d="M30 65 C15 50, 15 30, 35 30 C55 30, 45 70, 65 70 C85 70, 85 50, 70 35" 
                stroke="url(#cyber-grad-1)" 
                strokeWidth="10" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="opacity-95"
            />
            
            <path 
                d="M65 35 C75 45, 80 55, 65 65 C50 75, 45 45, 35 35" 
                stroke="url(#cyber-grad-2)" 
                strokeWidth="10" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />

            {/* The Central Spark Core (representing the AI GPT Engine) */}
            <path 
                d="M50 38 C50 45, 45 50, 38 50 C45 50, 50 55, 50 62 C50 55, 55 50, 62 50 C55 50, 50 45, 50 38 Z" 
                fill="url(#cyber-grad-3)" 
            />
            
            {/* Micro accent nodes */}
            <circle cx="35" cy="30" r="3" fill="#ffffff" />
            <circle cx="65" cy="70" r="3" fill="#ffffff" />
        </svg>
    );
};

export default Logo;
