"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, ShoppingBag, Ticket, Bell, Camera } from "lucide-react";
import { CharminarIcon } from "./brand-elements";
import { PWAInstallButton } from "./pwa-install";
import { motion } from "framer-motion";

const navItems = [
    { icon: CharminarIcon, label: "Home", href: "/" },
    // { icon: Map, label: "Map", href: "/map" },
    { icon: Camera, label: "Immerse", href: "/immerse" },
    { icon: ShoppingBag, label: "Bazaar", href: "/bazaar" },
    // { icon: Ticket, label: "Tickets", href: "/tickets" },
    { icon: Bell, label: "Updates", href: "/updates" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-brand-blue/10 px-6 py-3 flex justify-between items-center z-50">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-1 relative"
                    >
                        <Icon
                            className={`w-6 h-6 transition-colors ${isActive ? "text-brand-blue" : "text-gray-400"
                                }`}
                        />
                        <span
                            className={`text-[10px] font-medium transition-colors ${isActive ? "text-brand-blue" : "text-gray-400"
                                }`}
                        >
                            {item.label}
                        </span>
                        {isActive && (
                            <motion.div
                                layoutId="active-pill"
                                className="absolute -top-1 w-1 h-1 bg-brand-gold rounded-full"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

export function Navbar() {
    return (
        <header className="sticky top-0 z-40 w-full bg-brand-blue px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
                <h1 className="text-white font-herb text-xl font-normal tracking-tight">
                    Daawat-E-Ramzaan
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <PWAInstallButton />
            </div>
        </header>
    );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen pb-24 bg-brand-cream/30 relative">
            <div className="absolute inset-0 watercolor-texture" />
            <div className="relative z-10 px-6 py-6 max-w-md mx-auto">
                {children}
            </div>
        </main>
    );
}
