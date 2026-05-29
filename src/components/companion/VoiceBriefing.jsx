import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Loader2, ToggleLeft, ToggleRight, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const VIBES = [
    { id: 'friend',    label: 'Best Friend',    emoji: '🤝', desc: 'Warm, relational, casual' },
    { id: 'zen',       label: 'Zen Guide',      emoji: '🧘', desc: 'Calm, soft, slow-paced' },
    { id: 'drill',     label: 'Drill Sergeant',  emoji: '🎖️', desc: 'High energy, disciplined' },
    { id: 'scientist', label: 'Data Scientist',  emoji: '🔬', desc: 'Fact-based, analytical' }
];

// Helper to calculate word overlap ratio for echo cancellation
const getJaccardSimilarity = (str1, str2) => {
    const s1 = new Set(String(str1 || '').toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const s2 = new Set(String(str2 || '').toLowerCase().split(/\s+/).filter(w => w.length > 2));
    if (s1.size === 0 || s2.size === 0) return 0;
    
    let intersection = 0;
    for (const token of s1) {
        if (s2.has(token)) intersection++;
    }
    return intersection / (s1.size + s2.size - intersection);
};

function VoiceBriefing({ apiCall }) {
    const [loading, setLoading] = useState(false);
    const [segments, setSegments] = useState([]);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [muted, setMuted] = useState(false);

    // Vibe Personality Mode State
    const [vibe, setVibe] = useState('friend');

    // Speech Customizer Parameters
    const [voices, setVoices] = useState([]);
    const [selectedVoiceName, setSelectedVoiceName] = useState('');
    const [rate, setRate] = useState(1.05);
    const [pitch, setPitch] = useState(1.0);
    const [volume, setVolume] = useState(1.0);

    // Two-Way Voice Call States
    const [interactiveMode, setInteractiveMode] = useState(true);
    const [cloneMode, setCloneMode] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const synthRef = useRef(window.speechSynthesis);
    const utteranceRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const recognitionRef = useRef(null);

    // Persistent refs to avoid stale closure state captures
    const isPlayingRef = useRef(false);
    const activeIdxRef = useRef(-1);
    const segmentsRef = useRef([]);
    const isListeningRef = useRef(false);
    const interactiveModeRef = useRef(true);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        activeIdxRef.current = activeIdx;
    }, [activeIdx]);

    useEffect(() => {
        segmentsRef.current = segments;
    }, [segments]);

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        interactiveModeRef.current = interactiveMode;
    }, [interactiveMode]);

    // Load native browser speech voices list dynamically
    const loadVoices = () => {
        if (!synthRef.current) return;
        const allVoices = synthRef.current.getVoices() || [];
        const filtered = allVoices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('en-'));
        setVoices(filtered.length > 0 ? filtered : allVoices);

        if (filtered.length > 0) {
            const defaultVoice = filtered.find(v => v.name.includes('Google') || v.name.includes('Natural')) || filtered[0];
            setSelectedVoiceName(defaultVoice.name);
        }
    };

    useEffect(() => {
        loadVoices();
        if (synthRef.current && typeof synthRef.current.addEventListener === 'function') {
            synthRef.current.addEventListener('voiceschanged', loadVoices);
        }
        return () => {
            if (synthRef.current && typeof synthRef.current.removeEventListener === 'function') {
                synthRef.current.removeEventListener('voiceschanged', loadVoices);
            }
        };
    }, []);

    // Initialize browser-native voice recording listener
    useEffect(() => {
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onstart = () => {
                setIsListening(true);
            };

            rec.onresult = (event) => {
                const text = event.results[0][0].transcript;
                if (!text?.trim()) return;

                // ADVANCED ECHO CANCELLATION: Prevent the AI twin from transcribing and responding to its own spoken voice
                if (synthRef.current && synthRef.current.speaking && activeIdxRef.current !== -1) {
                    const activeSegText = segmentsRef.current[activeIdxRef.current]?.text || '';
                    const cleanTrans = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
                    const cleanActive = activeSegText.toLowerCase().replace(/[^a-z0-9\s]/g, '');

                    // If it is a subset or has very high word overlap, assume it's echo and ignore
                    if (cleanActive.includes(cleanTrans) || getJaccardSimilarity(cleanTrans, cleanActive) > 0.45) {
                        console.log('Echo detected and scrubbed successfully:', text);
                        return;
                    }
                }

                // Barge-In: If user talks while twin is speaking, immediately stop speaking and prioritize user
                if (synthRef.current && synthRef.current.speaking) {
                    synthRef.current.cancel();
                }

                handleUserVoiceInput(text);
            };

            rec.onerror = (e) => {
                console.warn('Speech recognition exception:', e.error);
                setIsListening(false);

                // Auto-restart listening if it is a silent timeout and the call is still active
                if (e.error === 'no-speech' && isPlayingRef.current && interactiveModeRef.current) {
                    setTimeout(() => {
                        if (isPlayingRef.current && interactiveModeRef.current && !isListeningRef.current && !synthRef.current?.speaking) {
                            startListeningSafe();
                        }
                    }, 400);
                }
            };

            rec.onend = () => {
                setIsListening(false);
                // Continuous Always-On Listening: Auto-restart microphone when recognition closes mid-call
                if (isPlayingRef.current && interactiveModeRef.current) {
                    setTimeout(() => {
                        if (isPlayingRef.current && interactiveModeRef.current && !isListeningRef.current) {
                            startListeningSafe();
                        }
                    }, 200);
                }
            };

            recognitionRef.current = rec;
        }

        return () => {
            if (synthRef.current) synthRef.current.cancel();
            stopListeningSafe();
        };
    }, []);

    // Stop listening immediately if interactiveMode is toggled off mid-call
    useEffect(() => {
        if (!interactiveMode) {
            stopListeningSafe();
        } else if (isPlaying && !isListening) {
            startListeningSafe();
        }
    }, [interactiveMode]);

    const startListeningSafe = () => {
        if (!recognitionRef.current || isListeningRef.current) return;
        try {
            recognitionRef.current.start();
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
        }
    };

    const stopListeningSafe = () => {
        if (recognitionRef.current && isListeningRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                console.error('Failed to stop speech recognition:', err);
            }
        }
    };

    // Fetch daily briefing script based on current vibe mode
    const fetchBriefing = async (selectedVibe = vibe) => {
        setLoading(true);
        setActiveIdx(-1);
        setIsPlaying(false);
        stopListeningSafe();
        if (synthRef.current) synthRef.current.cancel();

        try {
            const data = await apiCall('GET', `/briefing/generate?vibe=${selectedVibe}`);
            if (data?.segments) {
                setSegments(data.segments);
                return data.segments;
            }
        } catch (err) {
            console.error('Failed to load voice brief:', err);
        } finally {
            setLoading(false);
        }
        return [];
    };

    // Reload briefing on vibe toggle
    useEffect(() => {
        fetchBriefing(vibe);
        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
            stopListeningSafe();
        };
    }, [vibe]);

    // Handle captured user speech in real-time
    const handleUserVoiceInput = async (text) => {
        if (!text.trim() || loading) return;

        // Immediately cancel any outstanding outputs to take user input priority
        stopListeningSafe();
        if (synthRef.current) synthRef.current.cancel();

        // 1. Add User spoken message as a visual bubble in the transcript
        const userSegId = `user_${Date.now()}`;
        const userSeg = { id: userSegId, role: 'user', text: text.trim() };

        setSegments(prev => [...prev, userSeg]);
        setLoading(true);

        // Safety timeout to prevent infinite "THINKING..." if network is unstable, blocked, or local resolution lags
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 10000)
        );

        try {
            // 2. Race the API call against a 10-second request timeout
            const res = await Promise.race([
                apiCall('POST', '/chat', { message: text.trim(), cloneMode }),
                timeoutPromise
            ]);

            // 3. Append Twin response segment and trigger voice readback
            const replyText = res.reply || "I'm here, listening. Please continue.";
            const assistantSegId = `reply_${Date.now()}`;
            const assistantSeg = { id: assistantSegId, role: 'assistant', text: replyText };

            setSegments(prev => {
                const newSegs = [...prev, assistantSeg];
                const newIdx = newSegs.length - 1;
                // Defer speech start slightly to ensure state changes propagate
                setTimeout(() => {
                    playSegment(newIdx, newSegs);
                }, 100);
                return newSegs;
            });
        } catch (err) {
            console.error('Failed to process interactive call exchange:', err);
            const isTimeout = err.message === 'TIMEOUT';
            const errorSeg = {
                id: `err_${Date.now()}`,
                role: 'assistant',
                text: isTimeout 
                    ? "The connection is taking a bit of time. Let's try that again!"
                    : "I had a tiny network glitch. Can you repeat that for me?"
            };
            setSegments(prev => {
                const newSegs = [...prev, errorSeg];
                const newIdx = newSegs.length - 1;
                setTimeout(() => {
                    playSegment(newIdx, newSegs);
                }, 100);
                return newSegs;
            });
        } finally {
            setLoading(false);
            // Re-enable microphone to listen for follow-ups
            if (interactiveModeRef.current) {
                setTimeout(startListeningSafe, 500);
            }
        }
    };

    // Sequenced Voice Audio Queue Manager
    const playSegment = (idx, customSegments = null) => {
        const segs = customSegments || segmentsRef.current;
        if (!synthRef.current || idx >= segs.length) {
            setIsPlaying(false);
            setActiveIdx(-1);
            return;
        }

        synthRef.current.cancel();
        setActiveIdx(idx);

        const textToSpeak = segs[idx].text;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;

        // CRITICAL Chrome Bug Workaround: store strong reference to prevent Garbage Collection sweeping mid-speech
        window.utterances = window.utterances || [];
        window.utterances.push(utterance);
        if (window.utterances.length > 10) {
            window.utterances.shift();
        }

        // Apply dynamic customizer voice parameters
        if (selectedVoiceName) {
            const voiceMatch = voices.find(v => v.name === selectedVoiceName);
            if (voiceMatch) utterance.voice = voiceMatch;
        }
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = muted ? 0 : volume;

        // Sequential queue trigger callback hooks using persistent refs
        utterance.onend = () => {
            if (isPlayingRef.current) {
                const currentSegs = customSegments || segmentsRef.current;
                const currentSeg = currentSegs[idx];

                const isLastSegment = idx === currentSegs.length - 1;
                const isAssistantReply = currentSeg?.role === 'assistant';

                // Automatically restart listening at the end of the morning brief
                if (interactiveModeRef.current && (isLastSegment || isAssistantReply)) {
                    startListeningSafe();
                } else if (idx + 1 < currentSegs.length) {
                    playSegment(idx + 1, currentSegs);
                } else {
                    setIsPlaying(false);
                    setActiveIdx(-1);
                }
            }
        };

        utterance.onerror = (e) => {
            console.warn('Speech synthesis segment skip error:', e);
            if (isPlayingRef.current) {
                const currentSegs = customSegments || segmentsRef.current;
                if (idx + 1 < currentSegs.length) {
                    playSegment(idx + 1, currentSegs);
                } else {
                    setIsPlaying(false);
                    setActiveIdx(-1);
                }
            }
        };

        synthRef.current.speak(utterance);
    };

    const handlePlayPause = () => {
        if (!synthRef.current) return;

        if (isPlaying || isListening) {
            // Cancel active speech and stop mic immediately
            synthRef.current.cancel();
            stopListeningSafe();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            
            // If the transcript is empty, load the briefing first!
            if (segments.length === 0) {
                fetchBriefing(vibe).then((segs) => {
                    if (segs && segs.length > 0) {
                        setIsPlaying(true);
                        playSegment(0, segs);
                        if (interactiveMode) {
                            setTimeout(startListeningSafe, 600);
                        }
                    }
                });
            } else {
                playSegment(activeIdx === -1 ? 0 : activeIdx);
                if (interactiveMode) {
                    setTimeout(startListeningSafe, 600);
                }
            }
        }
    };

    const handleRestart = () => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        stopListeningSafe();
        setIsPlaying(true);
        fetchBriefing(vibe).then((segs) => {
            if (segs && segs.length > 0) {
                setIsPlaying(true);
                playSegment(0, segs);
                if (interactiveMode) {
                    setTimeout(startListeningSafe, 600);
                }
            }
        });
    };

    const toggleMute = () => {
        setMuted(!muted);
        if (utteranceRef.current) {
            utteranceRef.current.volume = !muted ? 0 : volume;
        }
    };

    // Live HTML5 Canvas Frequency Sine Wave Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrame;
        let phase = 0;

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement.clientWidth || 300;
            canvas.height = canvas.parentElement.clientHeight || 300;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const midY = canvas.height / 2;
            const width = canvas.width;

            // Frequency and amplitude adjustments based on synthesis states
            let ampFactor = isPlaying ? 25 : 5;
            let speedFactor = isPlaying ? 0.15 : 0.02;

            if (isListening) {
                ampFactor = 16;       // Gentle breathing wave
                speedFactor = 0.06;   // Slow, calm wave
            } else if (loading) {
                ampFactor = 12;
                speedFactor = 0.08;
            }

            phase += speedFactor;

            // Draw primary glowing outer wave
            ctx.beginPath();
            ctx.strokeStyle = isListening ? 'rgba(16, 185, 129, 0.75)' // Glowing emerald when listening
                            : vibe === 'zen' ? 'rgba(168, 85, 247, 0.6)' 
                            : vibe === 'drill' ? 'rgba(244, 63, 94, 0.6)'
                            : vibe === 'scientist' ? 'rgba(16, 185, 129, 0.6)'
                            : 'rgba(236, 72, 153, 0.6)';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.strokeStyle;

            for (let x = 0; x < width; x++) {
                const angle = (x / width) * Math.PI * 2.5;
                const y = midY + Math.sin(angle - phase) * ampFactor * Math.sin(x / width * Math.PI);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw secondary visual wave
            ctx.beginPath();
            ctx.strokeStyle = isListening ? 'rgba(6, 182, 212, 0.4)'  // Cyan breathing accent
                            : vibe === 'zen' ? 'rgba(236, 72, 153, 0.3)' 
                            : vibe === 'drill' ? 'rgba(249, 115, 22, 0.3)'
                            : vibe === 'scientist' ? 'rgba(6, 182, 212, 0.3)'
                            : 'rgba(168, 85, 247, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 5;

            for (let x = 0; x < width; x++) {
                const angle = (x / width) * Math.PI * 3.8;
                const y = midY + Math.sin(angle + phase * 1.3) * (ampFactor * 0.6) * Math.sin(x / width * Math.PI);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            animationFrame = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [isPlaying, loading, vibe, isListening]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto p-4 md:p-6 bg-card/25 backdrop-blur-md border border-border/40 rounded-3xl shadow-xl">
            
            {/* Vibe Personality Coaching Mode Selector */}
            <div className="lg:col-span-12 bg-secondary/15 rounded-2xl border border-border/20 p-4">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-foreground tracking-wider pb-3 border-b border-border/20 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Configure Morning Coaching Personality</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {VIBES.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setVibe(v.id)}
                            className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                                vibe === v.id
                                    ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-400 scale-[1.02]'
                                    : 'bg-background hover:bg-secondary/40 border-border/30 text-muted-foreground'
                            }`}
                        >
                            <span className="text-xl mb-1">{v.emoji}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider">{v.label}</span>
                            <span className="text-[8px] opacity-60 mt-0.5">{v.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Audio customization parameters column */}
            <div className="lg:col-span-4 bg-secondary/10 border border-border/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-foreground tracking-wider pb-2 border-b border-border/20">
                    <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                    <span>Speech Modulation</span>
                </div>

                {/* Accent selector dropdown */}
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Accent Voice</label>
                    <select
                        value={selectedVoiceName}
                        onChange={(e) => setSelectedVoiceName(e.target.value)}
                        className="w-full text-[10px] bg-background border border-border/40 rounded-lg p-2 text-foreground font-bold focus:outline-none focus:border-violet-500/50"
                    >
                        {voices.map((v, i) => (
                            <option key={i} value={v.name}>{v.name} ({v.lang})</option>
                        ))}
                    </select>
                </div>

                {/* Speaking Rate speed slider */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                        <span>Speaking Speed</span>
                        <span className="text-violet-400">{rate}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.6"
                        max="1.8"
                        step="0.05"
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                </div>

                {/* Pitch slider */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                        <span>Pitch Control</span>
                        <span className="text-fuchsia-400">{pitch}</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={pitch}
                        onChange={(e) => setPitch(Number(e.target.value))}
                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                    />
                </div>

                {/* Volume slider */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                        <span>Volume Level</span>
                        <span className="text-emerald-400">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>

                {/* Two-Way Call Controls */}
                <div className="pt-4 border-t border-border/20 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Interactive Call Mode</span>
                            <span className="text-[8px] text-muted-foreground">Hands-free voice chat capability</span>
                        </div>
                        <button
                            onClick={() => setInteractiveMode(i => !i)}
                            className="flex items-center text-muted-foreground hover:text-foreground transition-all"
                        >
                            {interactiveMode ? (
                                <ToggleRight className="w-6 h-6 text-emerald-400" />
                            ) : (
                                <ToggleLeft className="w-6 h-6 text-muted-foreground/40" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Twin Clone Mode</span>
                            <span className="text-[8px] text-muted-foreground">Mimics your traits & speech patterns</span>
                        </div>
                        <button
                            onClick={() => setCloneMode(c => !c)}
                            className="flex items-center text-muted-foreground hover:text-foreground transition-all"
                            disabled={!interactiveMode}
                            style={{ opacity: interactiveMode ? 1 : 0.4 }}
                        >
                            {cloneMode ? (
                                <ToggleRight className="w-6 h-6 text-violet-400" />
                            ) : (
                                <ToggleLeft className="w-6 h-6 text-muted-foreground/40" />
                            )}
                        </button>
                    </div>

                    {/* Touch-to-Interrupt Guide Notice */}
                    {interactiveMode && (
                        <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-[8px] text-violet-400 font-bold uppercase tracking-wider leading-relaxed text-center">
                            💡 Tap the glowing Orb at any time to interrupt and speak!
                        </div>
                    )}

                    {!SpeechRecognition && interactiveMode && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[8.5px] text-rose-400 font-bold uppercase tracking-wider leading-relaxed">
                            ⚠️ Browser Speech Recognition is unsupported. Interactive mode disabled. Please use Google Chrome or Edge.
                        </div>
                    )}
                </div>
            </div>

            {/* Visual Call Orb Canvas spectrum column */}
            <div 
                onClick={() => {
                    if (isPlaying && synthRef.current?.speaking) {
                        synthRef.current.cancel();
                        startListeningSafe();
                    }
                }}
                className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-secondary/15 rounded-2xl border border-border/20 min-h-[300px] relative overflow-hidden cursor-pointer hover:bg-secondary/20 transition-all group"
                title="Click to interrupt and speak"
            >
                {/* Audio Canvas spectrum drawing frame */}
                <div className="relative w-full h-44 flex items-center justify-center">
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                    
                    {/* Status Display inside Orb */}
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <AnimatePresence mode="wait">
                            {isListening ? (
                                <motion.div
                                    key="listening"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-4 py-2 backdrop-blur-md"
                                >
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">Listening...</span>
                                </motion.div>
                            ) : loading ? (
                                <motion.div
                                    key="thinking"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center gap-1.5 bg-violet-500/15 border border-violet-500/30 rounded-full px-4 py-2 backdrop-blur-md"
                                >
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 animate-pulse">Thinking...</span>
                                </motion.div>
                            ) : isPlaying ? (
                                <motion.div
                                    key="speaking"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center gap-1.5 bg-fuchsia-500/15 border border-fuchsia-500/30 rounded-full px-4 py-2 backdrop-blur-md"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">Speaking...</span>
                                    <span className="text-[7px] text-muted-foreground opacity-60 uppercase font-black tracking-widest group-hover:opacity-100 transition-opacity">Tap to Interrupt</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center gap-1 bg-secondary/40 border border-border/40 rounded-full px-4 py-2 backdrop-blur-md"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Call Standby</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Vocal Briefing Controllers */}
                <div className="flex items-center gap-3 mt-4 z-10" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={toggleMute}
                        disabled={loading}
                        className="p-2.5 bg-secondary/50 border border-border/40 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={handlePlayPause}
                        disabled={loading}
                        className={`px-5 py-2.5 font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 ${
                            isListening
                                ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/25 text-white'
                                : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-violet-500/25 text-white'
                        }`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating...</span>
                            </div>
                        ) : isListening ? (
                            <div className="flex items-center gap-1.5">
                                <Mic className="w-3.5 h-3.5 fill-current animate-pulse text-white" />
                                <span>End Call</span>
                            </div>
                        ) : isPlaying ? (
                            <div className="flex items-center gap-1.5">
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>End Call</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{interactiveMode ? 'Start Call' : 'Start Brief'}</span>
                            </div>
                        )}
                    </button>

                    <button
                        onClick={handleRestart}
                        disabled={loading}
                        className="p-2.5 bg-secondary/50 border border-border/40 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                        title="Restart Briefing"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Structured Audio Transcript Segment Stream */}
            <div className="lg:col-span-4 flex flex-col justify-between p-6 bg-secondary/10 border border-border/20 rounded-2xl min-h-[300px]">
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-foreground tracking-wider border-b border-border/40 pb-2">Active Transcript</h3>
                    
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {loading && segments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Compiling Daily Audio Script...</span>
                            </div>
                        ) : segments.length === 0 ? (
                            <div className="text-[10px] text-muted-foreground italic text-center py-16">
                                Click Start Call to connect your twin voice session.
                            </div>
                        ) : (
                            segments.map((seg, idx) => {
                                const isActive = activeIdx === idx;
                                const isPassed = activeIdx > idx;
                                const isUser = seg.role === 'user';

                                return (
                                    <motion.div
                                        key={seg.id}
                                        className={`p-3 rounded-xl border transition-all ${
                                            isUser
                                                ? 'bg-primary/10 border-primary/20 ml-6 rounded-tr-none'
                                                : isActive
                                                ? 'bg-violet-500/10 border-violet-500/30 shadow-sm mr-6 rounded-tl-none'
                                                : isPassed
                                                ? 'bg-transparent border-border/10 opacity-40 mr-6 rounded-tl-none'
                                                : 'bg-transparent border-border/20 opacity-85 mr-6 rounded-tl-none'
                                        }`}
                                        animate={isActive ? { scale: 1.01 } : { scale: 1 }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${
                                                isUser ? 'text-emerald-400' : isActive ? 'text-violet-400' : 'text-muted-foreground'
                                            }`}>
                                                {isUser ? 'You' : `Companion (${seg.id})`}
                                            </span>
                                            {isActive && (
                                                <span className="flex h-1.5 w-1.5 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[9.5px] leading-relaxed ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                            {seg.text}
                                        </p>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="text-[9px] font-bold text-muted-foreground/60 border-t border-border/30 pt-3 flex items-center justify-between uppercase tracking-wider mt-4">
                    <span>Utterance Chunks: {segments.length}</span>
                    <span>Status: {isListening ? 'Listening' : isPlaying ? 'Speaking' : loading ? 'Thinking' : 'Idle'}</span>
                </div>
            </div>
        </div>
    );
}

export default VoiceBriefing;
