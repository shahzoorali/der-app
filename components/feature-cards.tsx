"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight, Star, Navigation } from "lucide-react";
import Image from "next/image";

export function VendorCard({ vendor }: { vendor: any }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-brand-blue/5 flex gap-4 items-center group"
        >
            <div className="w-20 h-20 rounded-xl bg-brand-cream flex-shrink-0 relative overflow-hidden ring-1 ring-brand-gold/20 flex flex-col items-center justify-center">
                <div className="absolute inset-0 watercolor-texture opacity-50" />
                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                    <span className="text-[9px] font-bold text-brand-blue/60 uppercase tracking-widest mb-1">Stall</span>
                    <span className="font-black text-brand-blue text-2xl leading-none">
                        {vendor.stall || "TBA"}
                    </span>
                </div>
            </div>
            <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue/50">
                        {vendor.category}
                    </span>
                </div>
                <h3 className="font-bold text-brand-blue text-base leading-tight">
                    {vendor.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1 italic">
                    "{vendor.specialty}"
                </p>
            </div>
            {/* Hide "Navigate Me" button for now */}
            {/* 
            <button className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl bg-brand-blue/5 hover:bg-brand-gold transition-colors text-brand-blue border border-brand-blue/10 flex-shrink-0 active:scale-95">
                <Navigation className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-center leading-tight">Navigate<br />Me</span>
            </button>
            */}
        </motion.div>
    );
}

export function EventCard({ event }: { event: any }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue to-blue-900 text-white p-5 min-w-[280px] shadow-lg"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Star className="w-16 h-16 fill-current" />
            </div>
            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-brand-gold text-brand-blue font-bold text-[10px] uppercase">
                        {event.time}
                    </span>
                    <span className="text-[10px] font-medium text-white/60">
                        {event.venue}
                    </span>
                </div>
                <h3 className="font-bold text-lg leading-tight">
                    {event.title}
                </h3>
                <p className="text-xs text-white/70 line-clamp-2">
                    {event.description}
                </p>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/10">
                    <span className="text-xs font-bold text-brand-gold">
                        {event.artist}
                    </span>
                    <button className="text-[10px] font-bold underline underline-offset-4 decoration-brand-gold">
                        REMIND ME
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
