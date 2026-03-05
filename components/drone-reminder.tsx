"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { requestNotificationPermission, isNotificationsEnabled, isNotificationsSupported } from "@/lib/notifications";

export function DroneReminderButton() {
    const [isReminded, setIsReminded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if they are already tagged in localStorage
        setIsReminded(isNotificationsEnabled() && localStorage.getItem('drone-show-reminded') === 'true');
    }, []);

    const handleClick = async () => {
        if (isReminded) return;
        setIsLoading(true);

        // Check if PWA / notification conceptually supported
        if (!isNotificationsSupported()) {
            alert("Please install the App (Add to Home Screen from share menu) first to enable reminders.");
            setIsLoading(false);
            return;
        }

        // iOS and Android check if standalone
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || (navigator as any).standalone;

        // We strictly let them know if they aren't standalone
        if (!isStandalone) {
            alert("Please install the App (Add to Home Screen) and open it to set reminders.");
            setIsLoading(false);
            return;
        }

        try {
            const sub = await requestNotificationPermission();
            if (sub) {
                // Tag them on the backend
                const API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || '';
                await fetch(`${API_URL}/register-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscription: sub.toJSON(),
                        platform: 'web',
                        tags: ['drone-show']
                    }),
                });
                localStorage.setItem('drone-show-reminded', 'true');
                setIsReminded(true);
                alert("Reminder set! You'll be notified before the Drone Show.");
            } else {
                alert("Please enable notifications fully to set a reminder.");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to set reminder.");
        }
        setIsLoading(false);
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading || isReminded}
            className={`flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-full shadow-lg group-active:scale-95 transition-transform ${isReminded ? 'bg-green-500 text-white' : 'bg-brand-gold text-brand-blue'
                }`}
        >
            {isReminded ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {isReminded ? "Reminder Set" : isLoading ? "Setting..." : "Remind Me"}
        </button>
    );
}
