"use client";

import { useState, useEffect } from "react";

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [waStatus, setWaStatus] = useState<boolean | null>(null);
    const [waLoading, setWaLoading] = useState(false);

    // Form state
    const [type, setType] = useState("general");
    const [title, setTitle] = useState("");
    const [time, setTime] = useState("");
    const [venue, setVenue] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [sendPush, setSendPush] = useState(false);

    // Push notification state
    const [pushTitle, setPushTitle] = useState("");
    const [pushBody, setPushBody] = useState("");
    const [pushLoading, setPushLoading] = useState(false);
    const [pushResult, setPushResult] = useState<string | null>(null);

    // Settings state
    const [droneShowHighlightsUrl, setDroneShowHighlightsUrl] = useState("");
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsResult, setSettingsResult] = useState<string | null>(null);

    const PUSH_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || '';

    useEffect(() => {
        if (isAuthenticated) {
            fetchAnnouncements();
            fetchSettings();
            fetchWAStatus();
            const interval = setInterval(fetchWAStatus, 15000); // Check every 15s
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const fetchWAStatus = async () => {
        setWaLoading(true);
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
        setWaLoading(false);
    };

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch("/api/announcements");
            const data = await res.json();
            setAnnouncements(data);
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
        } catch (e) {
            console.error(e);
        }
    };

    const [loginError, setLoginError] = useState(false);

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

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/announcements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${password}`,
                },
                body: JSON.stringify({
                    type, title, time, venue, description, priority
                }),
            });
            if (res.ok) {
                // Also send push if checkbox enabled
                if (sendPush && PUSH_API_URL) {
                    try {
                        await fetch(`${PUSH_API_URL}/admin/notify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${password}`,
                            },
                            body: JSON.stringify({ title, body: description }),
                        });
                    } catch (pushErr) {
                        console.error('Push notification failed:', pushErr);
                    }
                }
                // reset form
                setTitle("");
                setTime("");
                setVenue("");
                setDescription("");
                setSendPush(false);
                await fetchAnnouncements();
            } else {
                alert("Failed to add - check password");
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleSendPush = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!PUSH_API_URL) {
            alert('Push API URL not configured. Set NEXT_PUBLIC_NOTIFICATION_API_URL in .env.local');
            return;
        }
        setPushLoading(true);
        setPushResult(null);
        try {
            const res = await fetch(`${PUSH_API_URL}/admin/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${password}`
                },
                body: JSON.stringify({ title: pushTitle, body: pushBody }),
            });
            const data = await res.json();
            if (res.ok) {
                setPushResult(`✅ Sent to ${data.sent} devices (${data.failed} failed, ${data.staleRemoved} stale removed)`);
                setPushTitle('');
                setPushBody('');
            } else {
                setPushResult(`❌ Failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            setPushResult('❌ Network error');
        }
        setPushLoading(false);
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
                body: JSON.stringify({ droneShowHighlightsUrl }),
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

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this announcement?")) return;

        try {
            const res = await fetch(`/api/announcements?id=${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${password}`,
                }
            });
            if (res.ok) {
                await fetchAnnouncements();
            } else {
                alert("Failed to delete - check password");
            }
        } catch (e) {
            console.error(e);
        }
    };

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
                        <h1 className="text-3xl font-bold text-gray-900">Announcements Admin</h1>
                        <p className="mt-2 text-sm text-gray-700">Add or remove broadcasts.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp:</span>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${waStatus === true ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : waStatus === false ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-gray-300'}`}></div>
                                <span className={`text-sm font-medium ${waStatus === true ? 'text-green-700' : waStatus === false ? 'text-red-700' : 'text-gray-500'}`}>
                                    {waStatus === true ? 'Connected' : waStatus === false ? 'Disconnected' : 'Checking...'}
                                </span>
                            </div>
                        </div>
                        <a href="/admin/registrations" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                            View Registrations
                        </a>
                        <a href="/admin/subscribers" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            View Subscribers
                        </a>
                    </div>
                </div>

                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">New Announcement</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                    <option value="general">General</option>
                                    <option value="event">Event</option>
                                    <option value="crowd">Crowd Alert</option>
                                    <option value="promo">Promo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Time (e.g. 9:15 PM)</label>
                                <input type="text" required value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Venue</label>
                                <input type="text" required value={venue} onChange={e => setVenue(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                            {loading ? "Broadcasting..." : "Broadcast Announcement"}
                        </button>
                        <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)} className="rounded border-gray-300" />
                            Also send as Push Notification to all users
                        </label>
                    </form>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {announcements.map((a) => (
                            <li key={a.id}>
                                <div className="px-4 py-4 flex items-center sm:px-6">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="truncate">
                                            <div className="flex text-sm">
                                                <p className="font-medium text-blue-600 truncate">{a.title}</p>
                                                <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                                                    in {a.venue}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <p>{a.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0">
                                        <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 bg-red-50 rounded-md">Delete</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Standalone Push Notification */}
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">📢 Send Push Notification</h3>
                    <p className="text-sm text-gray-500 mb-4">Send a push notification to all registered devices without creating an announcement.</p>
                    <form onSubmit={handleSendPush} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" required value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="e.g. 🎤 Qawwali Night starting now!" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Message</label>
                            <textarea required rows={2} value={pushBody} onChange={e => setPushBody(e.target.value)} placeholder="e.g. Head to the Cultural Stage for an amazing performance!" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                        </div>
                        <button type="submit" disabled={pushLoading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                            {pushLoading ? "Sending..." : "🔔 Send Push Notification"}
                        </button>
                        {pushResult && (
                            <p className={`text-sm font-medium ${pushResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{pushResult}</p>
                        )}
                    </form>
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
