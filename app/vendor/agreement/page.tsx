'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, Navbar } from '@/components/layout-components';
import { IslamicBorder, CharminarIcon } from '@/components/brand-elements';

export default function VendorAgreementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [vendor, setVendor] = useState<any>(null);

    const [name, setName] = useState('');
    const [gst, setGst] = useState('');
    const [address, setAddress] = useState('');
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await fetch('/api/vendor/application');
            if (res.status === 401) return router.push('/vendor/login');
            if (res.status === 404) return router.push('/vendor/register');
            const data = await res.json();
            if (res.ok) {
                if (!data.stall) {
                    router.push('/vendor/dashboard');
                    return;
                }
                if (data.agreement?.accepted) {
                    router.push('/vendor/agreement/print');
                    return;
                }
                setVendor(data);
                setName(data.contactPerson || '');
            } else {
                setError(data.error || 'Failed to load application');
            }
            setLoading(false);
        })();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim() || !agreed) {
            setError('Please enter your name and accept the terms to continue.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/vendor/agreement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, details: { gst, address } }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push('/vendor/agreement/print');
            } else {
                setError(data.error || 'Failed to accept agreement');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <PageContainer><p className="text-center text-gray-400 py-10">Loading...</p></PageContainer>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <div className="text-center mb-6">
                    <CharminarIcon className="w-12 h-12 text-brand-blue mx-auto mb-2 opacity-80" />
                    <h1 className="font-herb text-3xl text-brand-red">Vendor Agreement</h1>
                    <p className="text-gray-400 text-xs font-medium mt-1">Stall: {vendor?.stall?.city} — #{vendor?.stall?.stallNumber}</p>
                </div>
                <IslamicBorder className="mb-6" />

                {error && <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red p-3 rounded-xl text-center text-sm mb-4">{error}</div>}

                <div className="bg-white rounded-2xl border border-brand-blue/10 p-5 mb-5 max-h-64 overflow-y-auto text-sm text-gray-500 space-y-2">
                    <p className="font-bold text-brand-blue">Terms & Conditions</p>
                    <p>1. The vendor agrees to occupy the allotted stall for the full duration of Daawat-e-Ramzaan Season 6, at the confirmed city and location.</p>
                    <p>2. The vendor is responsible for maintaining valid licences (FSSAI, trade licence, etc.) applicable to their category of goods.</p>
                    <p>3. Payment of the confirmed stall fee must be completed within the timeline shared by the organizing team.</p>
                    <p>4. The organizers reserve the right to reassign or reclaim a stall in case of non-compliance with event guidelines.</p>
                    <p>5. Cancellations are subject to the refund policy communicated separately by the team.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-gray-500">Full Name (for signature) *</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-gray-500">GST Number (if applicable)</span>
                        <input value={gst} onChange={(e) => setGst(e.target.value)} className="input" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-gray-500">Business Address</span>
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input min-h-20" />
                    </label>
                    <label className="flex items-start gap-3 text-sm text-gray-600">
                        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
                        I have read and accept the terms and conditions above.
                    </label>
                    <button type="submit" disabled={submitting} className="btn-primary">
                        {submitting ? 'Submitting...' : 'Accept & Sign Agreement'}
                    </button>
                </form>
            </PageContainer>

            <style jsx global>{`
                .input { width: 100%; background: white; border: 1px solid rgba(43, 94, 167, 0.1); border-radius: 1rem; padding: 0.875rem 1rem; font-size: 0.95rem; }
                .btn-primary { width: 100%; padding: 1rem; background: #2b5ea7; color: white; border-radius: 1rem; font-weight: 700; text-align: center; }
                .btn-primary:disabled { opacity: 0.5; }
            `}</style>
        </div>
    );
}
