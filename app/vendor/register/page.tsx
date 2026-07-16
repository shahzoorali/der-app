'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer, Navbar } from '@/components/layout-components';
import { IslamicBorder, CharminarIcon } from '@/components/brand-elements';
import { VendorOtpStep } from '@/components/vendor/otp-step';
import { CATEGORIES, CITY_OPTIONS } from '@/lib/vendor-constants';

type Step = 'PHONE' | 'OTP' | 'DETAILS' | 'CITIES' | 'IMAGES' | 'REVIEW' | 'SUCCESS';

type UploadedImage = { key: string; name: string; previewUrl: string };

export default function VendorRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [viaWhatsApp, setViaWhatsApp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [businessName, setBusinessName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [brandDescription, setBrandDescription] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [cityPreferences, setCityPreferences] = useState<string[]>([]);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [applicationId, setApplicationId] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/vendor/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+91${phone}`, mode: 'register' }),
            });
            const data = await res.json();
            if (res.ok) {
                setViaWhatsApp(!!data.viaWhatsApp);
                setStep('OTP');
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtpValue = async (otpValue: string) => {
        const res = await fetch('/api/vendor/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: `+91${phone}`, otp: otpValue }),
        });
        const data = await res.json();
        if (res.ok) {
            if (data.hasApplication) {
                router.push('/vendor/dashboard');
            } else {
                setStep('DETAILS');
            }
        } else {
            setError(data.error || 'Invalid OTP');
        }
        return res.ok;
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOtpValue(otp);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDetailsNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!businessName.trim() || !contactPerson.trim() || !productCategory) {
            setError('Please fill in all required fields.');
            return;
        }
        setStep('CITIES');
    };

    const toggleCity = (city: string) => {
        setCityPreferences((prev) => {
            if (city === 'Any') return prev.includes('Any') ? [] : ['Any'];
            const withoutAny = prev.filter((c) => c !== 'Any');
            return withoutAny.includes(city) ? withoutAny.filter((c) => c !== city) : [...withoutAny, city];
        });
    };

    const handleCitiesNext = () => {
        setError('');
        if (cityPreferences.length === 0) {
            setError('Please select at least one city preference.');
            return;
        }
        setStep('IMAGES');
    };

    const handleFileUpload = async (file: File) => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/vendor/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, contentType: file.type }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Upload failed');
                return;
            }
            await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
            setImages((prev) => [...prev, { key: data.key, name: file.name, previewUrl: URL.createObjectURL(file) }]);
        } catch {
            setError('Network error uploading image.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/vendor/application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName,
                    contactPerson,
                    email,
                    brandDescription,
                    productCategory,
                    cityPreferences,
                    images: images.map(({ key, name }) => ({ key, name })),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setApplicationId(data.vendorId);
                setStep('SUCCESS');
            } else {
                setError(data.error || 'Failed to submit application');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <div className="text-center mb-6">
                    <CharminarIcon className="w-12 h-12 text-brand-blue mx-auto mb-2 opacity-80" />
                    <h1 className="font-herb text-3xl text-brand-red">Vendor Registration</h1>
                    <p className="text-gray-400 text-xs font-medium mt-1">Season 6 • 2027 • Multicity</p>
                </div>
                <IslamicBorder className="mb-6" />

                {step === 'PHONE' && (
                    <VendorOtpStep
                        phase="PHONE"
                        phone={phone}
                        otp={otp}
                        loading={loading}
                        error={error}
                        viaWhatsApp={viaWhatsApp}
                        onPhoneChange={setPhone}
                        onOtpChange={setOtp}
                        onSendOtp={handleSendOtp}
                        onVerifyOtp={handleVerifyOtp}
                    />
                )}

                {step === 'OTP' && (
                    <VendorOtpStep
                        phase="OTP"
                        phone={phone}
                        otp={otp}
                        loading={loading}
                        error={error}
                        viaWhatsApp={viaWhatsApp}
                        onPhoneChange={setPhone}
                        onOtpChange={setOtp}
                        onSendOtp={handleSendOtp}
                        onVerifyOtp={handleVerifyOtp}
                    />
                )}

                {step === 'DETAILS' && (
                    <form onSubmit={handleDetailsNext} className="flex flex-col gap-4">
                        {error && <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red p-3 rounded-xl text-center text-sm">{error}</div>}
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
                                <option value="">Select category</option>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </Field>
                        <Field label="Brand Description">
                            <textarea value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} className="input min-h-24" />
                        </Field>
                        <button type="submit" className="btn-primary">Next</button>
                    </form>
                )}

                {step === 'CITIES' && (
                    <div className="flex flex-col gap-4">
                        {error && <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red p-3 rounded-xl text-center text-sm">{error}</div>}
                        <label className="text-sm font-bold text-brand-blue">City Preferences (Season 6 cities to be announced) *</label>
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
                        <button type="button" onClick={handleCitiesNext} className="btn-primary mt-2">Next</button>
                    </div>
                )}

                {step === 'IMAGES' && (
                    <div className="flex flex-col gap-4">
                        {error && <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red p-3 rounded-xl text-center text-sm">{error}</div>}
                        <label className="text-sm font-bold text-brand-blue">Product Images (optional, up to 5MB each)</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                            disabled={loading}
                            className="text-sm text-gray-500 file:mr-3 file:py-3 file:px-5 file:rounded-xl file:border-0 file:font-bold file:text-sm file:bg-brand-blue file:text-white hover:file:bg-brand-blue/90 file:cursor-pointer disabled:opacity-50"
                        />
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {images.map((img, i) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                                        <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                        <button type="button" onClick={() => setStep('REVIEW')} className="btn-primary mt-2">
                            {loading ? 'Uploading...' : 'Next'}
                        </button>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="flex flex-col gap-4">
                        {error && <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red p-3 rounded-xl text-center text-sm">{error}</div>}
                        <div className="bg-white rounded-2xl p-5 border border-brand-blue/10 text-sm space-y-2">
                            <p><strong>Business:</strong> {businessName}</p>
                            <p><strong>Contact:</strong> {contactPerson}</p>
                            <p><strong>Phone:</strong> +91 {phone}</p>
                            {email && <p><strong>Email:</strong> {email}</p>}
                            <p><strong>Category:</strong> {productCategory}</p>
                            <p><strong>Cities:</strong> {cityPreferences.join(', ')}</p>
                            <p><strong>Images:</strong> {images.length} uploaded</p>
                        </div>
                        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="flex flex-col items-center text-center gap-6 py-8">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-brand-blue">Application Received!</h2>
                        <p className="text-gray-500 text-sm px-4">
                            Thank you for applying to Daawat-e-Ramzaan Season 6. Our team will review your application and update you soon.
                        </p>
                        <p className="text-xs text-gray-400">Application ID: {applicationId}</p>
                        <Link href="/vendor/dashboard" className="btn-primary inline-block">Go to Dashboard</Link>
                    </div>
                )}
            </PageContainer>

            <style jsx global>{`
                .input {
                    width: 100%;
                    background: white;
                    border: 1px solid rgba(43, 94, 167, 0.1);
                    border-radius: 1rem;
                    padding: 0.875rem 1rem;
                    font-size: 0.95rem;
                }
                .btn-primary {
                    width: 100%;
                    padding: 1rem;
                    background: #2b5ea7;
                    color: white;
                    border-radius: 1rem;
                    font-weight: 700;
                    text-align: center;
                    transition: opacity 0.2s;
                }
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
