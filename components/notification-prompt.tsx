"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    requestNotificationPermission,
    isNotificationsEnabled,
    isNotificationsSupported,
} from "@/lib/notifications";

/**
 * NotificationPrompt
 * 
 * Behavior:
 * 1. If notifications are already enabled → never shows
 * 2. If browser permission is "denied" → never shows (user blocked at OS level)
 * 3. First visit, never interacted → shows after 5 seconds
 * 4. User dismissed without enabling (clicked "Later") → shows again on NEXT visit (session-based)
 * 5. If notifications neither enabled nor disabled and user visits again → shows the prompt
 */
export function NotificationPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Don't show if not supported
        if (!isNotificationsSupported()) return;

        // Don't show if already enabled
        if (isNotificationsEnabled()) return;

        // Don't show if the browser permission was explicitly denied (blocked at OS/browser level)
        if (typeof Notification !== "undefined" && Notification.permission === "denied") return;

        // Check visit & dismiss history
        const dismissedInSession = sessionStorage.getItem("der-notification-dismissed-session");
        const dismissed = localStorage.getItem("der-notification-dismissed");
        const visitCount = parseInt(localStorage.getItem("der-notification-visit-count") || "0", 10);

        // Increment visit count on each new session
        if (!sessionStorage.getItem("der-notification-session-tracked")) {
            sessionStorage.setItem("der-notification-session-tracked", "true");
            localStorage.setItem("der-notification-visit-count", String(visitCount + 1));
        }

        // If dismissed in THIS session, don't show again in this session
        if (dismissedInSession) return;

        // If user dismissed previously (in a past session), show again on this visit
        // The key difference: we use sessionStorage to track per-session dismissal
        // and localStorage to know they've been prompted before

        // If notifications are in "default" state (never accepted/denied) and user has visited before
        // OR if the user dismissed in a previous session → show the prompt
        const shouldShow =
            Notification.permission === "default" || // Never asked at browser level
            (dismissed && !dismissedInSession); // Dismissed before, but new session

        if (shouldShow) {
            // Show after a 5-second delay for first visit, 3-second delay for returning users
            const delay = dismissed ? 3000 : 5000;
            const timer = setTimeout(() => setShowPrompt(true), delay);
            return () => clearTimeout(timer);
        }
    }, []);

    async function handleEnable() {
        setIsLoading(true);
        try {
            const subscription = await requestNotificationPermission();
            if (subscription) {
                // Success — clear all dismiss records
                localStorage.removeItem("der-notification-dismissed");
                sessionStorage.removeItem("der-notification-dismissed-session");
                setShowPrompt(false);
            } else {
                // Permission denied or failed — treat as dismiss
                handleDismiss();
            }
        } catch (error) {
            console.error("Failed to enable notifications:", error);
        }
        setIsLoading(false);
    }

    function handleDismiss() {
        // Mark dismissed for this session (won't show again until next visit)
        sessionStorage.setItem("der-notification-dismissed-session", "true");
        // Mark dismissed with timestamp (will trigger re-prompt on next session/visit)
        localStorage.setItem("der-notification-dismissed", new Date().toISOString());
        setShowPrompt(false);
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-20 left-4 right-4 z-[999] max-w-sm mx-auto"
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-brand-blue/10 p-5 relative overflow-hidden">
                        {/* Decorative gradient bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue via-brand-gold to-brand-red" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center">
                                <Bell className="w-6 h-6 text-brand-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-brand-blue text-sm">
                                    Stay Updated! 🌙
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Get reminders for Suhoor & Iftar times, plus live event updates.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleEnable}
                                disabled={isLoading}
                                className="flex-1 py-2.5 px-4 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? "Enabling..." : "Enable Notifications"}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="py-2.5 px-4 text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
