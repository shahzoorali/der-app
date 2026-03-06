import { Navbar, BottomNav, PageContainer } from "@/components/layout-components";
import { DroneShowSection } from "@/components/drone-show-section";
import { EventCard } from "@/components/feature-cards";
import { CharminarIcon, IslamicBorder, TileMosaicStrip, CrescentMoon } from "@/components/brand-elements";
import { InstagramEmbed } from "@/components/instagram-embed";
import { TimetableCard } from "@/components/timetable-card";
import vendors from "@/data/vendors.json";
import events from "@/data/events.json";
import { Map, Calendar, ShoppingBag, Gem, Sofa, Footprints, Baby, Sparkles, Heart, Users, LayoutGrid, Car, ArrowLeftRight, Percent, MapPin, Instagram, Utensils } from "lucide-react";
import Link from "next/link";

const featuredEvents = events.slice(0, 3);

const uniqueVendorNames = new Set(vendors.map(v => v.name));
const foodStallsCount = vendors.filter(v => v.category === "Food").length;
const retailStallsCount = vendors.length - foodStallsCount;

const categories = [
  { name: "Fashion", icon: ShoppingBag, count: new Set(vendors.filter(v => v.category === "Fashion").map(v => v.name)).size, color: "#2b5ea7" },
  { name: "Jewelry", icon: Gem, count: new Set(vendors.filter(v => v.category === "Jewelry").map(v => v.name)).size, color: "#e8c840" },
  { name: "Food", icon: Utensils, count: new Set(vendors.filter(v => v.category === "Food").map(v => v.name)).size, color: "#db2777" },
  { name: "Home Decor", icon: Sofa, count: new Set(vendors.filter(v => v.category === "Home Decor").map(v => v.name)).size, color: "#d42027" },
  { name: "Footwear", icon: Footprints, count: new Set(vendors.filter(v => v.category === "Footwear").map(v => v.name)).size, color: "#4a8c3f" },
  { name: "Kids", icon: Baby, count: new Set(vendors.filter(v => v.category === "Kids").map(v => v.name)).size, color: "#e8840a" },
  { name: "Lifestyle", icon: Sparkles, count: new Set(vendors.filter(v => v.category === "Lifestyle").map(v => v.name)).size, color: "#7c3aed" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageContainer>
        {/* Hero Section - Poster inspired */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-b from-brand-cream via-white to-brand-cream/50 border border-brand-blue/5 p-8 text-center">
          {/* Corner tile decorations */}
          <div className="absolute top-0 left-0 w-20 h-20 opacity-10">
            <svg viewBox="0 0 80 80"><polygon points="0,0 80,0 0,80" fill="#2b5ea7" /><polygon points="0,0 50,0 0,50" fill="#e8c840" /></svg>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
            <svg viewBox="0 0 80 80"><polygon points="80,0 0,0 80,80" fill="#2b5ea7" /><polygon points="80,0 30,0 80,50" fill="#e8c840" /></svg>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16 opacity-8">
            <svg viewBox="0 0 60 60"><polygon points="0,60 60,60 0,0" fill="#2b5ea7" opacity="0.1" /></svg>
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16 opacity-8">
            <svg viewBox="0 0 60 60"><polygon points="60,60 0,60 60,0" fill="#2b5ea7" opacity="0.1" /></svg>
          </div>

          {/* Crescent accent */}
          <div className="absolute top-3 right-6 text-brand-gold opacity-15">
            <CrescentMoon className="w-8 h-8" />
          </div>

          {/* Charminar */}
          <div className="text-brand-blue mb-3 flex justify-center">
            <CharminarIcon className="w-16 h-16 opacity-80" />
          </div>

          {/* Title */}
          <h1 className="font-herb text-4xl text-brand-red mb-1 leading-tight">
            Daawat-e-Ramzaan
          </h1>

          {/* Tagline divider */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-px bg-brand-gold" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-brand-blue uppercase">
              Shop • Indulge • Immerse
            </span>
            <div className="w-10 h-px bg-brand-gold" />
          </div>

          <p className="text-brand-blue font-bold text-sm mb-1">India's <span className="text-brand-red">Biggest</span> Ramzaan Experience</p>
          <p className="text-gray-400 text-xs font-medium mb-6">Season 5 • Hyderabad</p>

          {/* Date & Venue */}
          <div className="bg-brand-blue/5 rounded-2xl p-4 border border-brand-blue/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-brand-blue font-bold text-sm">5 – 19 March</span>
              <span className="w-1 h-1 bg-brand-gold rounded-full" />
              <span className="font-script text-brand-blue text-sm">Iftar to Sehri</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kings Palace, Gudimalkapur</p>
          </div>
        </section>

        {/* Islamic border divider */}
        <IslamicBorder className="mb-8" />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-blue/5 text-center">
            <span className="text-brand-blue font-bold text-2xl block">15</span>
            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Days</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-blue/5 text-center">
            <span className="text-brand-blue font-bold text-2xl block">{retailStallsCount}</span>
            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Retail Stalls</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-blue/5 text-center">
            <span className="text-brand-blue font-bold text-2xl block">{foodStallsCount}</span>
            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Food Stalls</span>
          </div>
        </div>

        {/* Uber Partnership Offer — matches uber.com design */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm font-uber">
          {/* Uber header bar */}
          <div className="bg-gradient-to-r from-black via-zinc-900 to-black px-6 py-4 flex items-center justify-between relative overflow-hidden">
            {/* Decorative background reflections */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

            <span className="relative z-10 text-white text-xl font-medium tracking-tight drop-shadow-sm" style={{ fontFamily: "'UberMove', sans-serif" }}>Uber</span>
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5">
                <span className="text-[8px] font-bold text-white/70">×</span>
              </div>
              <span className="font-herb text-white/90 text-[15px] drop-shadow-sm">Daawat-e-Ramzaan</span>
            </div>
          </div>

          <div className="p-6">
            {/* Headline */}
            <h3 className="text-black font-black text-2xl tracking-tight mb-1 leading-tight">
              Go to <span className="font-herb font-normal">Daawat-e-Ramzaan</span>
            </h3>
            <p className="text-gray-500 text-sm mb-6">Arrive in style. Get <span className="font-black text-black">50% off</span> on your ride.</p>

            {/* Offer badge — redesign as a voucher */}
            <div className="relative mb-6 group cursor-default">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center gap-4 bg-green-50 rounded-2xl p-4 border border-green-100 overflow-hidden">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200">
                  <Percent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-0.5">Uber Sponsored Offer</div>
                  <div className="text-base font-black text-black leading-tight tracking-tight">50% Off 2-Way Trip</div>
                  <div className="text-xs text-gray-500">Pickup & drop to Kings Palace</div>
                </div>
                {/* Decorative circle cuts for voucher look */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border border-green-100" />
              </div>
            </div>

            {/* CTA — Premium Uber Button */}
            <a
              href="https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[nickname]=Kings%20Palace&dropoff[formatted_address]=Kings%20Palace%20Gudimalkapur"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-full bg-black text-white p-4 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 active:scale-[0.98] transition-all"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:text-black transition-all duration-300">
                    <img src="/top_bar_rides_3d.png" alt="Uber Ride" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5 group-hover:text-gray-300 transition-colors">Launch App</span>
                    <span className="block text-lg font-black tracking-tight leading-none" style={{ fontFamily: "'UberMove', sans-serif" }}>Book Your Uber</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowLeftRight className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                </div>
              </div>
            </a>

            {/* Farah Khan Instagram Embed */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-6 bg-gray-200" />
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">Special Message FROM Farah Khan</div>
                <div className="h-px w-6 bg-gray-200" />
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50/50 p-1">
                <InstagramEmbed url="https://www.instagram.com/p/DVBoGFwAVPP/" />
              </div>
            </div>

            <p className="text-[9px] text-center text-gray-300 font-medium uppercase tracking-[0.3em] mt-6">
              Official Mobility Partner • <span className="text-black/40">Uber × Daawat-e-Ramzaan</span>
            </p>
          </div>
        </section>

        {/* Tile Mosaic decorative strip */}
        <TileMosaicStrip />

        {/* Ramadan Timetable Widget */}
        <TimetableCard />

        {/* Categories / Explore */}
        < section className="mb-10" >
          <h3 className="text-brand-blue font-bold text-xl mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-gold" />
            Explore Bazaar
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
              <Link key={cat.name} href={`/bazaar?category=${cat.name}`} className="group">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-blue/5 text-center group-active:scale-95 transition-transform">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-brand-blue text-sm">{cat.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold">{cat.count} Brands</p>
                </div>
              </Link>
            ))}
          </div>
        </section >

        {/* Islamic border divider */}
        < IslamicBorder className="mb-8" />

        {/* Drone Show Feature - Dynamic Section */}
        <DroneShowSection />

        {/* Instagram Community Section */}
        < section className="mb-10 relative overflow-hidden rounded-3xl bg-white border border-brand-blue/10 p-8 text-center" >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-gold to-brand-red" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
              <Instagram className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-brand-blue font-bold text-2xl mb-2">Join the Celebration</h3>
            <p className="text-xs text-gray-500 mb-6 px-4">Follow us for live updates, Iftar moments, and exclusive festival highlights.</p>

            <a
              href="https://www.instagram.com/daawateramzaan/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-full font-bold text-sm shadow-md hover:bg-brand-blue/90 active:scale-95 transition-all mb-8"
            >
              <Instagram className="w-4 h-4" />
              FOLLOW @DAAWATERAMZAAN
            </a>


          </div>
        </section >

        {/* Map Shortcut - enhanced with Charminar */}
        {/* < Link href="/map" className="block relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-gold to-amber-400 p-6 text-brand-blue group mb-6" >
          <div className="absolute top-2 right-2 opacity-10">
            <CharminarIcon className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-2xl tracking-tight">Open Wayfinder</h3>
              <p className="text-xs font-bold opacity-60">Navigate between 3 Venues seamlessly</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Map className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute inset-0 bg-white/10 group-active:bg-transparent transition-colors" />
        </Link > */}

        {/* Sponsors Section */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-white border border-brand-blue/5 p-8">
          <h3 className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">Our Partners</h3>

          {/* Title Sponsor */}
          <div className="text-center mb-8 pb-8 border-b border-brand-blue/5">
            <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest block mb-3">Title Sponsor</span>
            <img src="/ahmed-al-maghribi-logo.png" alt="Ahmed Al Maghribi" className="h-20 w-auto object-contain mx-auto" />
          </div>

          {/* Powered By */}
          <div className="mb-8 pb-8 border-b border-brand-blue/5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-4 text-center">Powered By</span>
            <div className="flex items-center justify-center gap-8">
              <img src="/priya-logo.svg" alt="Priya Foods" className="h-12 w-auto object-contain opacity-80" />
              <img src="/tg-toursim.svg" alt="Telangana Tourism" className="h-12 w-auto object-contain opacity-80" />
            </div>
          </div>

          {/* Associate Sponsors */}
          <div className="mb-8 pb-8 border-b border-brand-blue/5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-4 text-center">Associate Sponsors</span>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <img src="/sbi-logo.svg" alt="SBI" className="h-10 w-auto object-contain opacity-80" />
              <img src="/farmaan-logo.svg" alt="Farmaan" className="h-10 w-auto object-contain opacity-80" />
              <img src="/golddrop-logo.png" alt="Gold Drop" className="h-10 w-auto object-contain opacity-80" />
            </div>
          </div>

          {/* Special Partners */}
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-4 text-center">Special Partners</span>
            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-1">
                <img src="/heerabhai-logo.svg" alt="Heerabhai" className="h-10 w-auto object-contain opacity-80" />
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Jewellery Partner</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-black font-bold text-lg tracking-tight" style={{ fontFamily: "'UberMove', sans-serif" }}>Uber</span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Mobility Partner</span>
              </div>
            </div>
          </div>
        </section>

        {/* Instagram Highlights (Previous Seasons) */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-white border border-brand-blue/5 py-8 px-4 sm:p-8">
          <h3 className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">Previous Seasons</h3>
          <div className="flex md:justify-center gap-5 sm:gap-6 overflow-x-auto pb-4 snap-x px-2 pt-1 no-scrollbar">
            {[
              { label: 'Season 1', img: '/images/seasons/der1.jpg', url: 'https://www.instagram.com/stories/highlights/18061041643929781/' },
              { label: 'Season 2', img: '/images/seasons/der2.jpg', url: 'https://www.instagram.com/stories/highlights/18482117515055713/' },
              { label: 'Season 3', img: '/images/seasons/der3.jpg', url: 'https://www.instagram.com/stories/highlights/18080637667533097/' },
              { label: 'Season 4', img: '/images/seasons/der4.jpg', url: 'https://www.instagram.com/stories/highlights/17894334552149258/' }
            ].map((season, i) => (
              <a
                key={i}
                href={season.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group snap-center"
              >
                {/* Instagram story ring effect */}
                <div className="w-[68px] h-[68px] sm:w-20 sm:h-20 rounded-full p-[3px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] group-hover:scale-105 transition-transform shadow-sm">
                  <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-white">
                    <img
                      src={season.img}
                      alt={season.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-brand-blue transition-colors">
                  {season.label}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Footer branding */}
        < div className="text-center py-8 mt-4" >
          <div className="flex justify-center mb-3 text-brand-blue opacity-20">
            <CharminarIcon className="w-10 h-10" />
          </div>
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">
            Extraa Media Events & LLP
          </p>
        </div >
      </PageContainer >
      <BottomNav />
    </div >
  );
}
