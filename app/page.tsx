import { Navbar, BottomNav, PageContainer } from "@/components/layout-components";
import { CharminarIcon, IslamicBorder, TileMosaicStrip, CrescentMoon } from "@/components/brand-elements";
import { InstagramEmbed } from "@/components/instagram-embed";
import { Instagram, Store, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageContainer>
        {/* Hero Section */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-b from-brand-cream via-white to-brand-cream/50 border border-brand-blue/5 p-8 text-center">
          <div className="absolute top-0 left-0 w-20 h-20 opacity-10">
            <svg viewBox="0 0 80 80"><polygon points="0,0 80,0 0,80" fill="#2b5ea7" /><polygon points="0,0 50,0 0,50" fill="#e8c840" /></svg>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
            <svg viewBox="0 0 80 80"><polygon points="80,0 0,0 80,80" fill="#2b5ea7" /><polygon points="80,0 30,0 80,50" fill="#e8c840" /></svg>
          </div>

          <div className="absolute top-3 right-6 text-brand-gold opacity-15">
            <CrescentMoon className="w-8 h-8" />
          </div>

          <div className="text-brand-blue mb-3 flex justify-center">
            <CharminarIcon className="w-16 h-16 opacity-80" />
          </div>

          <p className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase mb-2">Welcome to</p>

          <h1 className="font-herb text-4xl text-brand-red mb-1 leading-tight">
            Daawat-e-Ramzaan
          </h1>

          <div className="flex items-center justify-center gap-3 mb-4 mt-2">
            <div className="w-10 h-px bg-brand-gold" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-brand-blue uppercase">
              Shop • Indulge • Immerse
            </span>
            <div className="w-10 h-px bg-brand-gold" />
          </div>

          <p className="text-brand-blue font-bold text-sm mb-1">India's <span className="text-brand-red">Biggest</span> Ramzaan Experience</p>
          <p className="text-gray-400 text-xs font-medium mb-6">2027 • Season 6</p>

          {/* Multicity announcement */}
          <div className="bg-brand-blue/5 rounded-2xl p-4 border border-brand-blue/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-brand-blue" />
              <span className="text-brand-blue font-bold text-sm">Going Multicity</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cities to be announced soon</p>
          </div>
        </section>

        <IslamicBorder className="mb-8" />

        {/* Vendor CTA */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-brand-blue p-8 text-center text-white shadow-lg">
          <div className="absolute top-0 right-0 opacity-10">
            <CharminarIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-brand-gold" />
            </div>
            <h3 className="font-bold text-2xl mb-2">Set Up Your Stall</h3>
            <p className="text-white/70 text-sm mb-6 px-2">
              Vendor registrations for Season 6 are now open. Apply today to be part of India's biggest Ramzaan experience.
            </p>
            <Link
              href="/vendor/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-gold text-brand-blue rounded-full font-bold text-sm shadow-md hover:bg-white active:scale-95 transition-all mb-3"
            >
              Register as a Vendor
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs">
              <Link href="/vendor/login" className="text-white/70 underline hover:text-white">
                Already applied? Log in to your dashboard
              </Link>
            </p>
          </div>
        </section>

        <TileMosaicStrip />

        {/* Instagram Community Section */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-white border border-brand-blue/10 p-8 text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-gold to-brand-red" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
              <Instagram className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-brand-blue font-bold text-2xl mb-2">Join the Celebration</h3>
            <p className="text-xs text-gray-500 mb-6 px-4">Follow us for Season 6 announcements, city reveals, and updates.</p>

            <a
              href="https://www.instagram.com/daawateramzaan/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-full font-bold text-sm shadow-md hover:bg-brand-blue/90 active:scale-95 transition-all"
            >
              <Instagram className="w-4 h-4" />
              FOLLOW @DAAWATERAMZAAN
            </a>
          </div>
        </section>

        {/* Sponsors Section */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-white border border-brand-blue/5 p-8">
          <h3 className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">Our Partners</h3>

          {/* Title Sponsor */}
          <div className="text-center mb-2">
            <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest block mb-3">Title Sponsor</span>
            <img src="/ahmed-al-maghribi-logo.png" alt="Ahmed Al Maghribi" className="h-20 w-auto object-contain mx-auto" />
          </div>
        </section>

        {/* Previous Seasons */}
        <section className="mb-10 relative overflow-hidden rounded-3xl bg-white border border-brand-blue/5 py-8 px-4 sm:p-8">
          <h3 className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">Previous Seasons</h3>
          <div className="flex md:justify-center gap-5 sm:gap-6 overflow-x-auto pb-4 snap-x px-2 pt-1 no-scrollbar">
            {[
              { label: 'Season 1', img: '/images/seasons/der1.jpg', url: 'https://www.instagram.com/stories/highlights/18061041643929781/' },
              { label: 'Season 2', img: '/images/seasons/der2.jpg', url: 'https://www.instagram.com/stories/highlights/18482117515055713/' },
              { label: 'Season 3', img: '/images/seasons/der3.jpg', url: 'https://www.instagram.com/stories/highlights/18080637667533097/' },
              { label: 'Season 4', img: '/images/seasons/der4.jpg', url: 'https://www.instagram.com/stories/highlights/17894334552149258/' },
              { label: 'Season 5', img: '/images/seasons/der5.jpg', url: 'https://www.instagram.com/daawateramzaan/' }
            ].map((season, i) => (
              <a
                key={i}
                href={season.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group snap-center"
              >
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
        <div className="text-center py-8 mt-4">
          <div className="flex justify-center mb-3 text-brand-blue opacity-20">
            <CharminarIcon className="w-10 h-10" />
          </div>
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">
            Extraa Media Events & LLP
          </p>
        </div>
      </PageContainer>
      <BottomNav />
    </div>
  );
}
