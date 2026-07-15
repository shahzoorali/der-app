'use client';

import React from 'react';

type Props = {
    phase: 'PHONE' | 'OTP';
    phone: string;
    otp: string;
    loading: boolean;
    error: string;
    viaWhatsApp?: boolean;
    onPhoneChange: (v: string) => void;
    onOtpChange: (v: string) => void;
    onSendOtp: (e: React.FormEvent) => void;
    onVerifyOtp: (e: React.FormEvent) => void;
};

export function VendorOtpStep({ phase, phone, otp, loading, error, viaWhatsApp, onPhoneChange, onOtpChange, onSendOtp, onVerifyOtp }: Props) {
    return (
        <div className="flex flex-col gap-6">
            {error && (
                <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red p-3 rounded-xl text-center text-sm">
                    {error}
                </div>
            )}

            {phase === 'PHONE' && (
                <form onSubmit={onSendOtp} className="flex flex-col gap-6">
                    <label className="text-xl text-center font-bold text-brand-blue">
                        Enter your phone number
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="bg-white border border-brand-blue/10 rounded-2xl p-4 text-xl text-brand-blue font-bold">
                            +91
                        </div>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit number"
                            className="w-full bg-white border border-brand-blue/10 rounded-2xl p-4 text-xl text-center focus:outline-none focus:border-brand-blue transition-all tracking-wider"
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || phone.length !== 10}
                        className="w-full py-4 bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 text-white rounded-2xl text-lg font-bold transition-colors"
                    >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>
            )}

            {phase === 'OTP' && (
                <form onSubmit={onVerifyOtp} className="flex flex-col gap-6">
                    <label className="text-xl text-center font-bold text-brand-blue">
                        Enter OTP
                    </label>
                    <p className="text-center text-gray-400 -mt-4 text-sm">
                        Sent to +91 {phone} {viaWhatsApp ? 'via WhatsApp' : 'via SMS'}
                    </p>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="mx-auto w-48 bg-white border border-brand-blue/10 rounded-2xl p-4 text-3xl text-center focus:outline-none focus:border-brand-blue transition-all tracking-[0.5em]"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading || otp.length !== 4}
                        className="w-full py-4 bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 text-white rounded-2xl text-lg font-bold transition-colors"
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>
            )}
        </div>
    );
}
