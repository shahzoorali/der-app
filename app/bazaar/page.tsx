"use client";

import { useState } from "react";
import { Navbar, BottomNav, PageContainer } from "@/components/layout-components";
import { VendorCard } from "@/components/feature-cards";
import vendors from "@/data/vendors.json";
import { Search, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["All", "Food", "Fashion", "Jewelry", "Home Decor", "Footwear", "Kids", "Beauty", "Fragrance", "Lifestyle"];

export default function Bazaar() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = vendor.name.toLowerCase().includes(search.toLowerCase()) ||
            vendor.specialty.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === "All" || vendor.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <section className="mb-6">
                    <h2 className="text-2xl font-bold text-brand-blue mb-2">Bazaar & Dastarkhwan</h2>
                    <p className="text-sm text-gray-500">Explore curated stalls from across the country.</p>
                </section>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search vendors or specialties..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-brand-blue/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all shadow-sm"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute inset-y-0 right-4 flex items-center"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Category Pills */}
                <div className="flex overflow-x-auto gap-2 mb-8 pb-2 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                                : "bg-white text-gray-400 border border-brand-blue/5"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Results Info */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        {filteredVendors.length} Vendors Found
                    </span>
                    <button className="flex items-center gap-1 text-brand-blue text-[10px] font-bold">
                        <Filter className="w-3 h-3" />
                        LATEST FIRST
                    </button>
                </div>

                {/* Vendor List */}
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredVendors.map((vendor, index) => (
                            <motion.div
                                key={vendor.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <VendorCard vendor={vendor} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredVendors.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-medium">No vendors match your search.</p>
                        <button
                            onClick={() => { setSearch(""); setActiveCategory("All"); }}
                            className="mt-4 text-brand-red text-sm font-bold underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </PageContainer>
            <BottomNav />
        </div>
    );
}
