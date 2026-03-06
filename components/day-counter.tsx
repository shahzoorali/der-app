"use client";

import { useState, useEffect } from "react";

export function DayCounter() {
    const [day, setDay] = useState<number>(0);

    useEffect(() => {
        const calculateDay = () => {
            const now = new Date();
            const start = new Date("2026-03-05T18:00:00+05:30");

            if (now < start) {
                setDay(0);
                return;
            }

            const msInDay = 24 * 60 * 60 * 1000;
            const hours = now.getHours();

            // Use the base calendar day diff from March 5th
            const startDate = new Date(2026, 2, 5); // March 5
            const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dayDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / msInDay);

            let currentDay = dayDiff;
            // Operational logic:
            // 6 PM to 4 AM is the live window.
            // If before 4 AM, we are still on the 'day' that started yesterday.
            // If after 6 PM, we have started a 'day'.
            // If between 4 AM and 6 PM, 'day' is the one that just completed.
            if (hours >= 18) {
                currentDay = dayDiff + 1;
            } else if (hours < 4) {
                currentDay = dayDiff;
            } else {
                currentDay = dayDiff;
            }

            setDay(Math.max(0, Math.min(14, currentDay)));
        };

        calculateDay();
        const interval = setInterval(calculateDay, 60000);
        return () => clearInterval(interval);
    }, []);

    if (day === 0) return null;

    return (
        <div className="flex justify-center mb-6 -mt-4">
            <span className="bg-brand-blue/5 text-brand-blue/40 text-[10px] font-bold uppercase tracking-[0.4em] px-4 py-1.5 rounded-full border border-brand-blue/5">
                Day {day}/14
            </span>
        </div>
    );
}
