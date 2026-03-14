"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface Dua {
  number: number;
  emoji: string;
  title: string;
  subtitle?: string;
  arabic: string;
  transliteration: string;
  meaning: string;
}

const duas: Dua[] = [
  {
    number: 1,
    emoji: "1️⃣",
    title: "The Best Dua for Laylatul Qadr",
    subtitle: "Taught by the Prophet ﷺ to Aisha bint Abi Bakr.",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni.",
    meaning: "O Allah, You are Most Forgiving and You love to forgive, so forgive me.",
  },
  {
    number: 2,
    emoji: "2️⃣",
    title: "Dua for Forgiveness",
    arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
    transliteration: "Rabbi ighfir li wa tub 'alayya innaka anta At-Tawwab Ar-Raheem.",
    meaning: "My Lord, forgive me and accept my repentance. Indeed You are the Most Accepting of repentance, the Most Merciful.",
  },
  {
    number: 3,
    emoji: "3️⃣",
    title: "Dua for Good in This Life and the Hereafter",
    subtitle: "From the Qur'an.",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً\nوَفِي الْآخِرَةِ حَسَنَةً\nوَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanah\nwa fil-akhirati hasanah\nwa qina 'adhaban-nar.",
    meaning: "Our Lord, grant us good in this world and good in the Hereafter and protect us from the punishment of the Fire.",
  },
  {
    number: 4,
    emoji: "4️⃣",
    title: "Dua for Steadfast Faith",
    arabic: "اللَّهُمَّ يَا مُقَلِّبَ الْقُلُوبِ\nثَبِّتْ قَلْبِي عَلَى دِينِكَ",
    transliteration: "Allahumma ya Muqallibal qulub\nthabbit qalbi 'ala deenik.",
    meaning: "O Turner of hearts, keep my heart firm upon Your religion.",
  },
  {
    number: 5,
    emoji: "5️⃣",
    title: "Dua for Parents",
    arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ\nوَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbi ighfir li wa liwalidayya\nwarhamhuma kama rabbayani saghira.",
    meaning: "My Lord, forgive me and my parents and have mercy on them as they raised me when I was small.",
  },
  {
    number: 6,
    emoji: "6️⃣",
    title: "Dua for Well-Being",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ\nوَالْعَافِيَةَ",
    transliteration: "Allahumma inni as'aluka al-'afwa wal-'afiyah.",
    meaning: "O Allah, I ask You for forgiveness and well-being.",
  },
  {
    number: 7,
    emoji: "7️⃣",
    title: "Dua for Guidance",
    arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا\nبَعْدَ إِذْ هَدَيْتَنَا\nوَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً",
    transliteration: "Rabbana la tuzigh qulubana\nba'da idh hadaytana\nwahab lana min ladunka rahmah.",
    meaning: "Our Lord, do not let our hearts deviate after You have guided us and grant us mercy from Yourself.",
  },
];

const dhikrTips = [
  "Astaghfirullah (seek forgiveness)",
  "SubhanAllah (Glory be to Allah)",
  "Alhamdulillah (All praise is for Allah)",
  "Allahu Akbar (Allah is the Greatest)",
  "Allahumma salli 'ala Muhammad ﷺ",
];

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) =>
  Math.abs(offset) * velocity;

// Pre-generate 20 "random" styles so they are consistent between server and client hydration
const starStyles = Array.from({ length: 20 }).map((_, i) => {
  return {
    top: `${(i * 137) % 100}%`,
    left: `${(i * 293) % 100}%`,
    opacity: 0.1 + ((i * 17) % 30) / 100,
    animationDelay: `${((i * 11) % 30) / 10}s`,
    animationDuration: `${2 + ((i * 19) % 30) / 10}s`,
  };
});

