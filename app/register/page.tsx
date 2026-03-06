'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Step = 'NAME' | 'PHONE' | 'OTP' | 'ADULTS' | 'SUCCESS';

export default function RegisterPage() {
    const [step, setStep] = useState<Step>('NAME');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState(''); // Just the 10 digits
    const [otp, setOtp] = useState('');
    const [adults, setAdults] = useState<number>(1);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getShortName = (fullName: string) => {
        return fullName.length > 9 ? fullName.substring(0, 9) + '...' : fullName;
    };

    const handleNextName = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }
        setStep('PHONE');
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit number');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/register/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+91${phone}` })
            });
            const data = await res.json();

            if (res.ok) {
                setStep('OTP');
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (otp.length !== 4) {
            setError('Please enter a valid 4-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/register/validate-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+91${phone}`, otp })
            });
            const data = await res.json();

            if (res.ok) {
                setStep('ADULTS');
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: `+91${phone}`,
                    otp,
                    name,
                    adults
                })
            });
            const data = await res.json();

            if (res.ok) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('der-user-name', name);
                    localStorage.setItem('der-user-phone', `+91${phone}`);
                }
                setStep('SUCCESS');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderLogos = () => (
        <div className="flex flex-col items-center gap-4 mb-8 pt-6">
            <div className="relative w-40 h-20">
                <Image
                    src="/ahmed-al-maghribi-logo.png"
                    alt="Ahmed Al Maghribi Logo"
                    fill
                    className="object-contain"
                />
            </div>
            <div className="relative w-48 h-20">
                <Image
                    src="/der-logo.svg"
                    alt="Daawat-e-Ramzaan Logo"
                    fill
                    className="object-contain"
                />
            </div>
        </div>
    );

    return (
        <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center font-sans p-6">
            {step !== 'SUCCESS' && renderLogos()}

            <div className="w-full max-w-md flex flex-col justify-center flex-grow">
                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-xl mb-6 text-center">
                        {error}
                    </div>
                )}

                {step === 'NAME' && (
                    <form onSubmit={handleNextName} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <label className="text-2xl text-center font-semibold text-amber-500">
                            Enter your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            className="bg-neutral-900 border border-stone-800 rounded-2xl p-4 text-2xl text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-white placeholder-stone-600"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xl font-medium transition-colors"
                        >
                            Next
                        </button>
                    </form>
                )}

                {step === 'PHONE' && (
                    <form onSubmit={handleSendOtp} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <label className="text-2xl text-center font-semibold text-amber-500">
                            Enter your Phone Number
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="bg-neutral-900 border border-stone-800 rounded-2xl p-4 text-2xl text-stone-400">
                                +91
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10-digit number"
                                className="w-full bg-neutral-900 border border-stone-800 rounded-2xl p-4 text-2xl text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-white placeholder-stone-600 tracking-wider"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-2xl text-xl font-medium transition-colors flex justify-center items-center"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 'OTP' && (
                    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <label className="text-2xl text-center font-semibold text-amber-500">
                            Enter OTP
                        </label>
                        <p className="text-center text-stone-400 -mt-4 text-sm">
                            Sent to +91 {phone}
                        </p>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="••••"
                            className="mx-auto w-56 bg-neutral-900 border border-stone-800 rounded-2xl p-4 text-4xl text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-white tracking-[0.5em]"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-2xl text-xl font-medium transition-colors flex justify-center items-center"
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>
                )}

                {step === 'ADULTS' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <label className="text-2xl text-center font-semibold text-amber-500">
                            Number of Adults
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setAdults(num)}
                                    className={`aspect-square rounded-2xl text-2xl font-medium border transition-colors ${adults === num
                                        ? 'bg-amber-600 border-amber-500 text-white'
                                        : 'bg-neutral-900 border-stone-800 text-stone-300 hover:border-stone-600'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-2xl text-xl font-medium transition-colors"
                        >
                            {loading ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="flex flex-col items-center justify-center gap-8 text-center animate-in zoom-in-95 duration-1000 h-full">
                        {renderLogos()}
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-5xl font-bold text-amber-500 leading-tight">
                            Welcome,<br />{getShortName(name)}!
                        </h1>
                        <p className="text-3xl text-stone-300 mt-4 border border-stone-700 bg-neutral-900 rounded-2xl px-8 py-6">
                            Entry for <strong className="text-white text-4xl mx-2">{adults}</strong> adults
                        </p>
                        <Link
                            href="/"
                            className="mt-8 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xl font-medium transition-colors"
                        >
                            Enter Daawat-e-Ramzaan
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
