"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";

export default function WhatsappQrAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(false);

    const [qr, setQr] = useState<string | null>(null);
    const [connected, setConnected] = useState<boolean | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStatus();
            pollRef.current = setInterval(fetchStatus, 3000);
            return () => {
                if (pollRef.current) clearInterval(pollRef.current);
            };
        }
    }, [isAuthenticated]);

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
                setIsAuthenticated(true);
            } else {
                setLoginError(true);
            }
        } catch (e) {
            console.error(e);
            alert("Connection error check your server");
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/admin/whatsapp-qr", {
                headers: { "Authorization": `Bearer ${password}` }
            });
            const data = await res.json();
            if (res.ok) {
                setQr(data.qr);
                setConnected(data.connected);
                // Once connected there's nothing left to poll for — stop hitting
                // the endpoint so we don't keep the session churning.
                if (data.connected && pollRef.current) {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">WhatsApp Login</h2>
                    <form className="mt-8 space-y-6 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`mt-1 block w-full border ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            />
                            {loginError && <p className="mt-1 text-xs text-red-600">Incorrect password. Please try again.</p>}
                        </div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans flex flex-col items-center">
            <div className="max-w-md w-full space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">WhatsApp Session</h1>
                    <a href="/admin" className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Back to Admin
                    </a>
                </div>

                <div className="bg-white shadow rounded-lg p-8 text-center">
                    {connected === true && (
                        <div className="py-10">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-lg font-medium text-gray-900">WhatsApp is connected</p>
                            <p className="text-sm text-gray-500 mt-1">OTP checks and messages can be sent via WhatsApp.</p>
                        </div>
                    )}

                    {connected === false && qr && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">Scan this QR code with WhatsApp on your phone (Linked Devices → Link a Device) to connect.</p>
                            <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-200">
                                <QRCode value={qr} size={220} />
                            </div>
                            <p className="text-xs text-gray-400 mt-4">Refreshes automatically every few seconds until scanned.</p>
                        </div>
                    )}

                    {connected === false && !qr && (
                        <p className="text-sm text-gray-500 py-10">Waiting for QR code to generate...</p>
                    )}

                    {connected === null && (
                        <p className="text-sm text-gray-500 py-10">Checking status...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
