"use client";

import { useState, useEffect } from "react";
import timetableData from "@/data/timetable.json";
import { Clock, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function TimetableCard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeDayIndex, setActiveDayIndex] = useState(0);
    const [countdown, setCountdown] = useState("");
    const [nextEvent, setNextEvent] = useState<"suhoor" | "iftar" | null>(null);

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

        // Determine if next event is Suhoor or Iftar
        const todayData = timetableData[currentIndex];

        // Construct Date objects for today's suhoor and iftar
        const suhoorTime = new Date(`${todayData.fullDate}T${todayData.suhoor}`);
        const iftarTime = new Date(`${todayData.fullDate}T${todayData.iftar}`);

        let targetTime: Date | null = null;
        let eventType: "suhoor" | "iftar" | null = null;

        if (now < suhoorTime) {
            targetTime = suhoorTime;
            eventType = "suhoor";
        } else if (now < iftarTime) {
            targetTime = iftarTime;
            eventType = "iftar";
        } else {
            // It's past Iftar today, look at tomorrow's Suhoor if available
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
            } else {
                setCountdown("Time's up!");
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

                <p className="text-[10px] text-center text-white/40 mt-4 uppercase tracking-[0.2em] font-medium">Times based on Hyderabad (Hanafi)</p>
            </div>
        </motion.div>
    );
}
