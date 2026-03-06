"use client";

import { useState, useEffect } from "react";

export default function RegistrationsAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(false);

    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [dayFilter, setDayFilter] = useState("all");

    useEffect(() => {
        if (isAuthenticated) {
            fetchRegistrations();
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

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/registrations", {
                headers: {
                    "Authorization": `Bearer ${password}`
                }
            });
            const data = await res.json();
            if (res.ok && data.items) {
                setRegistrations(data.items);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    // Calculate Event Day (1-14) based on 6PM to 3AM operational shift
    const getEventDay = (isoString?: string) => {
        if (!isoString) return null;
        const dt = new Date(isoString);
        // Shift time by -6.5 hours in UTC to align IST evening shifts to a single UTC Date
        // 6 PM IST = 12:30 UTC. Subtract 6.5h = 06:00 UTC. 
        // 3 AM IST (next day) = 21:30 UTC previous day. Subtract 6.5h = 15:00 UTC previous day.
        const shiftedTime = new Date(dt.getTime() - (6.5 * 60 * 60 * 1000));
        const yyyyMmDd = shiftedTime.toISOString().split('T')[0];

        // Based on Mar 5th being Day 1
        const startDayTime = new Date("2026-03-05T00:00:00Z").getTime();
        const currentDayTime = new Date(`${yyyyMmDd}T00:00:00Z`).getTime();

        const diffDays = Math.round((currentDayTime - startDayTime) / (1000 * 60 * 60 * 24));
        const dayNum = diffDays + 1;

        if (dayNum >= 1 && dayNum <= 14) {
            return dayNum;
        }
        return null;
    };

    const handleExportCSV = () => {
        const headers = ["Serial No", "Name", "Phone Number", "No. of Adults", "Timestamp", "Event Day"];

        const rows = filteredData.map((reg, index) => {
            const dateStr = reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
            return [
                index + 1,
                `"${(reg.name || '').replace(/"/g, '""')}"`,
                reg.phone,
                reg.adults || 1,
                dateStr,
                getEventDay(reg.registeredAt) ? `Day ${getEventDay(reg.registeredAt)}` : 'Outside Event'
            ].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `der_registrations_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Apply filtering
    const filteredData = registrations.filter(reg => {
        // Search Filter
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (reg.name && reg.name.toLowerCase().includes(query)) ||
            (reg.phone && reg.phone.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        // Day Filter
        if (dayFilter !== "all") {
            const dayNum = getEventDay(reg.registeredAt);
            if (dayFilter === "outside") {
                if (dayNum !== null) return false;
            } else {
                if (dayNum !== parseInt(dayFilter)) return false;
            }
        }

        return true;
    });

    const totalRegistrations = filteredData.length;
    const totalAttendees = filteredData.reduce((acc, curr) => acc + (curr.adults || 1), 0);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Registrations Login</h2>
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
                        <h1 className="text-3xl font-bold text-gray-900">Registrations Dashboard</h1>
                        <p className="mt-2 text-sm text-gray-700">View and manage Daawat-e-Ramzaan attendee registrations.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <a href="/admin" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Back to Admin
                        </a>
                        <a href="/admin/subscribers" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            View Subscribers
                        </a>
                        <button
                            onClick={fetchRegistrations}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* Dashboard Summary Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Valid Registrations</p>
                            <p className="text-3xl font-bold text-gray-900">{totalRegistrations}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m10 0H7" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Estimated Total Attendees & Footfall</p>
                            <p className="text-3xl font-bold text-green-600">{totalAttendees}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 mb-8 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-grow w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700">Search by Name or Phone</label>
                        <input
                            type="text"
                            placeholder="e.g. 98850 or John"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700">Filter Event Day</label>
                        <select
                            value={dayFilter}
                            onChange={(e) => setDayFilter(e.target.value)}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="all">All Entries</option>
                            {[...Array(14)].map((_, i) => (
                                <option key={i + 1} value={(i + 1).toString()}>Day {i + 1}</option>
                            ))}
                            <option value="outside">Pre/Post Event</option>
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export to CSV
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone No.</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Size</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Day</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Time (IST)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.length > 0 ? filteredData.map((reg, index) => {
                                    const eventDay = getEventDay(reg.registeredAt);
                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{reg.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-mono">{reg.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                                    {reg.adults} Adults
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {eventDay ? `Day ${eventDay}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                            No registrations found for this filter.
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
