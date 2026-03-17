import React, { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X } from 'lucide-react';
import { getJson, getLocalDateKey } from '../utils/storage';

const BREATHING_PATTERN = [
    { phase: 'inhale', seconds: 4 },
    { phase: 'hold', seconds: 7 },
    { phase: 'exhale', seconds: 8 },
];
const BREATHING_CYCLE_COUNT = 4;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const MotionDiv = motion.div;
const MotionH3 = motion.h3;

const CognitiveGuard = ({ manualTriggerSignal = 0 }) => {
    const [triggerGuard, setTriggerGuard] = useState(false);
    const [breathingPhase, setBreathingPhase] = useState('inhale');
    const [timeLeft, setTimeLeft] = useState(0);
    const lastManualSignalRef = useRef(0);

    const checkCognitiveOverload = useCallback(() => {
        const settings = getJson('prodify_settings', {});
        if (!settings.autoCognitiveGuard) return;

        const synergyState = localStorage.getItem('prodify_balance_state') || 'balanced';
        const MAX_DAILY_ENERGY = synergyState === 'buffed' ? 13 : synergyState === 'debuffed' ? 7 : 10;

        const timeBlocks = getJson('time_blocks', {});
        const todayKey = getLocalDateKey(new Date());
        const todayBlocks = timeBlocks[todayKey] || [];
        const currentDailyEnergy = todayBlocks.reduce((acc, block) => acc + (block.energy || 1), 0);

        if (currentDailyEnergy > MAX_DAILY_ENERGY) {
            const lastTriggered = localStorage.getItem('prodify_last_auto_guard');
            if (lastTriggered !== todayKey) {
                setTriggerGuard(true);
                localStorage.setItem('prodify_last_auto_guard', todayKey);
            }
        }
    }, []);

    useEffect(() => {
        checkCognitiveOverload();
        window.addEventListener('storage', checkCognitiveOverload);
        window.addEventListener('prodify-sync', checkCognitiveOverload);

        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
                setTriggerGuard(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('storage', checkCognitiveOverload);
            window.removeEventListener('prodify-sync', checkCognitiveOverload);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [checkCognitiveOverload]);

    useEffect(() => {
        if (!manualTriggerSignal) return;
        if (manualTriggerSignal !== lastManualSignalRef.current) {
            lastManualSignalRef.current = manualTriggerSignal;
            setTriggerGuard(true);
        }
    }, [manualTriggerSignal]);

    useEffect(() => {
        if (!triggerGuard) return undefined;
        let cancelled = false;

        const runCycle = async () => {
            for (let cycle = 0; cycle < BREATHING_CYCLE_COUNT; cycle++) {
                for (const step of BREATHING_PATTERN) {
                    if (cancelled) return;
                    setBreathingPhase(step.phase);
                    setTimeLeft(step.seconds);
                    await wait(step.seconds * 1000);
                }
            }
            if (cancelled) return;
            setTriggerGuard(false);
        };

        runCycle();
        return () => { cancelled = true; };
    }, [triggerGuard]);

    useEffect(() => {
        if (!triggerGuard) return;
        const t = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(t);
    }, [triggerGuard, breathingPhase]);

    const circleVariants = {
        inhale: { scale: 1.5, opacity: 0.8, backgroundColor: '#3b82f6', transition: { duration: 4 } },
        hold: { scale: 1.5, opacity: 1, backgroundColor: '#8b5cf6', transition: { duration: 7 } },
        exhale: { scale: 1, opacity: 0.4, backgroundColor: '#10b981', transition: { duration: 8 } }
    };

    const phaseText = {
        inhale: "Tarik Napas Pelan...",
        hold: "Tahan Napas...",
        exhale: "Hembuskan Perlahan..."
    };

    if (!triggerGuard) return null;

    return (
        <AnimatePresence>
            <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-3xl text-white p-6"
            >
                {/* Tombol Close tetap absolute karena posisinya di pojok */}
                <button 
                    onClick={() => setTriggerGuard(false)} 
                    className="absolute top-6 right-6 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-slate-300 hover:text-white z-50"
                    title="Tutup (Lewati Fase Ini)"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Kontainer Utama mengikuti flow normal (tidak bertumpuk) */}
                <div className="flex flex-col items-center justify-center max-w-xl mx-auto w-full">
                    
                    {/* Judul */}
                    <div className="flex items-center justify-center gap-3 text-teal-300 mb-6 w-full">
                        <Brain className="w-8 h-8 shrink-0" />
                        <h2 className="text-xl md:text-2xl font-bold tracking-widest uppercase text-center">
                            Zona Relaksasi Mental
                        </h2>
                    </div>

                    {/* Teks Intro */}
                    <p className="text-slate-300 text-center text-sm md:text-lg leading-relaxed mb-12">
                        Sistem mendeteksi Anda butuh rehat. Mari istirahatkan saraf optik dan otak Anda dengan Teknik Pernapasan 4-7-8 selama 1 menit.
                    </p>

                    {/* Animasi Breathing */}
                    <div className="relative w-64 h-64 flex items-center justify-center my-4">
                        <MotionDiv variants={circleVariants} animate={triggerGuard ? breathingPhase : "exhale"} className="absolute w-32 h-32 rounded-full blur-xl" />
                        <MotionDiv variants={circleVariants} animate={triggerGuard ? breathingPhase : "exhale"} className="absolute w-32 h-32 rounded-full border-4 border-white border-opacity-20 flex items-center justify-center shadow-inner" />
                        
                        {/* Angka Timer dipisahkan agar ukurannya tidak ikut membesar dan distorsi saat efek 'scale' berjalan */}
                        <span className="text-5xl font-black drop-shadow-md z-10 absolute">
                            {timeLeft}
                        </span>
                    </div>

                    {/* Teks Fase - Dibungkus container dengan height tetap agar saat transisi textnya tidak membuat layout melompat */}
                    <div className="h-16 mt-8 flex items-center justify-center w-full">
                        <MotionH3 
                            key={breathingPhase} 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            className="text-2xl md:text-3xl font-black tracking-wide text-center bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-emerald-400"
                        >
                            {phaseText[breathingPhase]}
                        </MotionH3>
                    </div>
                </div>
            </MotionDiv>
        </AnimatePresence>
    );
};

export default CognitiveGuard;
