'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer, Navbar } from '@/components/layout-components';
import { IslamicBorder, CharminarIcon } from '@/components/brand-elements';
import { VendorOtpStep } from '@/components/vendor/otp-step';

type Step = 'PHONE' | 'OTP';

export default function VendorLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [viaWhatsApp, setViaWhatsApp] = useState(false);
    const [otpBypass, setOtpBypass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/settings')
            .then((r) => r.json())
            .then((d) => setOtpBypass(d.otpBypass === true))
            .catch(() => {});
    }, []);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (otpBypass) {
                const res = await fetch('/api/vendor/auth/bypass', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: `+91${phone}`, mode: 'login' }),
                });
                const data = await res.json();
                if (res.ok) {
                    router.push('/vendor/dashboard');
                } else {
                    setError(data.error || 'Login failed');
                }
                return;
            }

            const res = await fetch('/api/vendor/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+91${phone}`, mode: 'login' }),
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
            router.push('/vendor/dashboard');
        } else {
            setError(data.error || 'Invalid OTP');
        }
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

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <div className="text-center mb-6">
                    <CharminarIcon className="w-12 h-12 text-brand-blue mx-auto mb-2 opacity-80" />
                    <h1 className="font-herb text-3xl text-brand-red">Vendor Login</h1>
                    <p className="text-gray-400 text-xs font-medium mt-1">Access your dashboard</p>
                </div>
                <IslamicBorder className="mb-6" />

                <VendorOtpStep
                    phase={step}
                    phone={phone}
                    otp={otp}
                    loading={loading}
                    error={error}
                    viaWhatsApp={viaWhatsApp}
                    bypass={otpBypass}
                    onPhoneChange={setPhone}
                    onOtpChange={setOtp}
                    onSendOtp={handleSendOtp}
                    onVerifyOtp={handleVerifyOtp}
                />

                <p className="text-center text-sm text-gray-400 mt-6">
                    Haven't applied yet?{' '}
                    <Link href="/vendor/register" className="text-brand-blue font-bold">Register as a vendor</Link>
                </p>
            </PageContainer>
        </div>
    );
}
