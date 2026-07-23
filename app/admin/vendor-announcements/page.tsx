"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/use-admin-auth";
import { StatusBadge } from "@/components/vendor/status-badge";

const STATUS_FILTERS = ["SUBMITTED", "APPROVED", "WAITLISTED", "REJECTED", "INFO_REQUIRED", "PAID"];

type Target = "all" | "status" | "selected";

export default function VendorAnnouncementsPage() {
    const { password, setPassword, isAuthenticated, loginError, handleLogin, ready } = useAdminAuth();

    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [waConnected, setWaConnected] = useState<boolean | null>(null);

    const [target, setTarget] = useState<Target>("all");
    const [status, setStatus] = useState("SUBMITTED");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchVendors();
            fetchWAStatus();
        }
    }, [isAuthenticated]);

    const fetchWAStatus = async () => {
        try {
            const res = await fetch("/api/admin/whatsapp-status", {
                headers: { Authorization: `Bearer ${password}` },
            });
            const data = await res.json();
            if (res.ok) setWaConnected(data.connected);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/vendors", {
                headers: { Authorization: `Bearer ${password}` },
            });
            const data = await res.json();
            if (res.ok && data.items) setVendors(data.items);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const filteredVendors = vendors.filter((v) => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        return (v.businessName || "").toLowerCase().includes(query) || (v.phone || "").toLowerCase().includes(query);
    });

    const toggleSelected = (phone: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(phone)) next.delete(phone);
            else next.add(phone);
            return next;
        });
    };

    const selectAllFiltered = () => setSelected(new Set(filteredVendors.map((v) => v.phone)));
    const clearSelection = () => setSelected(new Set());

    const recipientCount = target === "all"
        ? vendors.length
        : target === "status"
            ? vendors.filter((v) => v.status === status).length
            : selected.size;

    const handleSend = async () => {
        setResult(null);
        if (!message.trim()) {
            setResult("❌ Please write a message.");
            return;
        }
        if (target === "selected" && selected.size === 0) {
            setResult("❌ Select at least one vendor.");
            return;
        }
        if (!confirm(`Send this WhatsApp message to ${recipientCount} vendor(s)?`)) return;

        setSending(true);
        try {
            const res = await fetch("/api/admin/vendors/broadcast", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${password}`,
                },
                body: JSON.stringify({
                    message,
                    target,
                    status: target === "status" ? status : undefined,
                    phones: target === "selected" ? Array.from(selected) : undefined,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult(`✅ Sent to ${data.sent} of ${data.total} vendor(s)${data.failed ? ` — ${data.failed} failed` : ""}.`);
                setMessage("");
                clearSelection();
            } else {
                setResult(`❌ ${data.error || "Failed to send"}`);
            }
        } catch (e) {
            console.error(e);
            setResult("❌ Network error.");
        }
        setSending(false);
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
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Announcements</h1>
                        <p className="mt-2 text-sm text-gray-700">Send an important WhatsApp message to vendors.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <a href="/admin/whatsapp-qr" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50">
                            <div className={`w-2.5 h-2.5 rounded-full ${waConnected === true ? 'bg-green-500' : waConnected === false ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm font-medium text-gray-600">
                                {waConnected === true ? 'WhatsApp Connected' : waConnected === false ? 'WhatsApp Disconnected' : 'Checking...'}
                            </span>
                        </a>
                        <a href="/admin" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Back to Admin
                        </a>
                    </div>
                </div>

                {waConnected === false && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 text-sm">
                        WhatsApp is not connected. <a href="/admin/whatsapp-qr" className="underline font-medium">Scan the QR code</a> before sending vendor announcements.
                    </div>
                )}

                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Send to</label>
                        <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="radio" name="target" checked={target === "all"} onChange={() => setTarget("all")} />
                                All vendors ({vendors.length})
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="radio" name="target" checked={target === "status"} onChange={() => setTarget("status")} />
                                By status
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="radio" name="target" checked={target === "selected"} onChange={() => setTarget("selected")} />
                                Selected vendors ({selected.size})
                            </label>
                        </div>
                        {target === "status" && (
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-3 block w-full md:w-56 border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm">
                                {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s} ({vendors.filter(v => v.status === s).length})</option>)}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Message</label>
                        <textarea
                            required
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="e.g. Stall allotment for Hyderabad has been finalized. Please check your dashboard for details."
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={sending || waConnected === false}
                        className="w-full md:w-auto inline-flex justify-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {sending ? "Sending..." : `Send to ${recipientCount} Vendor${recipientCount === 1 ? '' : 's'}`}
                    </button>
                    {result && <p className="text-sm font-medium">{result}</p>}
                </div>

                {target === "selected" && (
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                            <input
                                type="text"
                                placeholder="Search by business or phone"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full md:w-72 border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                            />
                            <div className="flex gap-2">
                                <button onClick={selectAllFiltered} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Select all filtered</button>
                                <button onClick={clearSelection} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Clear</button>
                            </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
                            {loading ? (
                                <p className="p-4 text-sm text-gray-500">Loading vendors...</p>
                            ) : filteredVendors.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500">No vendors found.</p>
                            ) : (
                                filteredVendors.map((v) => (
                                    <label key={v.phone} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={selected.has(v.phone)} onChange={() => toggleSelected(v.phone)} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{v.businessName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{v.phone}</p>
                                        </div>
                                        <StatusBadge status={v.status} />
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
