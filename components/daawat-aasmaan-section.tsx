"use client";

import { useState, useEffect } from "react";
import { Sparkles, MapPin, Clock, CalendarDays, Instagram } from "lucide-react";
import { InstagramEmbed } from "./instagram-embed";
import { CrescentMoon } from "./brand-elements";
import { motion, AnimatePresence } from "framer-motion";

function CountdownTimer({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isOver: false });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                return { hours: 0, minutes: 0, seconds: 0, isOver: true };
            }

            const totalSeconds = Math.floor(diff / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return { hours, minutes, seconds, isOver: false };
        };

        setTimeLeft(calculateTimeLeft());
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    if (timeLeft.isOver) return null;

    return (
        <div className="flex items-center justify-center gap-3">
            {[
                { value: timeLeft.hours, label: "HRS" },
                { value: timeLeft.minutes, label: "MIN" },
                { value: timeLeft.seconds, label: "SEC" },
            ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                    <div className="relative">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
                            <span className="text-2xl font-black text-white tabular-nums">
                                {String(item.value).padStart(2, "0")}
                            </span>
                        </div>
                    </div>
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-1.5">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function DaawatAasmaanSection() {
    const [mounted, setMounted] = useState(false);
    const [showState, setShowState] = useState<"upcoming" | "live" | "over">("upcoming");
    const [highlightsUrl, setHighlightsUrl] = useState("https://www.instagram.com/daawateramzaan/");

    // Show starts at 11 PM IST on March 13, 2026
    const showStart = new Date("2026-03-13T23:00:00+05:30");
    // Show ends at ~1:30 AM IST on March 14, 2026
    const showEnd = new Date("2026-03-14T01:30:00+05:30");

    useEffect(() => {
        setMounted(true);
        const check = () => {
            const now = new Date();
            if (now > showEnd) {
                setShowState("over");
            } else if (now >= showStart) {
                setShowState("live");
            } else {
                setShowState("upcoming");
            }
        };

        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.aasmaanHighlightsUrl) {
                        setHighlightsUrl(data.aasmaanHighlightsUrl);
                    }
                }
            } catch (e) {
                console.error("Failed to load settings:", e);
            }
        };

        fetchSettings();
        check();
        const interval = setInterval(check, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) {
        return (
            <section className="relative overflow-hidden rounded-3xl bg-[#0a0a1a] border border-indigo-500/10 mb-10 p-8 h-[420px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full mb-4" />
                    <div className="h-4 w-32 bg-white/10 rounded" />
                </div>
            </section>
        );
    }

    const isShowOver = showState === "over";

    return (
        <section className="mb-10 relative">
            <AnimatePresence mode="wait">
                {!isShowOver ? (
                    <motion.div
                        key="pre-show"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="relative overflow-hidden rounded-3xl"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src="/daawat-e-aasmaan.jpg"
                                alt="Daawat-e-Aasmaan Drone Show"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a2e] via-[#0a0a2e]/80 to-[#0a0a2e]/40" />
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 to-transparent" />
                        </div>

                        {/* Decorative floating stars */}
                        <div className="absolute top-8 left-6 w-1 h-1 bg-white rounded-full animate-pulse" />
                        <div className="absolute top-16 right-10 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse delay-300" />
                        <div className="absolute top-24 left-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-700" />
                        <div className="absolute bottom-32 right-8 w-1 h-1 bg-white rounded-full animate-pulse delay-500" />

                        {/* Content */}
                        <div className="relative z-10 p-6 pb-8">
                            {/* Header badge */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                                    <CrescentMoon className="w-3.5 h-3.5 text-yellow-300" />
                                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Tonight</span>
                                </div>
                                {showState === "live" && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 backdrop-blur-sm rounded-full border border-red-500/30">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live Now</span>
                                    </div>
                                )}
                                {showState === "upcoming" && (
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div className="text-center mb-6">
                                <h3 className="font-herb text-3xl text-white mb-1 leading-tight drop-shadow-lg">
                                    Daawat-e-Aasmaan
                                </h3>
                                <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em]">
                                    Drone Show Splendor • Frame Experience
                                </p>
                            </div>

                            {/* Countdown or Live indicator */}
                            {showState === "upcoming" && (
                                <div className="mb-6">
                                    <p className="text-center text-[9px] font-bold text-white/40 uppercase tracking-widest mb-3">
                                        Show starts in
                                    </p>
                                    <CountdownTimer targetDate={showStart} />
                                </div>
                            )}

                            {showState === "live" && (
                                <div className="mb-6 text-center">
                                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl border border-red-500/30">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-white font-bold text-sm">Show is LIVE right now!</span>
                                    </div>
                                </div>
                            )}

                            {/* Event details grid */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                                    <CalendarDays className="w-4 h-4 text-yellow-300 mx-auto mb-1.5" />
                                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-0.5">Date</div>
                                    <div className="text-sm font-black text-white">13th Mar</div>
                                    <div className="text-[9px] text-white/40 font-bold">Friday</div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                                    <Clock className="w-4 h-4 text-blue-300 mx-auto mb-1.5" />
                                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-0.5">Shows</div>
                                    <div className="text-sm font-black text-white">11 · 12 · 1</div>
                                    <div className="text-[9px] text-white/40 font-bold">PM · AM · AM</div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                                    <MapPin className="w-4 h-4 text-green-300 mx-auto mb-1.5" />
                                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-0.5">Venue</div>
                                    <div className="text-[10px] font-black text-white leading-tight">Kings Palace</div>
                                    <div className="text-[9px] text-white/40 font-bold">Function Hall</div>
                                </div>
                            </div>

                            {/* Free Entry Badge */}
                            <div className="flex justify-center mb-6">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-30 group-hover:opacity-50 transition" />
                                    <div className="relative flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2.5 rounded-full font-black text-sm shadow-lg shadow-green-900/20">
                                        <span className="text-lg">✅</span>
                                        FREE ENTRY
                                    </div>
                                </div>
                            </div>

                            {/* Instagram Post Embed */}
                            <div className="mt-2">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <div className="h-px w-6 bg-white/20" />
                                    <div className="flex items-center gap-1.5">
                                        <Instagram className="w-3 h-3 text-pink-400" />
                                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Official Announcement</span>
                                    </div>
                                    <div className="h-px w-6 bg-white/20" />
                                </div>
                                <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-1">
                                    <InstagramEmbed url="https://www.instagram.com/p/DVxhpQXge4V/" />
                                </div>
                            </div>

                            {/* Footer - Presented by Wonderla */}
                            <div className="mt-8 flex flex-col items-center gap-2">
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em]">
                                    Presented By
                                </span>
                                <img 
                                    src="/sponsors/wonderla-logo.png" 
                                    alt="Wonderla" 
                                    className="h-10 w-auto object-contain"
                                />
                                <a 
                                    href="https://www.wonderla.com/offers/ramzan-offer" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="mt-1 text-[10px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors underline underline-offset-4 decoration-yellow-400/30"
                                >
                                    Festive Ramadan Special from 20th to 29th March!
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* ── Post-Show Highlights View ── */
                    <motion.div
                        key="post-show"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden rounded-3xl bg-black border border-brand-gold/30 p-8 text-center min-h-[400px] flex flex-col justify-center"
                    >
                        {/* Highlights Background */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src="/daawat-e-aasmaan.jpg"
                                alt="Daawat-e-Aasmaan Highlights"
                                className="w-full h-full object-cover opacity-50"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
                        </div>

                        <div className="relative z-10 py-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold rounded-full mb-6">
                                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse" />
                                <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Show Highlights</span>
                            </div>

                            <h3 className="font-herb text-white text-3xl mb-1 tracking-tight leading-none">
                                Daawat-e-<span className="text-brand-gold">Aasmaan</span>
                            </h3>
                            <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] mb-8">
                                Relive the magic of the sky
                            </p>

                            <a
                                href={highlightsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-sm transition-all hover:bg-brand-gold active:scale-95 shadow-2xl shadow-brand-gold/20"
                            >
                                <Instagram className="w-5 h-5 text-[#E1306C]" />
                                WATCH HIGHLIGHTS
                                <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:scale-110 group-hover:opacity-0 transition-all duration-500" />
                            </a>

                            <div className="mt-8 flex justify-center gap-4 text-white/40">
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-white">3</span>
                                    <span className="text-[8px] uppercase font-bold tracking-tighter text-brand-gold/60">Shows</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-white">FREE</span>
                                    <span className="text-[8px] uppercase font-bold tracking-tighter text-brand-gold/60">Entry</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-white">100%</span>
                                    <span className="text-[8px] uppercase font-bold tracking-tighter text-brand-gold/60">Magic</span>
                                </div>
                            </div>

                            {/* Wonderla Branding */}
                            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-2">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">
                                    Presented By
                                </span>
                                <img 
                                    src="/sponsors/wonderla-logo.png" 
                                    alt="Wonderla" 
                                    className="h-8 w-auto object-contain"
                                />
                            </div>
                        </div>

                        {/* Floating ambient lights */}
                        <div className="absolute top-10 left-10 w-1 h-1 bg-blue-400 rounded-full blur-[1px] animate-pulse" />
                        <div className="absolute bottom-20 right-12 w-1.5 h-1.5 bg-brand-gold rounded-full blur-[1px] animate-pulse delay-700" />
                        <div className="absolute top-1/2 left-4 w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse delay-300" />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
