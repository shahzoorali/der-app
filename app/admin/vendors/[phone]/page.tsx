"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/vendor/status-badge";

const STATUSES = ["SUBMITTED", "APPROVED", "WAITLISTED", "REJECTED", "INFO_REQUIRED", "PAID"];

export default function VendorDetailAdminPage() {
    const params = useParams();
    const phone = decodeURIComponent(params.phone as string);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(false);

    const [vendor, setVendor] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionResult, setActionResult] = useState("");

    const [status, setStatus] = useState("SUBMITTED");
    const [note, setNote] = useState("");

    const [city, setCity] = useState("");
    const [stallNumber, setStallNumber] = useState("");
    const [size, setSize] = useState("");
    const [stallNotes, setStallNotes] = useState("");

    const [amount, setAmount] = useState("");

    useEffect(() => {
        if (isAuthenticated) fetchVendor();
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

    const fetchVendor = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/vendors/${encodeURIComponent(phone)}`, {
                headers: { "Authorization": `Bearer ${password}` }
            });
            const data = await res.json();
            if (res.ok) {
                setVendor(data);
                setStatus(data.status);
                setNote(data.statusNote || "");
                if (data.stall) {
                    setCity(data.stall.city);
                    setStallNumber(data.stall.stallNumber);
                    setSize(data.stall.size || "");
                    setStallNotes(data.stall.notes || "");
                }
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const runAction = async (body: any) => {
        setActionResult("");
        try {
            const res = await fetch(`/api/admin/vendors/${encodeURIComponent(phone)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${password}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setActionResult("Saved successfully.");
                fetchVendor();
            } else {
                setActionResult(data.error || "Action failed.");
            }
        } catch (e) {
            setActionResult("Network error.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Vendors Login</h2>
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

    if (loading || !vendor) {
        return <div className="min-h-screen bg-gray-100 p-8 text-center text-gray-500">Loading vendor...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h1>
                        <p className="text-sm text-gray-500 font-mono">{vendor.phone}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <StatusBadge status={vendor.status} />
                        <a href="/admin/vendors" className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Back to List
                        </a>
                    </div>
                </div>

                {actionResult && (
                    <div className="bg-white rounded-md shadow p-3 text-sm text-gray-700">{actionResult}</div>
                )}

                <div className="bg-white shadow rounded-lg p-6 grid grid-cols-2 gap-4 text-sm">
                    <Info label="Contact Person" value={vendor.contactPerson} />
                    <Info label="Email" value={vendor.email || '-'} />
                    <Info label="Category" value={vendor.productCategory} />
                    <Info label="City Preferences" value={(vendor.cityPreferences || []).join(", ")} />
                    <Info label="Brand Description" value={vendor.brandDescription || '-'} full />
                </div>

                {vendor.images?.length > 0 && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Documents</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {vendor.images.map((img: any, i: number) => (
                                <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden bg-gray-100 block">
                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status update */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Update Status</h3>
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="w-full md:w-56">
                            <label className="block text-xs font-medium text-gray-500">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex-grow w-full">
                            <label className="block text-xs font-medium text-gray-500">Note (shown to vendor, e.g. what info is needed)</label>
                            <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
                        </div>
                        <button onClick={() => runAction({ action: 'setStatus', status, note })} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                            Save Status
                        </button>
                    </div>
                </div>

                {/* Stall assignment */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Stall Allotment</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="border border-gray-300 rounded-md py-2 px-3" />
                        <input placeholder="Stall Number" value={stallNumber} onChange={(e) => setStallNumber(e.target.value)} className="border border-gray-300 rounded-md py-2 px-3" />
                        <input placeholder="Size (optional)" value={size} onChange={(e) => setSize(e.target.value)} className="border border-gray-300 rounded-md py-2 px-3" />
                        <input placeholder="Notes (optional)" value={stallNotes} onChange={(e) => setStallNotes(e.target.value)} className="border border-gray-300 rounded-md py-2 px-3" />
                    </div>
                    <button onClick={() => runAction({ action: 'assignStall', city, stallNumber, size, notes: stallNotes })} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                        Assign Stall
                    </button>
                </div>

                {/* Agreement */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Agreement</h3>
                    {vendor.agreement?.accepted ? (
                        <p className="text-sm text-green-700">Accepted by {vendor.agreement.name} on {new Date(vendor.agreement.acceptedAt).toLocaleString()}</p>
                    ) : (
                        <p className="text-sm text-gray-500">Not yet accepted.</p>
                    )}
                </div>

                {/* Payment */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Payment</h3>
                    {vendor.payment ? (
                        <div className="text-sm text-gray-700 space-y-1 mb-3">
                            <p>Amount: ₹{vendor.payment.amount?.toLocaleString('en-IN')}</p>
                            <p>Status: {vendor.payment.status}</p>
                            {vendor.payment.shortUrl && <p>Link: <a href={vendor.payment.shortUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600">{vendor.payment.shortUrl}</a></p>}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 mb-3">No payment link created yet.</p>
                    )}
                    <div className="flex gap-3 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-500">Amount (INR)</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block border border-gray-300 rounded-md py-2 px-3 w-40" />
                        </div>
                        <button onClick={() => runAction({ action: 'createPaymentLink', amount: parseFloat(amount) })} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                            Create Payment Link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
    return (
        <div className={full ? "col-span-2" : ""}>
            <p className="text-xs font-medium text-gray-400 uppercase">{label}</p>
            <p className="text-gray-900 mt-1">{value}</p>
        </div>
    );
}
