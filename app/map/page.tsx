"use client";

import { useState } from "react";
import { Navbar, BottomNav, PageContainer } from "@/components/layout-components";
import zones from "@/data/zones.json";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import { MapPin, Info, ArrowRight, Expand } from "lucide-react";

// Import MapComponent dynamically to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/map-component'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center font-bold text-brand-blue/20">LOADING MAP...</div>
});

export default function Wayfinder() {
    const [selectedZone, setSelectedZone] = useState<any>(null);

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <section className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-blue mb-1">Wayfinder</h2>
                        <p className="text-sm text-gray-500">3 Venues. 1 Soulful Experience.</p>
                    </div>
                    <button className="p-2 bg-white rounded-xl shadow-sm border border-brand-blue/5 text-brand-blue">
                        <Expand className="w-5 h-5" />
                    </button>
                </section>

                {/* Interactive Map */}
                <div className="relative aspect-[4/5] bg-white rounded-3xl shadow-lg border border-brand-blue/5 overflow-hidden mb-6">
                    {/* Watercolor background within map container */}
                    <div className="absolute inset-0 watercolor-texture opacity-20 pointer-events-none z-0" />

                    <div className="w-full h-full relative z-10">
                        <MapComponent
                            imageUrl="/map-placeholder.jpg" // User to provide final image
                            imageWidth={1000}
                            imageHeight={1250}
                        />
                    </div>

                    {/* Overlay Controls */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none z-20">
                        <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm flex items-center gap-2 pointer-events-auto border border-brand-blue/5 text-[10px] font-bold text-brand-blue">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            LIVE CROWD DATA
                        </div>
                    </div>
                </div>

                {/* Legend / Selected Zone Info */}
                <AnimatePresence mode="wait">
                    {selectedZone ? (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-brand-blue text-white p-6 rounded-3xl shadow-xl border border-brand-gold/20"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10">
                                        <MapPin className="w-4 h-4 text-brand-gold" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Currently Exploring</span>
                                </div>
                                <button onClick={() => setSelectedZone(null)} className="text-[10px] font-bold text-white/40">CLOSE</button>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">{selectedZone.name}</h3>
                            <p className="text-sm text-white/70 mb-6 leading-relaxed">
                                {selectedZone.description} Located at **{selectedZone.venue}**.
                            </p>
                            <div className="flex gap-3">
                                <button className="flex-1 bg-brand-gold text-brand-blue font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2">
                                    VIEW STALLS <ArrowRight className="w-4 h-4" />
                                </button>
                                <button className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Info className="w-5 h-5 text-brand-gold" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="legend"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 gap-3"
                        >
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Select a venue to explore</p>
                            {zones.map(zone => (
                                <div
                                    key={zone.id}
                                    className="bg-white p-4 rounded-2xl border border-brand-blue/5 flex items-center gap-4 cursor-pointer active:bg-brand-cream/50 transition-colors"
                                    onClick={() => setSelectedZone(zone)}
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                                    >
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-brand-blue text-sm">{zone.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase">{zone.venue}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </PageContainer>
            <BottomNav />
        </div>
    );
}
