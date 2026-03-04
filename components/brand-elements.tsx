"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Charminar SVG silhouette inspired by the Daawat E Ramzaan logo
function CharminarIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 200 260" className={className} fill="currentColor">
            {/* Base arch */}
            <path d="M30 260 L30 140 Q30 120 50 120 L80 120 L80 160 Q100 130 120 160 L120 120 L150 120 Q170 120 170 140 L170 260 Z" opacity="0.9" />
            {/* Central arch */}
            <path d="M70 260 L70 180 Q100 150 130 180 L130 260 Z" fill="white" opacity="0.15" />
            {/* Left minaret */}
            <rect x="15" y="80" width="16" height="180" rx="3" />
            <circle cx="23" cy="75" r="10" />
            <path d="M23 30 L18 65 L28 65 Z" />
            <circle cx="23" cy="28" r="4" />
            {/* Right minaret */}
            <rect x="169" y="80" width="16" height="180" rx="3" />
            <circle cx="177" cy="75" r="10" />
            <path d="M177 30 L172 65 L182 65 Z" />
            <circle cx="177" cy="28" r="4" />
            {/* Central dome */}
            <path d="M75 120 Q100 60 125 120" />
            <circle cx="100" cy="58" r="5" />
            <path d="M100 25 L97 53 L103 53 Z" />
            <circle cx="100" cy="22" r="3" />
            {/* Small domes */}
            <path d="M50 120 Q65 95 80 120" />
            <path d="M120 120 Q135 95 150 120" />
        </svg>
    );
}

// Islamic geometric tile pattern - inspired by the blue & gold tiles in the poster
function IslamicTilePattern({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="islamicTile" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                    {/* 8-pointed star */}
                    <polygon points="25,5 30,20 45,25 30,30 25,45 20,30 5,25 20,20" fill="#2b5ea7" opacity="0.12" />
                    {/* Corner decorations */}
                    <circle cx="0" cy="0" r="8" fill="#e8c840" opacity="0.08" />
                    <circle cx="50" cy="0" r="8" fill="#e8c840" opacity="0.08" />
                    <circle cx="0" cy="50" r="8" fill="#e8c840" opacity="0.08" />
                    <circle cx="50" cy="50" r="8" fill="#e8c840" opacity="0.08" />
                    {/* Diamond accents */}
                    <polygon points="25,0 30,5 25,10 20,5" fill="#2b5ea7" opacity="0.06" />
                    <polygon points="0,25 5,30 0,35" fill="#2b5ea7" opacity="0.06" />
                    <polygon points="50,25 45,30 50,35" fill="#2b5ea7" opacity="0.06" />
                    <polygon points="25,50 30,45 25,40 20,45" fill="#2b5ea7" opacity="0.06" />
                </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#islamicTile)" />
        </svg>
    );
}

