"use client";

import { useState, useEffect } from "react";
import { Rocket, Cloud, Play, Instagram } from "lucide-react";
import { DroneReminderButton } from "./drone-reminder";
import { motion, AnimatePresence } from "framer-motion";

export function DroneShowSection() {
    const [isShowOver, setIsShowOver] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [highlightsUrl, setHighlightsUrl] = useState("https://www.instagram.com/daawateramzaan/");

    useEffect(() => {
        setMounted(true);
        const checkTime = () => {
            // Drone show is March 6, 2026 at 9:00 PM IST
            const showEndTime = new Date("2026-03-06T21:30:00+05:30");
            const now = new Date();
            setIsShowOver(now > showEndTime);
        };

        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.droneShowHighlightsUrl) {
                        setHighlightsUrl(data.droneShowHighlightsUrl);
                    }
                }
            } catch (e) {
                console.error("Failed to load settings:", e);
            }
        };

        fetchSettings();
        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return (
        <section className="relative overflow-hidden rounded-3xl bg-white border border-brand-blue/10 mb-10 p-8 h-[300px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full mb-4" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
        </section>
    );

    return (
        <section className="mb-10 relative">
            <AnimatePresence mode="wait">
                {!isShowOver ? (
                    <motion.div
                        key="pre-show"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="relative overflow-hidden rounded-3xl bg-white border border-brand-blue/10 p-8 text-center group"
                    >
                        {/* Watercolor background - Blue splash */}
                        <div className="absolute inset-0 watercolor-texture opacity-30 bg-[#4285f4]/5" />
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-2 px-3 bg-brand-blue/5 rounded-xl border border-brand-blue/10 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered By</span>
                                    <span className="text-sm font-bold text-brand-blue">Pista House</span>
                                </div>
                                <div className="flex gap-2">
                                    <Rocket className="w-5 h-5 text-brand-blue animate-bounce" />
                                </div>
                            </div>

                            <h3 className="text-brand-blue font-black text-3xl mb-2 tracking-tighter uppercase">
                                Free <span className="text-[#4285f4]">Mega Drone</span> Show
                            </h3>

                            <div className="relative inline-block mb-6">
                                <div className="font-script text-2xl text-brand-red -rotate-6">Look up Hyderabad</div>
                                <div className="absolute -right-12 -top-4 opacity-20">
                                    <Cloud className="w-8 h-8 text-brand-blue" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-brand-gold/10 rounded-2xl p-4 border border-brand-gold/20">
                                    <div className="text-[9px] font-bold text-brand-blue/40 uppercase tracking-widest mb-1">Date</div>
                                    <div className="text-xl font-black text-brand-blue">6th March</div>
                                </div>
                                <div className="bg-brand-blue/10 rounded-2xl p-4 border border-brand-blue/20">
                                    <div className="text-[9px] font-bold text-brand-blue/40 uppercase tracking-widest mb-1">Time</div>
                                    <div className="text-xl font-black text-brand-blue">9 PM Onwards</div>
                                </div>
                            </div>

                            <DroneReminderButton />

                            <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                                Only at <span className="font-herb normal-case tracking-normal text-xs">Daawat-e-Ramzaan</span>
                            </p>
                        </div>

                        <div className="absolute top-1/4 right-0 w-24 h-px bg-gradient-to-l from-brand-gold to-transparent opacity-30 -rotate-12" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="post-show"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden rounded-3xl bg-black border border-brand-gold/30 p-8 text-center min-h-[400px] flex flex-col justify-center"
                    >
                        {/* Highlights Background */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src="/drone-highlights.png"
                                alt="Drone Show Highlights"
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        </div>

                        <div className="relative z-10 py-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold rounded-full mb-6">
                                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse" />
                                <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Show Highlights</span>
                            </div>

                            <h3 className="text-white font-black text-3xl mb-1 tracking-tight leading-none uppercase">
                                The Sky Was <br /> <span className="text-brand-gold">Aligned</span>
                            </h3>
                            <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] mb-8">
                                Relive the 100-drone spectacle
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
                                    <span className="text-lg font-black text-white">100+</span>
                                    <span className="text-[8px] uppercase font-bold tracking-tighter text-brand-gold/60">Drones</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-white">4K+</span>
                                    <span className="text-[8px] uppercase font-bold tracking-tighter text-brand-gold/60">Attendees</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-white">100%</span>
                                    <span className="text-[8px] uppercase font-bold tracking-tighter text-brand-gold/60">Magic</span>
                                </div>
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
