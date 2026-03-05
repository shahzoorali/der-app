"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, X, Share, Plus, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types for the BeforeInstallPromptEvent (not in standard TS lib)
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    prompt(): Promise<void>;
}

/**
 * Detect if the app is running as an installed PWA (standalone mode)
 */
function isRunningAsPWA(): boolean {
    if (typeof window === "undefined") return false;

    // Check display-mode media query (works on both Android & iOS)
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;

    // iOS Safari standalone check
    if ((navigator as unknown as { standalone?: boolean }).standalone === true) return true;

    // Check if launched from TWA (Trusted Web Activity)
    if (document.referrer.includes("android-app://")) return true;

    return false;
}

/**
 * Detect iOS (iPhone, iPad, iPod)
 */
function isIOS(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Detect if running in Safari
 */
function isSafari(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    return /^((?!chrome|android).)*safari/i.test(ua);
}

/**
 * PWA Install Button for the Navbar
 * - Android/Chrome: Shows native install prompt
 * - iOS/Safari: Shows instructions modal
 * - Already installed PWA: Hidden
 */
export function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showIOSModal, setShowIOSModal] = useState(false);
    const [isPWA, setIsPWA] = useState(true); // default true to avoid flash
    const [isInstalling, setIsInstalling] = useState(false);
    const [justInstalled, setJustInstalled] = useState(false);

    useEffect(() => {
        // Detect if already running as PWA
        setIsPWA(isRunningAsPWA());

        // Listen for the beforeinstallprompt event (Chrome, Edge, Samsung Internet, etc.)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setJustInstalled(true);
            setTimeout(() => setIsPWA(true), 2000); // Hide button after showing confirmation
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = useCallback(async () => {
        if (isIOS()) {
            // iOS — show instructions modal
            setShowIOSModal(true);
            return;
        }

        if (deferredPrompt) {
            // Android/Chrome — trigger native install prompt
            setIsInstalling(true);
            try {
                await deferredPrompt.prompt();
                const choiceResult = await deferredPrompt.userChoice;
                if (choiceResult.outcome === "accepted") {
                    setDeferredPrompt(null);
                }
            } catch (err) {
                console.error("Install prompt error:", err);
            }
            setIsInstalling(false);
        }
    }, [deferredPrompt]);

    // Don't render if running as PWA
    if (isPWA) return null;

    // Show confirmation after install
    if (justInstalled) {
        return (
            <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] bg-green-500/20 text-green-100 px-2 py-0.5 rounded-full border border-green-400/30 font-medium flex items-center gap-1"
            >
                ✓ Installed
            </motion.span>
        );
    }

    return (
        <>
            <motion.button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex items-center gap-1.5 text-[10px] bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full border border-brand-gold/30 font-bold hover:bg-brand-gold/30 active:scale-95 transition-all disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                aria-label="Install App"
                id="pwa-install-button"
            >
                <Download className="w-3 h-3" />
                {isInstalling ? "INSTALLING..." : "INSTALL APP"}
            </motion.button>

            {/* iOS Instructions Modal */}
            <IOSInstallModal
                isOpen={showIOSModal}
                onClose={() => setShowIOSModal(false)}
            />
        </>
    );
}

/**
 * iOS Install Instructions Modal
 * Shows step-by-step guide to add the app to home screen
 */
function IOSInstallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const isSafariBrowser = isSafari();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[10000] max-w-md mx-auto"
                    >
                        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden">
                            {/* Header gradient */}
                            <div className="h-1 bg-gradient-to-r from-brand-blue via-brand-gold to-brand-red" />

                            <div className="p-6">
                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>

                                {/* App icon */}
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-brand-blue/10">
                                        <img
                                            src="/der-small.png"
                                            alt="Daawat E Ramzaan"
                                            className="w-full h-full object-contain bg-white p-1"
                                        />
                                    </div>
                                </div>

                                <h2 className="text-center font-bold text-brand-blue text-lg mb-1">
                                    Install Daawat-E-Ramzaan
                                </h2>
                                <p className="text-center text-xs text-gray-400 mb-6">
                                    Add to your home screen for the full app experience
                                </p>

                                {/* Steps */}
                                <div className="space-y-4">
                                    {!isSafariBrowser ? (
                                        /* Not Safari - instruct to open in Safari first */
                                        <>
                                            <StepItem
                                                stepNumber={1}
                                                title="Open in Safari"
                                                description="Copy this page URL and open it in Safari browser"
                                                icon={<span className="text-lg">🧭</span>}
                                            />
                                            <StepItem
                                                stepNumber={2}
                                                title="Tap the Share button"
                                                description="Tap the share icon at the bottom of Safari"
                                                icon={<Share className="w-5 h-5 text-brand-blue" />}
                                            />
                                            <StepItem
                                                stepNumber={3}
                                                title='Tap "Add to Home Screen"'
                                                description='Scroll down and tap "Add to Home Screen"'
                                                icon={<Plus className="w-5 h-5 text-brand-blue" />}
                                            />
                                        </>
                                    ) : (
                                        /* Already in Safari */
                                        <>
                                            <StepItem
                                                stepNumber={1}
                                                title="Tap the Share button"
                                                description={
                                                    <>
                                                        Tap the <Share className="w-3.5 h-3.5 inline text-brand-blue" /> share icon at the bottom of your screen
                                                    </>
                                                }
                                                icon={<ArrowUp className="w-5 h-5 text-brand-blue" />}
                                            />
                                            <StepItem
                                                stepNumber={2}
                                                title='Select "Add to Home Screen"'
                                                description="Scroll down in the share menu and tap it"
                                                icon={<Plus className="w-5 h-5 text-brand-blue" />}
                                            />
                                            <StepItem
                                                stepNumber={3}
                                                title='Tap "Add"'
                                                description="Confirm by tapping Add in the top-right"
                                                icon={<span className="text-lg">✅</span>}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Bottom note */}
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <p className="text-[10px] text-gray-400 text-center font-medium">
                                        The app will appear on your home screen with the{" "}
                                        <span className="text-brand-blue font-bold">DER</span> icon
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function StepItem({
    stepNumber,
    title,
    description,
    icon,
}: {
    stepNumber: number;
    title: string;
    description: React.ReactNode;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-brand-blue/5 rounded-xl flex items-center justify-center border border-brand-blue/10">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-brand-blue text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        {stepNumber}
                    </span>
                    <h4 className="font-bold text-brand-blue text-sm">{title}</h4>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 ml-7">{description}</p>
            </div>
        </div>
    );
}