export function LaylatulQadrDuas() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isDragging, setIsDragging] = useState(false);

  // Show the tip slide as the last one
  const totalSlides = duas.length + 1; // 7 duas + 1 tip
  const duaIndex = page % totalSlides;
  const isTipSlide = duaIndex === duas.length;

  const paginate = useCallback(
    (newDirection: number) => {
      setPage(([prev]) => {
        const next = (prev + newDirection + totalSlides) % totalSlides;
        return [next, newDirection];
      });
    },
    [totalSlides]
  );

  const handlePrev = () => {
    paginate(-1);
  };
  const handleNext = () => {
    paginate(1);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section className="mb-8 mt-2">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-brand-blue font-bold text-lg leading-tight">
            🌙 Laylatul Qadr Duas
          </h3>
          <p className="text-[10px] text-gray-400 font-medium">
            Swipe through special duas for the Night of Power
          </p>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f1b3d] via-[#162554] to-[#1a1145] border border-white/5 shadow-xl">
        {/* Decorative stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {starStyles.map((style, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={style}
            />
          ))}
        </div>

        {/* Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Slide Content */}
        <div className="relative min-h-[380px] flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(_e, { offset, velocity }) => {
                setIsDragging(false);
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  handleNext();
                } else if (swipe > swipeConfidenceThreshold) {
                  handlePrev();
                }
              }}
              className="absolute inset-0 p-6 flex flex-col justify-center cursor-grab active:cursor-grabbing"
            >
              {isTipSlide ? (
                /* Tip Slide */
                <div className="text-center">
                  <div className="text-3xl mb-4">💡</div>
                  <h4 className="text-brand-gold font-bold text-lg mb-1">
                    Tip for Laylatul Qadr
                  </h4>
                  <p className="text-white/60 text-xs mb-5">
                    Increase these simple dhikr:
                  </p>
                  <div className="space-y-2.5">
                    {dhikrTips.map((tip, i) => (
                      <div
                        key={i}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 font-medium"
                      >
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Dua Slide */
                <div className="text-center">
                  {/* Dua Number & Title */}
                  <div className="mb-1">
                    <span className="text-[10px] text-brand-gold font-bold uppercase tracking-[0.2em]">
                      Dua {duas[duaIndex].number} of 7
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base mb-1 leading-snug px-2">
                    {duas[duaIndex].title}
                  </h4>
                  {duas[duaIndex].subtitle && (
                    <p className="text-white/40 text-[11px] mb-4 italic">
                      {duas[duaIndex].subtitle}
                    </p>
                  )}
                  {!duas[duaIndex].subtitle && <div className="mb-4" />}

                  {/* Arabic */}
                  <div
                    className="text-[22px] leading-[2] font-arabic text-white mb-4 px-2"
                    dir="rtl"
                  >
                    {duas[duaIndex].arabic.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < duas[duaIndex].arabic.split("\n").length - 1 && (
                          <br />
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-8 h-px bg-brand-gold/30" />
                    <div className="w-1.5 h-1.5 bg-brand-gold/40 rounded-full" />
                    <div className="w-8 h-px bg-brand-gold/30" />
                  </div>

                  {/* Transliteration */}
                  <p className="text-white/70 text-xs font-bold italic mb-3 px-4 leading-relaxed">
                    &ldquo;
                    {duas[duaIndex].transliteration
                      .split("\n")
                      .map((line, i) => (
                        <span key={i}>
                          {line}
                          {i <
                            duas[duaIndex].transliteration.split("\n").length -
                              1 && <br />}
                        </span>
                      ))}
                    &rdquo;
                  </p>

                  {/* Meaning */}
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <p className="text-white/50 text-[11px] leading-relaxed font-medium">
                      {duas[duaIndex].meaning}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="relative z-10 flex items-center justify-between px-4 pb-5">
          {/* Prev Button */}
          <button
            onClick={handlePrev}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white active:scale-90 transition-all"
            aria-label="Previous dua"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const dir = i > duaIndex ? 1 : -1;
                  setPage([i, dir]);
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === duaIndex
                    ? "w-6 h-2 bg-brand-gold"
                    : "w-2 h-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white active:scale-90 transition-all"
            aria-label="Next dua"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
