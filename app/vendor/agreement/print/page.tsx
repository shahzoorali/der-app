'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VendorAgreementPrintPage() {
    const router = useRouter();
    const [vendor, setVendor] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await fetch('/api/vendor/application');
            if (res.status === 401) return router.push('/vendor/login');
            const data = await res.json();
            if (res.ok) {
                if (!data.agreement?.accepted) {
                    router.push('/vendor/agreement');
                    return;
                }
                setVendor(data);
            }
            setLoading(false);
        })();
    }, [router]);

    if (loading || !vendor) {
        return <p className="text-center text-gray-400 py-10">Loading...</p>;
    }

    return (
        <div className="max-w-2xl mx-auto p-8 print:p-0 bg-white text-black">
            <div className="flex justify-between items-start mb-8 print:hidden">
                <h1 className="text-xl font-bold">Vendor Agreement Record</h1>
                <button onClick={() => window.print()} className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-bold">
                    Download / Print PDF
                </button>
            </div>

            <div className="border border-gray-200 rounded-2xl p-8 space-y-6">
                <div className="text-center border-b border-gray-100 pb-6">
                    <h2 className="text-2xl font-bold text-brand-red">Daawat-e-Ramzaan — Season 6</h2>
                    <p className="text-sm text-gray-400">Vendor Agreement Confirmation</p>
                </div>

                <Row label="Business Name" value={vendor.businessName} />
                <Row label="Contact Person" value={vendor.contactPerson} />
                <Row label="Phone" value={vendor.phone} />
                <Row label="Stall" value={`${vendor.stall?.city} — #${vendor.stall?.stallNumber}${vendor.stall?.size ? ` (${vendor.stall.size})` : ''}`} />
                <Row label="GST Number" value={vendor.agreement?.details?.gst || '—'} />
                <Row label="Business Address" value={vendor.agreement?.details?.address || '—'} />

                <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500 mb-1">Digitally accepted by</p>
                    <p className="text-lg font-bold">{vendor.agreement?.name}</p>
                    <p className="text-xs text-gray-400 mt-2">
                        Accepted on {new Date(vendor.agreement?.acceptedAt).toLocaleString()} from IP {vendor.agreement?.ip}
                    </p>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-gray-400 font-bold">{label}</span>
            <span className="text-right">{value}</span>
        </div>
    );
}
