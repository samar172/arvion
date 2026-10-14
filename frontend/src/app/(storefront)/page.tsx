"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Gift, Globe2, HandHeart, Truck } from "lucide-react";
import api from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { useNavCategories } from "@/hooks/use-nav-categories";
import { ProductShelf } from "@/components/product/product-shelf";
import { Reveal } from "@/components/ui/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/lib/format";
import { SafeImage } from "@/components/ui/safe-image";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
  link?: string;
}

const OCCASIONS = [
  "Wedding",
  "Nikah",
  "Hajj & Umrah",
  "Aqiqah",
  "Ramadan & Eid",
  "Anniversary",
  "Housewarming",
  "Bismillah",
];

const REVIEWS = [
  {
    quote:
      "The Quran set was even more beautiful in person. Wrapped like a dream — my sister cried when she opened it.",
    name: "Ayesha R.",
    place: "Lucknow",
  },
  {
    quote:
      "Ordered a couple janamaz for a nikah. Premium quality, fast delivery and the personalisation was perfect.",
    name: "Bilal K.",
    place: "Hyderabad",
  },
  {
    quote:
      "My go-to for every Eid. Thoughtful, elegant and always on time. Truly sharing the barakah.",
    name: "Fatima S.",
    place: "Dubai",
  },
];

