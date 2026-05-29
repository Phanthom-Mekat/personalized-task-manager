import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ToggleLeft, ToggleRight, Zap, ChevronDown, ChevronUp, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function CloneChat({ apiCall, profile }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [cloneMode, setCloneMode] = useState(false);
    const [expandedThought, setExpandedThought] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Two-Way Interactive Voice Chat Mode States
    const [voiceMode, setVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

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
                if (text?.trim()) {
                    setInput(text);
                    handleVoiceSubmit(text);
                }
            };

            rec.onerror = (e) => {
                console.error('Speech recognition exception:', e.error);
                setIsListening(false);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = rec;
        }

        return () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, [voiceMode]);

    useEffect(() => {
        let active = true;
        setLoadingHistory(true);
        apiCall('GET', '/chat/history')
            .then(data => {
                if (active && data) {
                    setMessages(data.map(m => ({
                        role: m.role,
                        text: m.text,
                        thought: '',
                    })));
                }
            })
            .catch(err => console.error('Failed to load chat history:', err))
            .finally(() => {
                if (active) setLoadingHistory(false);
            });
        return () => { active = false; };
    }, [apiCall]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Speak Assistant Replies Aloud
    const speakAloud = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop active overlays

        // Clean text of emojis & codeblocks for natural reading
        const clean = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '')
                          .replace(/\*\*/g, '')
                          .replace(/```[\s\S]*?```/g, '')
                          .trim();

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const defaultVoice = voices.find(v => (v.lang.startsWith('en') || v.lang.startsWith('en-')) && (v.name.includes('Google') || v.name.includes('Natural'))) || voices[0];
        if (defaultVoice) utterance.voice = defaultVoice;

        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            recognitionRef.current.start();
        }
    };

    const handleVoiceSubmit = async (text) => {
        if (!text.trim() || sending) return;
        
        // Render user spoken message immediately in chat list
        setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
        setSending(true);
        setInput('');

        try {
            const res = await apiCall('POST', '/chat', { message: text.trim(), cloneMode });
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: res.reply,
                thought: res.thoughtProcess || '',
            }]);

            // If voice mode is active, automatically read reply
            if (voiceMode) {
                speakAloud(res.reply);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: 'Something went wrong. Please try again.',
                isError: true,
            }]);
        } finally {
            setSending(false);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        if (window.speechSynthesis) window.speechSynthesis.cancel(); // Prune running TTS on send

        setInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        setSending(true);

        try {
            const res = await apiCall('POST', '/chat', { message: text, cloneMode });
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: res.reply,
                thought: res.thoughtProcess || '',
            }]);

            if (voiceMode) {
                speakAloud(res.reply);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: 'Something went wrong. Please try again.',
                isError: true,
            }]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const userName = profile?.basics?.fullName?.split(' ')[0] || 'You';

    return (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
            {/* Toggles Bar */}
            <div className="flex items-center justify-between mb-4 px-2.5 py-1.5 bg-secondary/15 rounded-xl border border-border/20">
                {/* Clone Mode Toggle */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <Zap className={`w-3.5 h-3.5 ${cloneMode ? 'text-fuchsia-400' : 'text-muted-foreground/50'}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Clone Mode</span>
                    </div>
                    <button
                        onClick={() => setCloneMode(c => !c)}
                        className="flex items-center"
                    >
                        {cloneMode ? (
                            <ToggleRight className="w-6 h-6 text-fuchsia-400" />
                        ) : (
                            <ToggleLeft className="w-6 h-6 text-muted-foreground/40" />
                        )}
                    </button>
                </div>

                {/* Voice Mode Playback Toggle */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <Volume2 className={`w-3.5 h-3.5 ${voiceMode ? 'text-violet-400' : 'text-muted-foreground/50'}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Voice Playback</span>
                    </div>
                    <button
                        onClick={() => {
                            setVoiceMode(v => !v);
                            if (voiceMode && window.speechSynthesis) window.speechSynthesis.cancel();
                        }}
                        className="flex items-center"
                    >
                        {voiceMode ? (
                            <ToggleRight className="w-6 h-6 text-violet-400" />
                        ) : (
                            <ToggleLeft className="w-6 h-6 text-muted-foreground/40" />
                        )}
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                        <span className="text-xs text-muted-foreground">Restoring conversation history...</span>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/10">
                                    <Zap className="w-7 h-7 text-violet-400" />
                                </div>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Start talking to your AI companion. The more you share, the smarter it becomes.
                                </p>
                            </div>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                            : msg.isError
                                                ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md'
                                                : 'bg-secondary/60 text-foreground border border-border/40 rounded-bl-md'
                                    }`}>
                                        {msg.role === 'assistant' && !msg.isError && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-1">
                                                {cloneMode ? `${userName}'s Clone` : 'Companion'}
                                            </span>
                                        )}
                                        <p className="whitespace-pre-wrap">{msg.text}</p>

                                        {/* Thought Process Expansion */}
                                        {msg.thought && (
                                            <div className="mt-2 pt-2 border-t border-border/30">
                                                <button
                                                    onClick={() => setExpandedThought(expandedThought === i ? null : i)}
                                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                                                >
                                                    {expandedThought === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    Memory Context
                                                </button>
                                                <AnimatePresence>
                                                    {expandedThought === i && (
                                                        <motion.p
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="text-[11px] text-muted-foreground/60 mt-1 overflow-hidden"
                                                        >
                                                            {msg.thought}
                                                        </motion.p>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </>
                )}

                {sending && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-secondary/60 border border-border/40 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                            <span className="text-xs text-muted-foreground">Thinking…</span>
                        </div>
                    </motion.div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="mt-4 flex items-end gap-2">
                <button
                    onClick={toggleListening}
                    disabled={sending}
                    className={`p-3 rounded-xl border transition-all ${
                        isListening
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse shadow-md shadow-rose-500/10'
                            : 'bg-secondary/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                    title="Real-Time Microphone Speak"
                >
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                
                <div className="flex-1 relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening..." : "Talk to your companion…"}
                        rows={1}
                        className="w-full resize-none bg-secondary/40 border border-border/50 rounded-xl px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
                        style={{ maxHeight: '120px' }}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                        }}
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 disabled:opacity-30 disabled:shadow-none transition-all"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default CloneChat;
