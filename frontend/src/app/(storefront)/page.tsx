"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProductCard from "@/components/product/product-card";
import { useSettings } from "@/context/SettingsContext";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
  link?: string;
}

function SectionHeading({
  eyebrow,
  title,
  viewAllHref,
}: {
  eyebrow: string;
  title: string;
  viewAllHref?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        <span className="font-sans text-[11px] md:text-xs tracking-[0.3em] uppercase text-gold-muted">
          {eyebrow}
        </span>
        <h2 className="font-display font-medium text-3xl md:text-4xl text-ink mt-2">
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="font-sans text-xs md:text-[13px] tracking-[0.08em] uppercase text-emerald border-b border-gold pb-1 whitespace-nowrap"
        >
          View all
        </Link>
      )}
    </div>
  );
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
  },
  {
    quote:
      "Ordered a couple janamaz for a nikah. Premium quality, fast delivery and the personalisation was perfect.",
    name: "Bilal K.",
  },
  {
    quote:
      "My go-to for every Eid. Thoughtful, elegant and always on time. Truly sharing the barakah.",
    name: "Fatima S.",
  },
];

export default function StorefrontHomePage() {
  const settings = useSettings();
  const [products, setProducts] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodRes, featRes, catRes, bannerRes] = await Promise.all([
          api.get("/catalog?limit=8&sort=newest"),
          api.get("/catalog?limit=4&featuredOnly=true"),
          api.get("/category"),
          api.get("/banners/active"),
        ]);
        setProducts(prodRes.data.data || []);
        setFeatured(featRes.data.data || []);
        setCategories(catRes.data || []);
        setBanners(bannerRes.data || []);
      } catch (err) {
        console.error("Failed to load storefront homepage data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const trust = [
    { title: "Handcrafted", sub: "Made by hand with love" },
    {
      title: "Free Shipping",
      sub: `On orders over ₹${settings.freeShippingThreshold}`,
    },
    { title: "Worldwide", sub: "Delivered across the globe" },
    { title: "5,000+ Gifts", sub: "Loved by families" },
  ];

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-[60vh]">
        <p className="font-display italic text-xl text-muted animate-pulse">
          Preparing something beautiful…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* HERO */}
      <section className="bg-emerald text-cream">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 items-stretch">
          <div className="px-4 md:pl-7 md:pr-14 py-14 md:py-20 flex flex-col justify-center order-2 md:order-1">
            <span className="font-sans text-[11px] md:text-xs tracking-[0.34em] uppercase text-gold">
              {settings.heroBadge}
            </span>
            <h1 className="font-display font-medium text-4xl md:text-6xl leading-[1.06] mt-5 text-cream">
              {settings.heroTitle}
            </h1>
            <p className="font-display italic text-lg md:text-[21px] leading-relaxed text-sand-dim mt-5 max-w-md">
              {settings.heroQuote}
            </p>
            <div className="flex flex-wrap gap-3.5 mt-8">
              <Link
                href="/category/all"
                className="bg-gold text-emerald font-sans text-[13px] tracking-[0.1em] uppercase px-8 py-3.5 rounded-sm hover:bg-gold-light transition text-center"
              >
                {settings.heroCtaLabel}
              </Link>
              <Link
                href="/about"
                className="border border-emerald-soft text-cream font-sans text-[13px] tracking-[0.1em] uppercase px-8 py-3.5 rounded-sm hover:border-gold hover:text-gold transition text-center"
              >
                Our Story
              </Link>
            </div>
          </div>
          <div className="relative min-h-[240px] md:min-h-[520px] border-b md:border-b-0 md:border-l border-[#22513c] order-1 md:order-2">
            {settings.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.heroImageUrl}
                alt={settings.heroTitle}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#12442f_0_16px,#164a34_16px_32px)] flex items-center justify-center">
                <span className="font-brand tracking-[0.3em] text-[#6f9581] text-sm">
                  {settings.storeName}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-paper border-b border-line">
        <div className="mx-auto max-w-7xl px-4 md:px-7 py-6 grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
          {trust.map((item) => (
            <div key={item.title} className="flex flex-col gap-1">
              <span className="font-display text-lg md:text-[19px] text-emerald">
                {item.title}
              </span>
              <span className="font-sans text-[11px] md:text-xs text-muted">
                {item.sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* PROMO BANNERS (admin-managed) */}
      {banners.length > 0 && (
        <section className="mt-10 md:mt-14">
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 md:px-7 gap-4 pb-2 mx-auto max-w-7xl w-full">
            {banners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.link || "/category/all"}
                className="min-w-[88%] sm:min-w-[440px] md:min-w-[600px] snap-center relative rounded overflow-hidden h-[170px] md:h-[280px] flex-shrink-0 border border-line bg-emerald"
              >
                {banner.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-deep/95 via-emerald-deep/60 to-transparent" />
                <div className="relative z-10 p-5 md:p-10 flex flex-col justify-center h-full max-w-[75%] md:max-w-[55%]">
                  {banner.subtitle && (
                    <span className="font-sans text-[10px] md:text-xs tracking-[0.3em] uppercase text-gold mb-1.5">
                      {banner.subtitle}
                    </span>
                  )}
                  <h3 className="font-display font-medium text-2xl md:text-4xl text-cream leading-tight">
                    {banner.title}
                  </h3>
                  {banner.ctaLabel && (
                    <span className="mt-3 md:mt-5 inline-block w-fit bg-gold text-emerald font-sans text-[11px] md:text-xs tracking-[0.1em] uppercase px-5 py-2 rounded-sm">
                      {banner.ctaLabel}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* OCCASIONS */}
      <section className="mx-auto max-w-7xl w-full px-4 md:px-7 pt-14 md:pt-16 text-center">
        <span className="font-sans text-[11px] md:text-xs tracking-[0.3em] uppercase text-gold-muted">
          Find the perfect gift
        </span>
        <h2 className="font-display font-medium text-3xl md:text-[40px] text-ink mt-3 mb-7">
          Gifts for Every Occasion
        </h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {OCCASIONS.map((occasion) => (
            <Link
              key={occasion}
              href={`/category/all?q=${encodeURIComponent(occasion)}`}
              className="bg-card border border-line font-sans text-[12px] md:text-[13px] tracking-[0.05em] text-ink-soft px-5 py-2.5 rounded-full hover:border-gold hover:text-emerald hover:bg-paper transition"
            >
              {occasion}
            </Link>
          ))}
        </div>
      </section>

      {/* CATEGORY TILES */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 md:px-7 py-12 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="relative border border-line rounded overflow-hidden h-[160px] md:h-[250px] flex items-end group hover:border-gold transition bg-paper"
              >
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#efe7d4_0_16px,#f5eede_16px_32px)]" />
                )}
                <div className="relative w-full bg-gradient-to-t from-emerald/90 to-transparent px-4 md:px-5 py-4 md:py-5">
                  <div className="font-display text-xl md:text-[26px] text-cream leading-none">
                    {cat.name}
                  </div>
                  {cat.description && (
                    <div className="font-sans text-[11px] md:text-xs text-sand-dim mt-1.5 line-clamp-1">
                      {cat.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl w-full px-4 md:px-7 pb-12 md:pb-14">
        <SectionHeading eyebrow="Just In" title="New Arrivals" viewAllHref="/category/all" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              id={prod.id}
              title={prod.title}
              price={parseFloat(prod.price)}
              compareAtPrice={prod.compareAtPrice ? parseFloat(prod.compareAtPrice) : null}
              imageUrl={prod.imageUrl}
              categoryName={prod.category?.name}
            />
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-center py-16 font-sans text-sm text-muted">
              New gifts arriving soon, insha&apos;Allah.
            </p>
          )}
        </div>
      </section>

      {/* BRAND STORY BAND */}
      <section className="bg-emerald text-cream">
        <div className="mx-auto max-w-3xl px-4 md:px-7 py-16 md:py-20 text-center">
          <span className="font-sans text-[11px] md:text-xs tracking-[0.34em] uppercase text-gold">
            Because you deserve the best
          </span>
          <p className="font-display text-xl md:text-[29px] leading-relaxed mt-6 text-[#ece6d6]">
            At {settings.storeName}, {settings.brandStory}
          </p>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 md:px-7 py-14 md:py-16">
          <SectionHeading
            eyebrow="Made just for them"
            title="Handpicked Favourites"
            viewAllHref="/category/all"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {featured.map((prod) => (
              <ProductCard
                key={prod.id}
                id={prod.id}
                title={prod.title}
                price={parseFloat(prod.price)}
                compareAtPrice={prod.compareAtPrice ? parseFloat(prod.compareAtPrice) : null}
                imageUrl={prod.imageUrl}
                categoryName={prod.category?.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="bg-paper border-t border-line">
        <div className="mx-auto max-w-7xl px-4 md:px-7 py-14 md:py-16 text-center">
          <span className="font-sans text-[11px] md:text-xs tracking-[0.3em] uppercase text-gold-muted">
            Loved by 5,000+ families
          </span>
          <h2 className="font-display font-medium text-3xl md:text-[38px] text-ink mt-3 mb-8">
            Kind Words
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {REVIEWS.map((review) => (
              <div
                key={review.name}
                className="bg-card border border-line rounded p-6"
              >
                <div className="text-gold text-[15px] tracking-[2px]">★★★★★</div>
                <p className="font-display italic text-lg md:text-[19px] leading-relaxed text-ink-soft my-4">
                  “{review.quote}”
                </p>
                <span className="font-sans text-[13px] tracking-[0.05em] text-muted">
                  — {review.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
