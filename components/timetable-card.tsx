"use client";

import { useState, useEffect, useRef } from "react";
import timetableData from "@/data/timetable.json";
import { Clock, Moon, Sun, Volume2, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";

export function TimetableCard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeDayIndex, setActiveDayIndex] = useState(0);
    const [countdown, setCountdown] = useState("");
    const [nextEvent, setNextEvent] = useState<"suhoor" | "iftar" | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    };

    useEffect(() => {
        // Update current time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Calculate the active day and the next event
        let currentIndex = 0;
        const now = currentTime;

        // Find today's date in the timetable (or use the closest logical day if before/after Ramadan)
        const todayStr = now.toISOString().split("T")[0];
        const index = timetableData.findIndex((d) => d.fullDate === todayStr);

        if (index !== -1) {
            currentIndex = index;
        } else if (now < new Date(timetableData[0].fullDate)) {
            currentIndex = 0; // Before Ramadan, show day 1
        } else if (now > new Date(timetableData[timetableData.length - 1].fullDate)) {
            currentIndex = timetableData.length - 1; // After Ramadan, show last day
        }

        setActiveDayIndex(currentIndex);

        // Determine if next event is Suhoor or Iftar (with 10min buffer)
        const todayData = timetableData[currentIndex];
        const BUFFER_MS = 10 * 60 * 1000; // 10 minutes buffer

        const suhoorTime = new Date(`${todayData.fullDate}T${todayData.suhoor}`);
        const iftarTime = new Date(`${todayData.fullDate}T${todayData.iftar}`);

        let targetTime: Date | null = null;
        let eventType: "suhoor" | "iftar" | null = null;

        // Current time with buffer subtraction for event switching logic
        // This keeps the 'suhoor' event active until 10 mins after suhoorTime
        if (now < new Date(suhoorTime.getTime() + BUFFER_MS)) {
            targetTime = suhoorTime;
            eventType = "suhoor";
        } else if (now < new Date(iftarTime.getTime() + BUFFER_MS)) {
            targetTime = iftarTime;
            eventType = "iftar";
        } else {
            if (currentIndex + 1 < timetableData.length) {
                const tomorrowData = timetableData[currentIndex + 1];
                targetTime = new Date(`${tomorrowData.fullDate}T${tomorrowData.suhoor}`);
                eventType = "suhoor";
            }
        }

        setNextEvent(eventType);

        // Calculate countdown
        if (targetTime) {
            const diffMs = targetTime.getTime() - now.getTime();
            if (diffMs > 0) {
                const h = Math.floor(diffMs / (1000 * 60 * 60));
                const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diffMs % (1000 * 60)) / 1000);

                const formatNum = (num: number) => num.toString().padStart(2, '0');

                if (h > 0) {
                    setCountdown(`${h}h ${formatNum(m)}m ${formatNum(s)}s`);
                } else {
                    setCountdown(`${formatNum(m)}m ${formatNum(s)}s`);
                }
            } else if (diffMs > -BUFFER_MS) {
                // Within 10 mins after the event
                setCountdown("Time's up!");
            } else {
                setCountdown("Ramadan Mubarak");
            }
        } else {
            setCountdown("Ramadan Mubarak");
        }

    }, [currentTime]);

    const activeData = timetableData[activeDayIndex] || timetableData[0];

    // Helper to format 24h time to 12h AM/PM for display
    const format12H = (time24: string) => {
        const [hours, minutes] = time24.split(":");
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 || 12;
        return `${displayH}:${minutes} ${ampm}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 mt-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-blue-900 border border-brand-blue/10 shadow-lg text-white p-6"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-24 h-24" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-brand-gold">Ramadan 1447</h3>
                        <p className="text-sm text-white/70">Day {activeData.day} • {activeData.dateStr}</p>
                    </div>
                    {nextEvent && (
                        <div className="text-right">
                            <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold block mb-1">
                                Time to {nextEvent === "suhoor" ? "Fast" : "Open Fast"}
                            </span>
                            <div className="text-2xl font-mono font-bold tracking-tight bg-white/10 px-3 py-1 rounded-lg tabular-nums">
                                {countdown}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border ${nextEvent === "suhoor" ? "bg-brand-gold text-brand-blue border-brand-gold scale-105 shadow-lg" : "bg-white/5 border-white/10 text-white"} transition-all`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Sun className={`w-4 h-4 ${nextEvent === "suhoor" ? "text-brand-blue" : "text-brand-gold"}`} />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Suhoor</span>
                        </div>
                        <div className="text-2xl font-black">{format12H(activeData.suhoor)}</div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${nextEvent === "iftar" ? "bg-brand-gold text-brand-blue border-brand-gold scale-105 shadow-lg" : "bg-white/5 border-white/10 text-white"} transition-all`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Moon className={`w-4 h-4 ${nextEvent === "iftar" ? "text-brand-blue" : "text-brand-gold"}`} />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Iftar</span>
                        </div>
                        <div className="text-2xl font-black">{format12H(activeData.iftar)}</div>
                    </div>
                </div>

                {/* Dua Section */}
                {nextEvent === "suhoor" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 rounded-2xl bg-white/10 border border-white/10 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-brand-gold/10 rounded-full blur-2xl -mr-8 -mt-8" />
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="text-[10px] text-brand-gold font-bold uppercase tracking-[0.2em]">Dua for Suhoor</div>
                            <button
                                onClick={toggleAudio}
                                className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold hover:bg-brand-gold hover:text-brand-blue transition-colors outline-none"
                            >
                                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>
                            <audio
                                ref={audioRef}
                                src="/audio/suhoor.mp3"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnded={() => setIsPlaying(false)}
                            />
                        </div>
                        <div className="text-2xl mb-4 leading-loose font-medium font-arabic" dir="rtl">وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ</div>
                        <div className="text-xs font-bold text-white mb-2 italic px-2">"Wa bisawmi ghadinn nawaiytu min shahri Ramadan"</div>
                        <div className="text-[10px] text-white/60 leading-relaxed font-medium">“I intend to keep the fast for tomorrow in the month of Ramadan.”</div>
                    </motion.div>
                )}

                {nextEvent === "iftar" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 rounded-2xl bg-white/10 border border-white/10 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-brand-gold/10 rounded-full blur-2xl -mr-8 -mt-8" />
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="text-[10px] text-brand-gold font-bold uppercase tracking-[0.2em]">Dua for Iftar</div>
                            <button
                                onClick={toggleAudio}
                                className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold hover:bg-brand-gold hover:text-brand-blue transition-colors outline-none"
                            >
                                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>
                            <audio
                                ref={audioRef}
                                src="/audio/iftar.mp3"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnded={() => setIsPlaying(false)}
                            />
                        </div>
                        <div className="text-lg mb-1 leading-relaxed opacity-80 font-arabic" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
                        <div className="text-xl mb-4 leading-loose font-medium font-arabic" dir="rtl">اللَّهُمَّ لَكَ صُمْتُ وَ عَلَى رِزْقِكَ أَفْطَرْتُ وَ عَلَيْكَ تَوَكَّلْتُ</div>
                        <div className="text-xs font-bold text-white mb-2 italic px-2">"Allaahumma Laka S'umtu Wa A'laa Rizqika Aft'artuwa A'layka Tawawkkaltu"</div>
                        <div className="text-[10px] text-white/60 leading-relaxed font-medium px-4">“O my Allah, for Thee, I fast, and with the food Thou gives me I break the fast, and I rely on Thee.”</div>
                    </motion.div>
                )}

                <p className="text-[10px] text-center text-white/40 mt-5 uppercase tracking-[0.3em] font-medium">Times based on Hyderabad (Hanafi)</p>
            </div>
        </motion.div>
    );
}
