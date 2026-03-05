"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    requestNotificationPermission,
    isNotificationsEnabled,
    isNotificationsSupported,
} from "@/lib/notifications";

export function NotificationPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Don't show if already enabled, dismissed, or not supported
        if (!isNotificationsSupported()) return;
        if (isNotificationsEnabled()) return;

        const dismissed = localStorage.getItem("der-notification-dismissed");
        if (dismissed) {
            // Check if it was dismissed more than 3 days ago — ask again
            const dismissedAt = new Date(dismissed).getTime();
            const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedAt < threeDaysMs) return;
        }

        // Show after a 5-second delay
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    async function handleEnable() {
        setIsLoading(true);
        try {
            const subscription = await requestNotificationPermission();
            if (subscription) {
                setShowPrompt(false);
            } else {
                // Permission denied or failed
                setShowPrompt(false);
            }
        } catch (error) {
            console.error("Failed to enable notifications:", error);
        }
        setIsLoading(false);
    }

    function handleDismiss() {
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
