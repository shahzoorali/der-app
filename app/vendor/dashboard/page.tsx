'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer, Navbar } from '@/components/layout-components';
import { CharminarIcon, IslamicBorder } from '@/components/brand-elements';
import { StatusBadge } from '@/components/vendor/status-badge';

export default function VendorDashboardPage() {
    const router = useRouter();
    const [vendor, setVendor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchApplication();
    }, []);

    const fetchApplication = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/vendor/application');
            if (res.status === 401) {
                router.push('/vendor/login');
                return;
            }
            if (res.status === 404) {
                router.push('/vendor/register');
                return;
            }
            const data = await res.json();
            if (res.ok) {
                setVendor(data);
            } else {
                setError(data.error || 'Failed to load application');
            }
        } catch {
            setError('Network error loading dashboard.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/vendor/auth/logout', { method: 'POST' });
        router.push('/vendor/login');
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <PageContainer>
                    <p className="text-center text-gray-400 py-10">Loading your dashboard...</p>
                </PageContainer>
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <PageContainer>
                    <p className="text-center text-brand-red py-10">{error || 'Something went wrong.'}</p>
                </PageContainer>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <div className="text-center mb-6">
                    <CharminarIcon className="w-12 h-12 text-brand-blue mx-auto mb-2 opacity-80" />
                    <h1 className="font-herb text-3xl text-brand-red">Vendor Dashboard</h1>
                    <p className="text-gray-400 text-xs font-medium mt-1">{vendor.businessName}</p>
                </div>
                <IslamicBorder className="mb-6" />

                <div className="flex flex-col gap-5">
                    {/* Status */}
                    <Card title="Application Status">
                        <div className="flex items-center justify-between">
                            <StatusBadge status={vendor.status} />
                        </div>
                        {vendor.status === 'INFO_REQUIRED' && (
                            <div className="mt-3">
                                <p className="text-sm text-brand-blue bg-blue-50 rounded-xl p-3">{vendor.statusNote || 'Please provide additional information.'}</p>
                                <Link href="/vendor/register/edit" className="btn-secondary mt-3 inline-block">Update Application</Link>
                            </div>
                        )}
                        {vendor.status === 'REJECTED' && vendor.statusNote && (
                            <p className="text-sm text-gray-500 mt-3">{vendor.statusNote}</p>
                        )}
                        {vendor.status === 'WAITLISTED' && (
                            <p className="text-sm text-gray-500 mt-3">You're on our waitlist — we'll notify you if a stall opens up.</p>
                        )}
                    </Card>

                    {/* Stall */}
                    {vendor.stall && (
                        <Card title="Stall Details">
                            <div className="text-sm space-y-1">
                                <p><strong>City:</strong> {vendor.stall.city}</p>
                                <p><strong>Stall Number:</strong> {vendor.stall.stallNumber}</p>
                                {vendor.stall.size && <p><strong>Size:</strong> {vendor.stall.size}</p>}
                                {vendor.stall.notes && <p><strong>Notes:</strong> {vendor.stall.notes}</p>}
                            </div>
                        </Card>
                    )}

                    {/* Agreement */}
                    {vendor.stall && (
                        <Card title="Agreement">
                            {vendor.agreement?.accepted ? (
                                <div className="text-sm space-y-2">
                                    <p className="text-green-700">Accepted by {vendor.agreement.name} on {new Date(vendor.agreement.acceptedAt).toLocaleDateString()}</p>
                                    <Link href="/vendor/agreement/print" className="btn-secondary inline-block">View / Print Agreement</Link>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-500 mb-3">Please review and accept the vendor agreement to proceed.</p>
                                    <Link href="/vendor/agreement" className="btn-primary inline-block">Review Agreement</Link>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Payment */}
                    {vendor.payment && (
                        <Card title="Payment">
                            <div className="text-sm space-y-2">
                                <p><strong>Amount:</strong> ₹{vendor.payment.amount.toLocaleString('en-IN')}</p>
                                {vendor.payment.status === 'paid' ? (
                                    <p className="text-green-700 font-bold">Paid on {new Date(vendor.payment.paidAt).toLocaleDateString()}</p>
                                ) : (
                                    <a href={vendor.payment.shortUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">Pay Now</a>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Documents */}
                    {vendor.images?.length > 0 && (
                        <Card title="Submitted Documents">
                            <div className="grid grid-cols-3 gap-2">
                                {vendor.images.map((img: any, i: number) => (
                                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden bg-gray-100 block">
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Guidelines */}
                    <Card title="Event Guidelines">
                        <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
                            <li>Stalls must be set up 2 hours before Iftar each day.</li>
                            <li>All FSSAI/trade licences must be displayed at the stall.</li>
                            <li>Further announcements will appear here as Season 6 dates are confirmed.</li>
                        </ul>
                    </Card>

                    <button onClick={handleLogout} className="text-sm text-gray-400 underline text-center mt-2">
                        Log out
                    </button>
                </div>
            </PageContainer>

            <style jsx global>{`
                .btn-primary {
                    padding: 0.75rem 1.5rem;
                    background: #2b5ea7;
                    color: white;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    font-size: 0.875rem;
                }
                .btn-secondary {
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border: 1px solid rgba(43, 94, 167, 0.2);
                    color: #2b5ea7;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-brand-blue/5 shadow-sm">
            <h3 className="text-brand-blue font-bold text-sm mb-3">{title}</h3>
            {children}
        </div>
    );
}
