"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface Subscriber {
    endpoint: string;
    auth: string;
    p256dh: string;
    platform?: string;
    createdAt?: string;
    updatedAt?: string;
}

export default function SubscribersAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(false);

    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (isAuthenticated) {
            fetchSubscribers();
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

    const fetchSubscribers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/subscribers", {
                headers: {
                    "Authorization": `Bearer ${password}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setSubscribers(data.items || []);
                setTotalCount(data.count || 0);
                setCurrentPage(1); // Reset to first page on refresh
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to fetch subscribers");
            }
        } catch (e: any) {
            console.error(e);
            setError("Network error formatting subscribers.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = subscribers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(subscribers.length / itemsPerPage);

    // Helpers
    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    const truncateEndpoint = (endpoint: string) => {
        if (!endpoint) return "N/A";
        // Show first 30 and last 10 characters
        if (endpoint.length <= 40) return endpoint;
        return `${endpoint.substring(0, 30)}...${endpoint.substring(endpoint.length - 10)}`;
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Login</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">Subscribers Dashboard</p>
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
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-4 mb-8">
                    <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            Push Notification Subscribers
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded">
                                {totalCount} Total
                            </span>
                        </h1>
                        <p className="mt-2 text-sm text-gray-700">List of devices registered to receive notifications.</p>
                    </div>
                    <div className="ml-auto">
                        <button
                            onClick={fetchSubscribers}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subscribed On
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Platform
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Endpoint URL
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && subscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                            Loading subscribers...
                                        </td>
                                    </tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                            No subscribers found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((sub, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(sub.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {sub.platform ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 uppercase">
                                                        {sub.platform}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 italic">Unknown</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono" title={sub.endpoint}>
                                                {truncateEndpoint(sub.endpoint)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <span className="sr-only">Previous</span>
                                            &larr; Prev
                                        </button>

                                        {[...Array(totalPages)].map((_, i) => {
                                            // Simple pagination logic, showing a subset of pages could be added for very large numbers
                                            const page = i + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <span className="sr-only">Next</span>
                                            Next &rarr;
                                        </button>
                                    </nav>
                                </div>
                            </div>

                            {/* Mobile Pagination */}
                            <div className="flex items-center justify-between w-full sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
