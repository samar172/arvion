"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProductCard from "@/components/product/product-card";
import { Star, MapPin, Droplet, ShieldCheck, Check, Truck, RotateCcw, Lock, FlaskConical } from "lucide-react";

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "scent" | "benefits">("description");
  const { items, addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/catalog/${params.id}`);
        const productData = res.data;
        setProduct(productData);

        if (productData.category?.slug) {
          const relatedRes = await api.get(`/catalog?limit=5&categorySlug=${productData.category.slug}`);
          const relatedList = (relatedRes.data.data || []).filter((p: any) => p.id !== productData.id);
          setRelated(relatedList.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load product details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [params.id]);

  const cartItem = product ? items.find((item) => item.productId === product.id) : null;
  const isInCart = !!cartItem;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full flex items-center justify-center">
        <p className="text-gray-500 font-medium animate-pulse">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-32">
        <span className="grid h-20 w-20 place-items-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
          <FlaskConical className="h-10 w-10" strokeWidth={1.75} />
        </span>
        <h2 className="text-2xl font-display font-bold text-gray-800">Attar not found</h2>
        <Link href="/" className="text-amber-700 font-bold hover:underline">
          Return to Collection
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl,
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push(`/login/customer?redirect=/products/${product.id}`);
      return;
    }
    if (!isInCart) handleAddToCart();
    router.push("/cart");
  };

  const originalPrice = product.discount
    ? (parseFloat(product.price) / (1 - product.discount / 100)).toFixed(0)
    : null;

  // Provide fallbacks for static layout fields since DB-driven items might omit them
  const fallbackVolume = product.volume || "12ml";
  const fallbackOrigin = product.origin || "Kannauj, India";
  const fallbackRating = product.rating || 4.8;
  const fallbackReviewCount = product.reviewCount || 24;
  const fallbackBenefits = product.benefits || [
    "100% pure steam-distilled extract",
    "Alcohol-free and skin-safe formula",
    "Long-lasting projection for 8+ hours",
    "Inherently halal and vegan friendly"
  ];
  const fallbackScentNotes = product.scentNotes || {
    top: ["Citrus", "Floral Notes"],
    heart: ["Spices", "Soft Woods"],
    base: ["Amber", "White Musk"]
  };
  const fallbackLongDescription = product.longDescription || product.description;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-amber-700">Home</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-amber-700">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.title}</span>
      </nav>

      {/* Main product layout */}
      <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
        {/* Image */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="aspect-square rounded-2xl overflow-hidden relative bg-gray-50 border border-gray-100">
            {product.isBestseller && (
              <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 bg-amber-900 text-amber-200 text-xs font-extrabold uppercase px-2 py-1 rounded-lg shadow">
                <Star className="h-3.5 w-3.5" strokeWidth={2.5} fill="currentColor" />
                Bestseller
              </span>
            )}
            {product.isNew && !product.isBestseller && (
              <span className="absolute top-4 right-4 z-10 bg-emerald-600 text-white text-xs font-extrabold uppercase px-2 py-1 rounded-lg shadow">
                New
              </span>
            )}
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Origin & volume tags */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} /> {fallbackOrigin}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">
              <Droplet className="h-3.5 w-3.5" strokeWidth={2.25} /> {fallbackVolume}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} /> Alcohol-Free
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="w-full md:w-1/2 flex flex-col space-y-6">
          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(fallbackRating) ? "text-amber-400" : "text-gray-200"}`}
                  strokeWidth={2}
                  fill="currentColor"
                />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-600">{fallbackRating}</span>
            <span className="text-xs text-gray-400">({fallbackReviewCount} reviews)</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 leading-tight">
            {product.title}
          </h1>

          {/* Price */}
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold text-amber-700">
              ₹{parseFloat(product.price).toLocaleString("en-IN")}
            </span>
            {originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{parseInt(originalPrice).toLocaleString("en-IN")}</span>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                  Save {product.discount}%
                </span>
              </>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-gray-100 mb-4">
              {(["description", "scent", "benefits"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-bold capitalize transition border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-amber-500 text-amber-700"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab === "scent" ? "Scent Notes" : tab}
                </button>
              ))}
            </div>

            {activeTab === "description" && (
              <p className="text-gray-600 text-sm leading-relaxed">{fallbackLongDescription}</p>
            )}

            {activeTab === "scent" && (
              <div className="space-y-3">
                {(["top", "heart", "base"] as const).map((layer) => (
                  <div key={layer} className="flex items-start space-x-3">
                    <span className={`text-xs font-extrabold uppercase px-2 py-1 rounded-full shrink-0 ${
                      layer === "top" ? "bg-yellow-100 text-yellow-800" :
                      layer === "heart" ? "bg-rose-100 text-rose-800" :
                      "bg-stone-100 text-stone-800"
                    }`}>
                      {layer}
                    </span>
                    <p className="text-sm text-gray-600 pt-1">{fallbackScentNotes[layer]?.join(", ")}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "benefits" && (
              <ul className="space-y-2">
                {fallbackBenefits.map((b: string) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={3} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quantity & CTA */}
          <div className="pt-2 space-y-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <span className="font-bold text-sm text-gray-700">Quantity</span>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-amber-700 font-bold transition"
                >
                  −
                </button>
                <span className="px-4 font-bold text-gray-900 w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:text-amber-700 font-bold transition"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {!isInCart ? (
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-white border-2 border-amber-500 text-amber-700 font-bold py-3.5 px-6 rounded-xl hover:bg-amber-50 active:scale-95 transition-all"
                >
                  Add to Cart
                </button>
              ) : (
                <button
                  onClick={() => router.push("/cart")}
                  className="flex-1 bg-white border-2 border-amber-500 text-amber-700 font-bold py-3.5 px-6 rounded-xl hover:bg-amber-50 active:scale-95 transition-all"
                >
                  Go to Cart
                </button>
              )}
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-amber-500 border-2 border-amber-500 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-amber-600 active:scale-95 transition-all shadow-md"
              >
                Buy Now
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-amber-500" strokeWidth={2.25} />Free delivery over ₹999</span>
              <span className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-amber-500" strokeWidth={2.25} />Easy returns</span>
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-amber-500" strokeWidth={2.25} />Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="space-y-4 border-t border-gray-100 pt-10">
          <h3 className="text-xl font-display font-bold text-gray-800">
            More from {product.category?.name || "this collection"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                price={parseFloat(p.price)}
                halalCertified={p.halalCertified}
                imageUrl={p.imageUrl}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
