"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NotificationPrompt } from "@/components/notification-prompt";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(err => console.error("SW registration failed", err));
        }
    }, []);

    return (
        <>
            {children}
            {pathname !== '/register' && <NotificationPrompt />}
        </>
    );
}
