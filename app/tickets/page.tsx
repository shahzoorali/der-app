"use client";

import { useState } from "react";
import { Navbar, BottomNav, PageContainer } from "@/components/layout-components";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, CreditCard, CheckCircle, Download, Share2, Info, ArrowRight } from "lucide-react";
import QRCode from "react-qr-code";

export default function Tickets() {
    const [step, setStep] = useState(1); // 1: Info, 2: Form/Payment, 3: Success/QR
    const [ticketCount, setTicketCount] = useState(1);

    const pricePerTicket = 499;
    const totalAmount = ticketCount * pricePerTicket;

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <section className="bg-brand-blue rounded-3xl p-8 text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <span className="text-brand-gold font-bold text-[10px] uppercase tracking-widest mb-2 block">Premium Entry</span>
                                    <h2 className="text-3xl font-bold mb-4">Shaan-E-Ramzan</h2>
                                    <p className="text-sm text-white/70 leading-relaxed mb-6">
                                        Immerse yourself in Islamic history, architecture, and art. An interactive journey through time.
                                    </p>
                                    <div className="flex items-center gap-2 text-brand-gold font-bold text-xl">
                                        <Ticket className="w-6 h-6" />
                                        ₹{pricePerTicket} / person
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Ticket className="w-32 h-32 rotate-12" />
                                </div>
                            </section>

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-blue/5">
                                <h3 className="font-bold text-brand-blue mb-4">Select Tickets</h3>
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-sm font-medium text-gray-500">Number of Visitors</span>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                                            className="w-10 h-10 rounded-xl border border-brand-blue/10 flex items-center justify-center text-brand-blue font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="text-xl font-bold text-brand-blue">{ticketCount}</span>
                                        <button
                                            onClick={() => setTicketCount(ticketCount + 1)}
                                            className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-brand-blue/5 p-4 rounded-2xl flex items-center justify-between mb-8">
                                    <span className="text-xs font-bold text-brand-blue/60 uppercase">Total Amount</span>
                                    <span className="text-lg font-bold text-brand-blue">₹{totalAmount}</span>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full bg-brand-gold text-brand-blue font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20"
                                >
                                    CONTINUE TO PAYMENT <CreditCard className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-brand-cream rounded-2xl border border-brand-blue/5">
                                <Info className="w-5 h-5 text-brand-blue/40 mt-0.5" />
                                <p className="text-[10px] text-gray-400 font-medium italic">
                                    Note: Entry to <span className="font-herb not-italic text-xs">Daawat-E-Ramzaan</span> and Crescent Bazaar is FREE. This ticket is exclusively for the Shaan-E-Ramzan Immersive Zones.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-bold text-brand-blue">Complete Booking</h2>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-blue/5 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block tracking-widest">Full Name</label>
                                    <input type="text" placeholder="Enter your name" className="w-full bg-brand-cream/50 border border-brand-blue/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20" defaultValue="Guest User" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block tracking-widest">Phone Number</label>
                                    <input type="tel" placeholder="+91 00000 00000" className="w-full bg-brand-cream/50 border border-brand-blue/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-blue/5">
                                <h3 className="font-bold text-brand-blue mb-4">Mock Payment</h3>
                                <p className="text-xs text-gray-500 mb-6 font-medium">This is a prototype simulation. No real money will be charged.</p>
                                <button
                                    onClick={() => {
                                        setTimeout(() => setStep(3), 1500);
                                    }}
                                    className="w-full bg-brand-blue text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                                >
                                    SIMULATE ₹{totalAmount} UPI PAYMENT <ArrowRight className="w-5 h-5 text-brand-gold" />
                                </button>
                            </div>

                            <button onClick={() => setStep(1)} className="w-full text-brand-blue/40 font-bold text-xs">GO BACK</button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-brand-blue mb-2">Booking Confirmed!</h2>
                            <p className="text-sm text-gray-500 mb-8 font-medium">Your entry pass for Shaan-E-Ramzan is ready.</p>

                            <div className="bg-white rounded-[40px] p-10 shadow-xl border-2 border-brand-gold/20 mb-8 relative max-w-xs mx-auto overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-3 bg-brand-gold" />
                                <div className="mb-6 flex justify-between items-start">
                                    <div className="text-left">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block leading-none mb-1">Pass For</span>
                                        <span className="text-xs font-bold text-brand-blue">Shaan-E-Ramzan</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block leading-none mb-1">Guests</span>
                                        <span className="text-xs font-bold text-brand-blue">{ticketCount}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-brand-cream/50 rounded-2xl ring-1 ring-brand-blue/5 mb-6">
                                    <QRCode value={`DER-TICKET-${Math.random().toString(36).substring(7).toUpperCase()}`} size={180} className="w-full h-auto" fgColor="#2b5ea7" />
                                </div>

                                <div className="text-xs font-mono font-bold text-brand-blue/30 tracking-widest">
                                    DER-2026-XP
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex-1 bg-white border border-brand-blue/10 rounded-2xl py-4 flex items-center justify-center gap-2 text-brand-blue font-bold text-sm shadow-sm ring-brand-gold/5 active:ring-4">
                                    <Download className="w-4 h-4 text-brand-gold" /> SAVE
                                </button>
                                <button className="flex-1 bg-white border border-brand-blue/10 rounded-2xl py-4 flex items-center justify-center gap-2 text-brand-blue font-bold text-sm shadow-sm ring-brand-gold/5 active:ring-4">
                                    <Share2 className="w-4 h-4 text-brand-gold" /> SHARE
                                </button>
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="mt-10 text-brand-red font-bold text-xs underline decoration-brand-gold underline-offset-4"
                            >
                                BOOK ANOTHER ENTRY
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </PageContainer>
            <BottomNav />
        </div>
    );
}