function Hero() {
  const settings = useSettings();
  return (
    <section className="relative bg-emerald text-cream overflow-hidden">
      {/* soft radial glow behind the copy */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(198,161,91,0.18),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-[1.05fr_1fr] items-stretch">
        <div className="px-5 md:pl-7 md:pr-14 pt-9 pb-12 md:py-24 flex flex-col justify-center order-2 md:order-1">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 px-3 py-1 font-sans text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-gold animate-fadeUp">
            ✦ {settings.heroBadge}
          </span>
          <h1 className="font-display font-medium text-[40px] leading-[1.04] sm:text-5xl md:text-6xl lg:text-[68px] mt-5 text-cream tracking-[-0.01em] animate-fadeUp [animation-delay:80ms]">
            {settings.heroTitle}
          </h1>
          <p className="font-display italic text-lg md:text-[22px] leading-relaxed text-sand-dim mt-4 md:mt-6 max-w-md animate-fadeUp [animation-delay:160ms]">
            {settings.heroQuote}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-7 md:mt-9 animate-fadeUp [animation-delay:240ms]">
            <Link href="/category/all" className="btn-gold group pl-7 pr-2 py-2">
              {settings.heroCtaLabel}
              <span className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald/10 transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/about"
              className="btn border border-emerald-soft text-cream hover:border-gold hover:text-gold"
            >
              Our story
            </Link>
          </div>
        </div>
        <div className="relative min-h-[260px] sm:min-h-[340px] md:min-h-[560px] order-1 md:order-2 md:border-l border-[#22513c]">
          {settings.heroImageUrl ? (
            <>
              <SafeImage
                src={settings.heroImageUrl}
                alt=""
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover animate-fadeIn"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald via-transparent to-transparent md:bg-gradient-to-r md:from-emerald/40" />
            </>
          ) : (
            <div className="absolute inset-0 pattern-emerald flex items-center justify-center">
              <span className="font-brand tracking-[0.3em] text-[#6f9581] text-sm">
                {settings.storeName}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const settings = useSettings();
  const items = [
    { icon: HandHeart, title: "Handcrafted", sub: "Made by hand with love" },
    {
      icon: Truck,
      title: "Free shipping",
      sub: `On orders over ${inr(settings.freeShippingThreshold)}`,
    },
    { icon: Gift, title: "Gift-wrapped", sub: "With a personal note" },
    { icon: Globe2, title: "Worldwide", sub: "Delivered across the globe" },
  ];
  return (
    <section className="bg-paper border-b border-line">
      <div className="mx-auto max-w-7xl px-4 md:px-7 py-5 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5">
        {items.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3 md:justify-center">
            <span className="flex h-10 w-10 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-card text-gold-dark">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="font-display text-[17px] md:text-[19px] leading-tight text-emerald">{title}</span>
              <span className="font-sans text-[11px] md:text-xs text-muted leading-snug">{sub}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[i] as HTMLElement | undefined;
    if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  // Keep the dots in sync with manual swipes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const slides = Array.from(track.children) as HTMLElement[];
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft - track.offsetLeft + s.clientWidth / 2 - center);
        const bd = Math.abs(slides[best].offsetLeft - track.offsetLeft + slides[best].clientWidth / 2 - center);
        if (d < bd) best = i;
      });
      setIndex(best);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    const t = setInterval(() => goTo((index + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [index, paused, banners.length, goTo]);

  return (
    <section
      className="mx-auto max-w-7xl w-full mt-8 md:mt-14 relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      aria-roledescription="carousel"
    >
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 md:px-7 gap-3 md:gap-5 scroll-px-4 md:scroll-px-7"
      >
        {banners.map((banner, i) => (
          <Link
            key={banner.id}
            href={banner.link || "/category/all"}
            aria-label={banner.title}
            aria-roledescription="slide"
            className={`snap-start relative rounded-lg overflow-hidden h-[190px] sm:h-[240px] md:h-[320px] shrink-0 bg-emerald group ${
              banners.length === 1 ? "w-full" : "w-[88%] md:w-[72%] lg:w-[62%]"
            }`}
          >
            {banner.imageUrl && (
              <SafeImage
                src={banner.imageUrl}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.03]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-deep/95 via-emerald-deep/55 to-transparent" />
            <div className="relative z-10 p-5 md:p-11 flex flex-col justify-center h-full max-w-[80%] md:max-w-[58%]">
              {banner.subtitle && (
                <span className="font-sans text-[10px] md:text-xs tracking-[0.3em] uppercase text-gold mb-2">
                  {banner.subtitle}
                </span>
              )}
              <h3 className="font-display font-medium text-[26px] md:text-[44px] text-cream leading-[1.05]">
                {banner.title}
              </h3>
              {banner.ctaLabel && (
                <span className="mt-4 md:mt-6 inline-flex w-fit items-center gap-2 bg-gold text-emerald font-sans text-[11px] md:text-xs tracking-[0.1em] uppercase px-4 md:px-5 py-2.5 rounded-sm transition-colors group-hover:bg-gold-light">
                  {banner.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="flex items-center justify-center md:justify-between gap-4 mt-4 px-4 md:px-7">
          <div className="flex gap-1.5" role="tablist" aria-label="Choose slide">
            {banners.map((b, i) => (
              <button
                key={b.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="py-2"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-500 ${
                    i === index ? "w-8 bg-emerald" : "w-3 bg-line hover:bg-gold-muted"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => goTo((index - 1 + banners.length) % banners.length)}
              aria-label="Previous slide"
              className="h-10 w-10 flex items-center justify-center rounded-full border border-line bg-card text-emerald hover:border-gold transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => goTo((index + 1) % banners.length)}
              aria-label="Next slide"
              className="h-10 w-10 flex items-center justify-center rounded-full border border-line bg-card text-emerald hover:border-gold transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CategoryTiles() {
  const categories = useNavCategories();

  if (categories.length === 0) {
    return (
      <section className="mx-auto max-w-7xl w-full px-4 md:px-7 pt-14 md:pt-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`rounded ${i === 0 ? "col-span-2 h-[200px]" : "h-[150px]"} md:h-[240px]`} />
          ))}
        </div>
      </section>
    );
  }

  // The bento has five slots: one feature tile plus four.
  const tiles = categories.slice(0, 5);

  return (
    <section className="mx-auto max-w-7xl w-full px-4 md:px-7 pt-14 md:pt-20">
      <Reveal>
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <span className="eyebrow">Collections</span>
            <h2 className="font-display font-medium text-[30px] leading-tight md:text-[42px] text-ink mt-1.5 md:mt-2">
              Shop by category
            </h2>
          </div>
          <Link href="/category/all" className="link-underline mb-1.5">
            Shop all
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-5 md:h-[520px]">
        {tiles.map((cat, i) => (
          <Reveal
            key={cat.id}
            delay={i * 60}
            className={`${
              i === 0 ? "col-span-2 md:col-span-2 md:row-span-2 h-[200px] md:h-auto" : "h-[150px] md:h-auto"
            }`}
          >
            <Link
              href={`/category/${cat.slug}`}
              className="relative h-full rounded-lg overflow-hidden flex items-end group bg-paper border border-line hover:border-gold transition-colors"
            >
              {cat.imageUrl ? (
                <SafeImage
                  src={cat.imageUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
                />
              ) : (
                <div className="absolute inset-0 pattern-paper" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/90 via-emerald-deep/20 to-transparent" />
              <div className="relative w-full px-4 md:px-6 py-4 md:py-5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className={`font-display text-cream leading-none ${
                      i === 0 ? "text-[28px] md:text-[40px]" : "text-xl md:text-[26px]"
                    }`}
                  >
                    {cat.name}
                  </div>
                  {cat.description && (
                    <div className="font-sans text-[11px] md:text-xs text-sand-dim mt-1.5 line-clamp-1">
                      {cat.description}
                    </div>
                  )}
                </div>
                <span className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream/15 text-cream backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-0.5 group-hover:bg-gold group-hover:text-emerald">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Occasions() {
  return (
    <section className="mx-auto max-w-7xl w-full px-4 md:px-7 pt-14 md:pt-20">
      <Reveal className="rounded-lg border border-line bg-paper px-5 py-8 md:px-12 md:py-12 grid md:grid-cols-[1fr_1.4fr] gap-6 md:gap-12 items-center">
        <div>
          <span className="eyebrow">Find the perfect gift</span>
          <h2 className="font-display font-medium text-[30px] leading-tight md:text-[40px] text-ink mt-1.5">
            Gifts for every occasion
          </h2>
          <p className="font-sans text-sm text-muted mt-2 max-w-sm">
            From a first Bismillah to a Hajj homecoming — pick the moment, we&apos;ll show you what fits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-2.5">
          {OCCASIONS.map((occasion) => (
            <Link
              key={occasion}
              href={`/category/all?q=${encodeURIComponent(occasion)}`}
              className="bg-card border border-line font-sans text-[13px] tracking-[0.03em] text-ink-soft px-4 md:px-5 py-2.5 rounded-full hover:border-gold hover:text-emerald hover:-translate-y-0.5 active:translate-y-0 transition"
            >
              {occasion}
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function BrandStory() {
  const settings = useSettings();
  return (
    <section className="bg-emerald text-cream mt-16 md:mt-24 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-120px] bottom-[-160px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(198,161,91,0.16),transparent_65%)]"
      />
      <Reveal className="relative mx-auto max-w-3xl px-5 md:px-7 py-16 md:py-24 text-center">
        <span className="font-sans text-[11px] md:text-xs tracking-[0.34em] uppercase text-gold">
          Because you deserve the best
        </span>
        <p className="font-display text-[22px] md:text-[32px] leading-relaxed mt-6 text-[#ece6d6]">
          At {settings.storeName}, {settings.brandStory}
        </p>
        <Link href="/about" className="inline-flex items-center gap-2 mt-8 font-sans text-xs tracking-[0.12em] uppercase text-gold border-b border-gold/50 pb-1 hover:text-gold-light transition">
          Read our story <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Reveal>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-paper border-t border-line">
      <div className="mx-auto max-w-7xl px-4 md:px-7 py-14 md:py-20">
        <Reveal className="text-center mb-8 md:mb-10">
          <span className="eyebrow">Loved by 5,000+ families</span>
          <h2 className="font-display font-medium text-[30px] md:text-[42px] text-ink mt-2">Kind words</h2>
        </Reveal>
        <div className="-mx-4 px-4 md:mx-0 md:px-0 flex md:grid md:grid-cols-3 gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-px-4">
          {REVIEWS.map((review, i) => (
            <Reveal
              key={review.name}
              delay={i * 90}
              className="w-[84vw] max-w-[360px] md:w-auto md:max-w-none shrink-0 snap-start"
            >
              <figure className="h-full bg-card border border-line rounded-lg p-6 md:p-7 flex flex-col">
                <div className="text-gold text-[15px] tracking-[3px]" aria-label="5 out of 5">★★★★★</div>
                <blockquote className="font-display italic text-lg md:text-[20px] leading-relaxed text-ink-soft my-4 flex-1">
                  “{review.quote}”
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald text-sand font-display text-lg">
                    {review.name.charAt(0)}
                  </span>
                  <span className="font-sans text-[13px] leading-tight">
                    <span className="block text-ink">{review.name}</span>
                    <span className="block text-muted">{review.place}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function StorefrontHomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    api
      .get("/banners/active")
      .then((res) => setBanners(res.data || []))
      .catch((err) => console.error("Failed to load banners", err));
  }, []);

  return (
    <div className="flex flex-col w-full">
      <Hero />
      <TrustStrip />
      {banners.length > 0 && <BannerCarousel banners={banners} />}
      <CategoryTiles />
      <ProductShelf
        eyebrow="Just in"
        title="New arrivals"
        query="limit=8&sort=newest"
        viewAllHref="/category/all?sort=newest"
        hideWhenEmpty={false}
        className="pt-14 md:pt-20"
      />
      <ProductShelf
        eyebrow="Limited time"
        title="On sale now"
        query="limit=4&onSaleOnly=true&sort=featured"
        viewAllHref="/category/all?sale=1"
        className="pt-14 md:pt-20"
      />
      <Occasions />
      <BrandStory />
      <ProductShelf
        eyebrow="Made just for them"
        title="Handpicked favourites"
        query="limit=4&featuredOnly=true"
        viewAllHref="/category/all?sort=featured"
        className="py-14 md:py-20"
      />
      <Testimonials />
    </div>
  );
}
