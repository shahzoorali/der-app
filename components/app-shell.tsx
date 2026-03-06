"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "@/components/brand-elements";
import { NotificationPrompt } from "@/components/notification-prompt";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashComplete = useCallback(() => {
        setShowSplash(false);
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(err => console.error("SW registration failed", err));
        }
    }, []);

    return (
        <>
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <div className={showSplash ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
                {children}
            </div>
            {!showSplash && pathname !== '/register' && <NotificationPrompt />}
        </>
    );
}