// Decorative crescent moon
function CrescentMoon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 60 60" className={className} fill="currentColor">
            <path d="M30 5 C15 5 5 18 5 30 C5 42 15 55 30 55 C20 50 15 40 15 30 C15 20 20 10 30 5 Z" />
            <circle cx="38" cy="12" r="3" />
        </svg>
    );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 300),   // Show sponsors top
            setTimeout(() => setPhase(2), 900),   // Show DER logo
            setTimeout(() => setPhase(3), 1600),  // Show Season badge + bottom sponsors
            setTimeout(() => setPhase(4), 3200),  // Fade out
            setTimeout(() => onComplete(), 3900), // Complete
        ];
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {phase < 4 && (
                <motion.div
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden py-10"
                    style={{ background: "linear-gradient(180deg, #fdfaf5 0%, #f0ebe0 50%, #e8e0d0 100%)" }}
                >
                    {/* Islamic tile pattern background */}
                    <div className="absolute inset-0 opacity-30">
                        <IslamicTilePattern className="w-full h-full" />
                    </div>

                    {/* Corner tile decorations */}
                    <motion.div
                        initial={{ opacity: 0, x: -30, y: -30 }}
                        animate={{ opacity: 0.15, x: 0, y: 0 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="absolute top-0 left-0 w-40 h-40"
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <polygon points="0,0 60,0 0,60" fill="#2b5ea7" />
                            <polygon points="0,0 40,0 0,40" fill="#e8c840" opacity="0.5" />
                        </svg>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30, y: -30 }}
                        animate={{ opacity: 0.15, x: 0, y: 0 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="absolute top-0 right-0 w-40 h-40"
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <polygon points="100,0 40,0 100,60" fill="#2b5ea7" />
                            <polygon points="100,0 60,0 100,40" fill="#e8c840" opacity="0.5" />
                        </svg>
                    </motion.div>

                    {/* Crescent moon accent */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={phase >= 2 ? { opacity: 0.12, y: 0 } : {}}
                        transition={{ duration: 1 }}
                        className="absolute top-20 right-16 text-brand-gold"
                    >
                        <CrescentMoon className="w-12 h-12" />
                    </motion.div>

                    {/* ── TOP: Title Sponsor + Powered By ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10 flex flex-col items-center gap-5 w-full px-8 pt-4"
                    >
                        {/* Title Sponsor */}
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-brand-gold/80 uppercase tracking-widest mb-2">Title Sponsor</span>
                            <img src="/ahmed-al-maghribi-logo.png" alt="Ahmed Al Maghribi" className="h-16 w-auto object-contain" />
                        </div>
                        {/* Divider */}
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-px bg-brand-blue/10" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Powered By</span>
                            <div className="flex-1 h-px bg-brand-blue/10" />
                        </div>
                        {/* Priya Foods */}
                        <img src="/priya-logo.svg" alt="Priya Foods" className="h-10 w-auto object-contain opacity-80" />
                    </motion.div>

                    {/* ── CENTER: DER Logo ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.88 }}
                        animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : {}}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="relative z-10 flex flex-col items-center gap-3"
                    >
                        <img
                            src="/der-logo.svg"
                            alt="Daawat-e-Ramzaan"
                            className="w-56 h-auto drop-shadow-lg"
                        />
                        <div className="px-4 py-1.5 bg-brand-blue/5 rounded-full border border-brand-blue/10">
                            <span className="text-[10px] font-bold text-brand-blue/60 tracking-widest uppercase">
                                Season 5 • Hyderabad
                            </span>
                        </div>
                    </motion.div>

                    {/* ── BOTTOM: All Other Sponsors ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="relative z-10 w-full px-8 flex flex-col items-center gap-3"
                    >
                        {/* Loading bar */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 80 }}
                            transition={{ delay: 0.3, duration: 1.2, ease: "easeInOut" }}
                            className="h-0.5 bg-gradient-to-r from-brand-blue via-brand-gold to-brand-red rounded-full mb-1"
                        />

                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Our Partners</span>

                        {/* Row 1: Heerabhai + SBI */}
                        <div className="flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center gap-0.5">
                                <img src="/heerabhai-logo.svg" alt="Heerabhai" className="h-7 w-auto object-contain opacity-70" />
                                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Jewellery</span>
                            </div>
                            <div className="w-px h-8 bg-brand-blue/10" />
                            <div className="flex flex-col items-center gap-0.5">
                                <img src="/sbi-logo.svg" alt="SBI" className="h-7 w-auto object-contain opacity-70" />
                                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Associate</span>
                            </div>
                        </div>

                        {/* Row 2: Farmaan + Gold Drop */}
                        <div className="flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center gap-0.5">
                                <img src="/farmaan-logo.svg" alt="Farmaan" className="h-7 w-auto object-contain opacity-70" />
                                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Associate</span>
                            </div>
                            <div className="w-px h-8 bg-brand-blue/10" />
                            <div className="flex flex-col items-center gap-0.5">
                                <img src="/golddrop-logo.png" alt="Gold Drop" className="h-7 w-auto object-contain opacity-70" />
                                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Associate</span>
                            </div>
                        </div>

                        {/* Row 3: Uber + Telangana Tourism */}
                        <div className="flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-black font-bold text-base tracking-tight" style={{ fontFamily: "'UberMove', sans-serif" }}>Uber</span>
                                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Mobility</span>
                            </div>
                            <div className="w-px h-8 bg-brand-blue/10" />
                            <div className="flex flex-col items-center gap-0.5">
                                <img src="/tg-toursim.svg" alt="Telangana Tourism" className="h-7 w-auto object-contain opacity-70" />
                                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">Tourism</span>
                            </div>
                        </div>
                    </motion.div>

                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Reusable brand decoration components

export function IslamicBorder({ className }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <svg viewBox="0 0 400 20" className="w-full h-5" preserveAspectRatio="none">
                <defs>
                    <pattern id="borderPattern" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                        <polygon points="20,0 25,10 20,20 15,10" fill="#2b5ea7" opacity="0.15" />
                        <circle cx="0" cy="10" r="3" fill="#e8c840" opacity="0.2" />
                        <circle cx="40" cy="10" r="3" fill="#e8c840" opacity="0.2" />
                    </pattern>
                </defs>
                <rect width="400" height="20" fill="url(#borderPattern)" />
            </svg>
        </div>
    );
}

export function TileMosaicStrip() {
    const tiles = Array.from({ length: 8 }, (_, i) => i);
    return (
        <div className="flex gap-1.5 overflow-hidden py-2">
            {tiles.map(i => (
                <div
                    key={i}
                    className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{
                        backgroundColor: i % 2 === 0 ? "#2b5ea710" : "#e8c84015",
                        border: `1px solid ${i % 2 === 0 ? "#2b5ea715" : "#e8c84020"}`,
                    }}
                >
                    <svg viewBox="0 0 30 30" className="w-6 h-6">
                        {i % 3 === 0 ? (
                            <polygon points="15,3 18,12 27,15 18,18 15,27 12,18 3,15 12,12" fill={i % 2 === 0 ? "#2b5ea7" : "#e8c840"} opacity="0.3" />
                        ) : i % 3 === 1 ? (
                            <circle cx="15" cy="15" r="8" fill="none" stroke={i % 2 === 0 ? "#2b5ea7" : "#e8c840"} strokeWidth="1.5" opacity="0.3" />
                        ) : (
                            <polygon points="15,5 25,15 15,25 5,15" fill="none" stroke={i % 2 === 0 ? "#2b5ea7" : "#e8c840"} strokeWidth="1.5" opacity="0.3" />
                        )}
                    </svg>
                </div>
            ))}
        </div>
    );
}

export { CharminarIcon, CrescentMoon, IslamicTilePattern };
