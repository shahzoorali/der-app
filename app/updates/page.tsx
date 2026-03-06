"use client";

import { useState, useEffect } from "react";
import { Navbar, BottomNav, PageContainer } from "@/components/layout-components";
import { Bell, Info, Star, Users, MapPin, Clock } from "lucide-react";

const DescriptionRenderer = ({ text }: { text: string }) => {
    // Regex to find URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <div className="text-sm text-gray-500 leading-relaxed mb-4 font-medium flex flex-col gap-3">
            <p>
                {parts.map((part, i) => {
                    if (part.match(urlRegex)) {
                        return (
                            <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-blue underline break-all"
                            >
                                {part}
                            </a>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </p>
            {/* Find all Instagram links and render iframes for them */}
            {parts
                .filter((part) => part.match(urlRegex) && part.includes('instagram.com'))
                .map((igUrl, i) => {
                    // Normalize IG URL to get embed link
                    let embedUrl = igUrl.split('?')[0]; // remove query params
                    if (!embedUrl.endsWith('/')) embedUrl += '/';
                    embedUrl += 'embed';

                    return (
                        <div key={`ig-${i}`} className="w-full overflow-hidden rounded-xl border border-gray-200 mt-2">
                            <iframe
                                src={embedUrl}
                                className="w-full"
                                height="400"
                                frameBorder="0"
                                scrolling="no"
                                allowTransparency={true}
                                allow="encrypted-media"
                            />
                        </div>
                    );
                })}
        </div>
    );
};

export default function Updates() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const res = await fetch("/api/announcements");
                const data = await res.json();
                setAnnouncements(data);
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAnnouncements();
        // optionally, setting up a polling every minute would be neat for a live event
        const interval = setInterval(fetchAnnouncements, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-brand-blue">Announcements</h2>
                    <div className="p-2 bg-brand-gold text-brand-blue rounded-xl shadow-lg ring-4 ring-brand-gold/10 relative">
                        {/* Live indicator if we polled data in last 1min */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        <Bell className="w-5 h-5 fill-current" />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-blue/20 border-t-brand-blue rounded-full mx-auto mb-4" />
                        <p className="text-gray-400 text-sm font-medium">Fetching latest updates...</p>
                    </div>
                ) : (
                    <section className="space-y-6">
                        {announcements.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-3xl border border-brand-blue/5">
                                <p className="text-gray-400 text-sm font-medium">No announcements yet.</p>
                            </div>
                        ) : null}
                        {announcements.map((item) => (
                            <div
                                key={item.id}
                                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${item.priority === 'high' ? 'border-brand-red ring-1 ring-brand-red/10' : 'border-brand-blue/5'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'event' ? 'bg-brand-red/10 text-brand-red' :
                                            item.type === 'crowd' ? 'bg-brand-gold/20 text-brand-gold' :
                                                'bg-brand-blue/10 text-brand-blue'
                                            }`}>
                                            {item.type === 'event' ? <Star className="w-4 h-4" /> :
                                                item.type === 'crowd' ? <Users className="w-4 h-4" /> :
                                                    <Info className="w-4 h-4" />}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${item.priority === 'high' ? 'text-brand-red' : 'text-gray-400'
                                            }`}>
                                            {item.type === 'crowd' ? 'Crowd Alert' : item.type === 'event' ? 'Performance' : 'Update'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase">{item.time}</span>
                                    </div>
                                </div>

                                <h3 className="font-bold text-brand-blue mb-2 text-lg">
                                    {item.title}
                                </h3>

                                <DescriptionRenderer text={item.description} />

                                <div className="flex items-center gap-1.5 text-brand-blue/50">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.venue}</span>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                <div className="mt-12 text-center py-6 bg-brand-cream/50 rounded-2xl border border-dashed border-brand-blue/10">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">End of today's broadcasts</p>
                </div>
            </PageContainer>
            <BottomNav />
        </div>
    );
}
