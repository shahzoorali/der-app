'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, Navbar } from '@/components/layout-components';
import { IslamicBorder, CharminarIcon } from '@/components/brand-elements';
import { CATEGORIES, CITY_OPTIONS } from '@/lib/vendor-constants';

export default function VendorEditApplicationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [businessName, setBusinessName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [brandDescription, setBrandDescription] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [cityPreferences, setCityPreferences] = useState<string[]>([]);
    const [images, setImages] = useState<{ key: string; name: string }[]>([]);
    const [statusNote, setStatusNote] = useState('');

    useEffect(() => {
        (async () => {
            const res = await fetch('/api/vendor/application');
            if (res.status === 401) return router.push('/vendor/login');
            if (res.status === 404) return router.push('/vendor/register');
            const data = await res.json();
            if (res.ok) {
                if (data.status !== 'INFO_REQUIRED') {
                    router.push('/vendor/dashboard');
                    return;
                }
                setBusinessName(data.businessName);
                setContactPerson(data.contactPerson);
                setEmail(data.email || '');
                setBrandDescription(data.brandDescription || '');
                setProductCategory(data.productCategory);
                setCityPreferences(data.cityPreferences || []);
                setImages(data.images?.map((img: any) => ({ key: img.key, name: img.name })) || []);
                setStatusNote(data.statusNote || '');
            } else {
                setError(data.error || 'Failed to load application');
            }
            setLoading(false);
        })();
    }, [router]);

    const toggleCity = (city: string) => {
        setCityPreferences((prev) => {
            if (city === 'Any') return prev.includes('Any') ? [] : ['Any'];
            const withoutAny = prev.filter((c) => c !== 'Any');
            return withoutAny.includes(city) ? withoutAny.filter((c) => c !== city) : [...withoutAny, city];
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const res = await fetch('/api/vendor/application', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessName, contactPerson, email, brandDescription, productCategory, cityPreferences, images }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push('/vendor/dashboard');
            } else {
                setError(data.error || 'Failed to update application');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSaving(false);
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
                    <h1 className="font-herb text-3xl text-brand-red">Update Application</h1>
                </div>
                <IslamicBorder className="mb-6" />

                {statusNote && (
                    <div className="bg-blue-50 text-brand-blue rounded-xl p-3 text-sm mb-4">{statusNote}</div>
                )}
                {error && <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red p-3 rounded-xl text-center text-sm mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Field label="Business / Brand Name *">
                        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input" />
                    </Field>
                    <Field label="Contact Person *">
                        <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="input" />
                    </Field>
                    <Field label="Email">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                    </Field>
                    <Field label="Product Category *">
                        <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="input">
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Brand Description">
                        <textarea value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} className="input min-h-24" />
                    </Field>
                    <label className="text-xs font-bold text-gray-500">City Preferences *</label>
                    <div className="grid grid-cols-2 gap-2">
                        {CITY_OPTIONS.map((city) => (
                            <button
                                key={city}
                                type="button"
                                onClick={() => toggleCity(city)}
                                className={`p-3 rounded-xl text-sm font-bold border transition-colors ${cityPreferences.includes(city) ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-500 border-brand-blue/10'}`}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary mt-2">
                        {saving ? 'Saving...' : 'Resubmit Application'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500">{label}</span>
            {children}
        </label>
    );
}
