"use client";

import { useState, useEffect } from "react";

// Admin pages navigate via full-page <a> links, so React state is wiped on
// every navigation/refresh. Persist the verified password in sessionStorage
// (per-tab, cleared when the tab closes) and re-verify it on load so admins
// aren't re-prompted on every page. Same security posture as before — the
// password is still only a bearer token sent from the client.
const STORAGE_KEY = "der_admin_pw";

export function useAdminAuth() {
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginError, setLoginError] = useState(false);
    const [ready, setReady] = useState(false);

    // On mount, rehydrate from sessionStorage and confirm the password is
    // still valid (it may have been rotated on the server).
    useEffect(() => {
        const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
        if (!stored) {
            setReady(true);
            return;
        }
        setPassword(stored);
        fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: stored }),
        })
            .then((res) => {
                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    sessionStorage.removeItem(STORAGE_KEY);
                }
            })
            .catch(() => { /* offline — leave unauthenticated */ })
            .finally(() => setReady(true));
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(false);
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            if (res.ok) {
                sessionStorage.setItem(STORAGE_KEY, password);
                setIsAuthenticated(true);
            } else {
                setLoginError(true);
            }
        } catch (e) {
            console.error(e);
            alert("Connection error check your server");
        }
    };

    const logout = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setPassword("");
        setIsAuthenticated(false);
    };

    return { password, setPassword, isAuthenticated, loginError, handleLogin, logout, ready };
}
