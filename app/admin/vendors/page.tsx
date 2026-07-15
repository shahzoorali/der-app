"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/vendor/status-badge";

const STATUS_FILTERS = ["all", "SUBMITTED", "APPROVED", "WAITLISTED", "REJECTED", "INFO_REQUIRED", "PAID"];

export default function VendorsAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(false);

    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isAuthenticated) fetchVendors();
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

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/vendors", {
                headers: { "Authorization": `Bearer ${password}` }
            });
            const data = await res.json();
            if (res.ok && data.items) {
                setVendors(data.items);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const filteredData = vendors.filter(v => {
        if (statusFilter !== "all" && v.status !== statusFilter) return false;
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        return (v.businessName || "").toLowerCase().includes(query) || (v.phone || "").toLowerCase().includes(query);
    });

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

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Applications</h1>
                        <p className="mt-2 text-sm text-gray-700">Review, approve, and manage vendor applications for Season 6.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <a href="/admin" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Back to Admin
                        </a>
                        <button
                            onClick={fetchVendors}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-grow w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700">Search by Business or Phone</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>
                    <div className="w-full md:w-56">
                        <label className="block text-sm font-medium text-gray-700">Filter Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
                        >
                            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cities</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.length > 0 ? filteredData.map((v) => (
                                    <tr key={v.phone} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.businessName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{v.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.productCategory}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(v.cityPreferences || []).join(", ")}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={v.status} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <a
                                                href={`/admin/vendors/${encodeURIComponent(v.phone)}`}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                                            >
                                                View
                                            </a>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                                            No vendor applications found for this filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
