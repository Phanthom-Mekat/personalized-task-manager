import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square, Sparkles } from 'lucide-react';
import { usePlanner } from '../../provider/PlannerProvider';
import toast from 'react-hot-toast';

export default function VoiceDictation({ onTranscribed, placeholder = "Dictate note..." }) {
    const { transcribeAudio } = usePlanner();
    const [recording, setRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [volume, setVolume] = useState(0); // Real-time volume index (0 to 100)

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    
    // Audio Context references for voice visualization
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const recordingRef = useRef(false);

    const startRecording = async () => {
        chunksRef.current = [];
        setTimeLeft(60);
        setVolume(0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Detect supported recording mimeType defensively
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                mimeType = 'audio/ogg;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                await handleAudioUpload(audioBlob, mimeType);
            };

            // Set up Real-time Audio Visualization using Web Audio API
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioContext();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 32; // small size for low latency volume detection

                source.connect(analyser);
                audioContextRef.current = audioCtx;
                analyserRef.current = analyser;

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                recordingRef.current = true;
                const updateVolume = () => {
                    if (!recordingRef.current) return;
                    analyser.getByteFrequencyData(dataArray);
                    
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;
                    
                    // Normalize average to scale of 0 to 100
                    const normVol = Math.min(100, Math.round((average / 140) * 100));
                    setVolume(normVol);
                    
                    animationFrameRef.current = requestAnimationFrame(updateVolume);
                };
                updateVolume();
            } catch (audioErr) {
                console.warn("Visualizer setup skipped:", audioErr);
            }

            mediaRecorder.start();
            setRecording(true);
            toast.success("Voice recording started. Speak now!", { icon: '🎙️' });

            // Start countdown timer
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err) {
            console.error("Failed to access microphone:", err);
            toast.error("Microphone access blocked or not found. Please enable it in browser settings.");
        }
    };

    const stopRecording = () => {
        recordingRef.current = false;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setRecording(false);
        setVolume(0);
    };

    const handleAudioUpload = async (blob, mimeType) => {
        setLoading(true);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            try {
                const base64Data = reader.result.split(',')[1];
                const res = await transcribeAudio(base64Data, mimeType);
                if (res && res.transcription) {
                    onTranscribed(res.transcription);
                    toast.success("AI Transcription inserted!", { icon: '🪄' });
                } else {
                    toast.error("AI could not transcribe audio correctly.");
                }
            } catch (err) {
                console.error("Transcription error:", err);
                toast.error("Network issue during speech transcription.");
            } finally {
                setLoading(false);
            }
        };
    };

    useEffect(() => {
        return () => {
            recordingRef.current = false;
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Create a beautiful bouncy array of vertical bars mapped to real-time volume
    const visualizerBars = Array.from({ length: 5 }, (_, i) => {
        const speedFactor = 0.5 + i * 0.1;
        // Seed some organic bounce variation so the wave looks natural
        const heightMultiplier = recording ? Math.max(1, (volume / 100) * 18 * speedFactor) : 1;
        return (
            <motion.div
                key={i}
                animate={{ height: recording ? `${4 + heightMultiplier}px` : "4px" }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                className="w-1 rounded-full bg-white opacity-90"
            />
        );
    });

    return (
        <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
                {recording ? (
                    <motion.button
                        key="recording-btn"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={stopRecording}
                        className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center gap-3 cursor-pointer relative shadow-lg shadow-red-500/20"
                    >
                        {/* Real-time sound wave visualizer bars! */}
                        <div className="flex items-end gap-0.5 h-6 shrink-0 mr-1">
                            {visualizerBars}
                        </div>
                        <Square className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                            Stop ({timeLeft}s)
                        </span>
                    </motion.button>
                ) : loading ? (
                    <motion.button
                        key="loading-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        disabled
                        className="h-10 px-4 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-400 font-bold flex items-center gap-2 cursor-not-allowed"
                    >
                        <div className="w-3 h-3 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                            AI Thinking...
                        </span>
                    </motion.button>
                ) : (
                    <motion.button
                        key="idle-btn"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={startRecording}
                        className="h-10 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
                        title="AI Voice dictation (English/Bangla/Banglish)"
                    >
                        <Mic className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1">
                            Dictate <Sparkles className="w-3 h-3 text-amber-400" />
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
