"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/use-admin-auth";

export default function AdminPage() {
    const { password, setPassword, isAuthenticated, loginError, handleLogin, ready } = useAdminAuth();
    const [waStatus, setWaStatus] = useState<boolean | null>(null);

    // Settings state
    const [droneShowHighlightsUrl, setDroneShowHighlightsUrl] = useState("");
    const [aasmaanHighlightsUrl, setAasmaanHighlightsUrl] = useState("");
    const [otpBypass, setOtpBypass] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsResult, setSettingsResult] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSettings();
            fetchWAStatus();
            const interval = setInterval(fetchWAStatus, 15000); // Check every 15s
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const fetchWAStatus = async () => {
        try {
            const res = await fetch("/api/admin/whatsapp-status", {
                headers: { "Authorization": `Bearer ${password}` }
            });
            const data = await res.json();
            if (res.ok) {
                setWaStatus(data.connected);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            if (data.droneShowHighlightsUrl !== undefined) {
                setDroneShowHighlightsUrl(data.droneShowHighlightsUrl);
            }
            if (data.aasmaanHighlightsUrl !== undefined) {
                setAasmaanHighlightsUrl(data.aasmaanHighlightsUrl);
            }
            setOtpBypass(data.otpBypass === true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSettingsLoading(true);
        setSettingsResult(null);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${password}`
                },
                body: JSON.stringify({ droneShowHighlightsUrl, aasmaanHighlightsUrl, otpBypass }),
            });
            if (res.ok) {
                setSettingsResult('✅ Settings updated successfully');
            } else {
                setSettingsResult('❌ Failed to update settings');
            }
        } catch (e) {
            console.error(e);
            setSettingsResult('❌ Network error');
        }
        setSettingsLoading(false);
    };

    if (!ready) return null;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Login</h2>
                    <form className="mt-8 space-y-6 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={`mt-1 block w-full border ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} />
                            {loginError && <p className="mt-1 text-xs text-red-600">Incorrect password. Please try again.</p>}
                        </div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
                        <p className="mt-2 text-sm text-gray-700">Daawat-e-Ramzaan Season 6 admin panel.</p>
                    </div>
                    <a href="/admin/whatsapp-qr" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp:</span>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${waStatus === true ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : waStatus === false ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm font-medium ${waStatus === true ? 'text-green-700' : waStatus === false ? 'text-red-700' : 'text-gray-500'}`}>
                                {waStatus === true ? 'Connected' : waStatus === false ? 'Disconnected — click to scan QR' : 'Checking...'}
                            </span>
                        </div>
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a href="/admin/app-users" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-transparent hover:border-blue-200">
                        <h3 className="text-lg font-bold text-gray-900">Targeted App Users</h3>
                        <p className="mt-1 text-sm text-gray-500">Announcements, push notifications, registrations, and subscribers for people using the app.</p>
                    </a>
                    <a href="/admin/vendors" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-transparent hover:border-emerald-200">
                        <h3 className="text-lg font-bold text-gray-900">Vendors</h3>
                        <p className="mt-1 text-sm text-gray-500">Review, approve, and manage Season 6 vendor applications.</p>
                    </a>
                    <a href="/admin/vendor-announcements" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-transparent hover:border-green-200">
                        <h3 className="text-lg font-bold text-gray-900">Vendor Announcements</h3>
                        <p className="mt-1 text-sm text-gray-500">Send important WhatsApp messages to vendors — all, by status, or hand-picked.</p>
                    </a>
                    <a href="/admin/whatsapp-qr" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-transparent hover:border-gray-300">
                        <h3 className="text-lg font-bold text-gray-900">WhatsApp Connection</h3>
                        <p className="mt-1 text-sm text-gray-500">Scan the QR code to connect or reconnect the WhatsApp sending number.</p>
                    </a>
                </div>

                {/* App Settings */}
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-8">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">⚙️ App Settings</h3>
                    <form onSubmit={handleUpdateSettings} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Drone Show Highlights URL (Instagram Reel)</label>
                            <input type="text" value={droneShowHighlightsUrl} onChange={e => setDroneShowHighlightsUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p className="mt-1 text-xs text-gray-500">Leaving this blank will link to the main Daawat-e-Ramzaan Instagram profile.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Daawat-e-Aasmaan Highlights URL (Instagram Reel)</label>
                            <input type="text" value={aasmaanHighlightsUrl} onChange={e => setAasmaanHighlightsUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p className="mt-1 text-xs text-gray-500">Instagram link for the Daawat-e-Aasmaan drone show highlights. Shows after the event ends.</p>
                        </div>
                        <div className={`rounded-md border p-4 ${otpBypass ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={otpBypass} onChange={e => setOtpBypass(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                <span>
                                    <span className="block text-sm font-medium text-gray-900">Bypass OTP for vendor login &amp; registration</span>
                                    <span className="block mt-1 text-xs text-gray-500">
                                        When enabled, vendors skip the OTP step and continue with just their phone number.
                                        Use this only while WhatsApp/SMS OTP delivery is unavailable — anyone can then sign in
                                        as any phone number. Turn it back off once OTP delivery is restored.
                                    </span>
                                </span>
                            </label>
                        </div>
                        <button type="submit" disabled={settingsLoading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                            {settingsLoading ? "Saving..." : "Save Settings"}
                        </button>
                        {settingsResult && (
                            <p className={`text-sm font-medium ${settingsResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{settingsResult}</p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
