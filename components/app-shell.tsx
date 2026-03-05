"use client";

import { useState, useCallback } from "react";
import { SplashScreen } from "@/components/brand-elements";
import { NotificationPrompt } from "@/components/notification-prompt";

export function AppShell({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashComplete = useCallback(() => {
        setShowSplash(false);
    }, []);

    return (
        <>
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <div className={showSplash ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
                {children}
            </div>
            {!showSplash && <NotificationPrompt />}
        </>
    );
}
