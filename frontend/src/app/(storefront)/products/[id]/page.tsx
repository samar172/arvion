"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { items, addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const cartItem = items.find((item) => item.productId === product?.id);
  const isInCart = !!cartItem;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/catalog/${params.id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-emerald"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-32">
        <h2 className="text-2xl font-display font-bold text-gray-800">Product not found</h2>
        <Link href="/" className="text-brand-emerald hover:underline">Return to Home</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      title: product.title,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl,
      quantity
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!isInCart) {
      handleAddToCart();
    }
    router.push('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Product Images Gallery */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden relative">
            {product.halalCertified && (
              <span className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-xs font-extrabold uppercase px-2 py-1 rounded shadow-sm">
                Halal Certified
              </span>
            )}
            {product.imageUrl ? (
               <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
            ) : (
               <span className="text-9xl text-gray-200">📦</span>
            )}
          </div>
          {/* Thumbnails placeholder */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`aspect-square rounded-lg border-2 ${i === 1 ? 'border-brand-emerald' : 'border-gray-100 bg-gray-50'} flex items-center justify-center cursor-pointer hover:border-emerald-200`}>
                <span className="text-xl text-gray-300">🖼️</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="space-y-4 pb-6 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400">★★★★★</span>
              <span className="text-xs font-bold text-gray-500">4.9 (128 reviews)</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 leading-tight">
              {product.title}
            </h1>
            
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-extrabold text-brand-emerald">₹{parseFloat(product.price).toFixed(2)}</span>
              {/* Fake original price for UI */}
              <span className="text-lg text-gray-400 line-through">₹{(parseFloat(product.price) * 1.2).toFixed(2)}</span>
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Save 20%</span>
            </div>
          </div>

          <div className="py-6 space-y-4">
            <h3 className="font-bold text-gray-900">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {product.description || "Premium quality product sourced carefully for our community. Experience the best in authentic, halal-certified goods with Arvion."}
            </p>
          </div>

          {/* Action Area */}
          <div className="mt-auto pt-6 border-t border-gray-100 space-y-6">
            <div className="flex items-center space-x-4">
              <span className="font-bold text-sm text-gray-700">Quantity</span>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-brand-emerald transition-colors font-bold"
                >
                  -
                </button>
                <span className="px-4 font-bold text-gray-900 w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:text-brand-emerald transition-colors font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {!isInCart ? (
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-white border-2 border-brand-emerald text-brand-emerald font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all duration-200 shadow-sm"
                >
                  Add to Cart
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/cart')}
                  className="flex-1 bg-white border-2 border-brand-emerald text-brand-emerald font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all duration-200 shadow-sm"
                >
                  Go to Cart
                </button>
              )}
              <button 
                onClick={handleBuyNow}
                className="flex-1 bg-brand-emerald border-2 border-brand-emerald text-white font-bold py-3.5 px-6 rounded-xl hover:bg-brand-emeraldDark active:scale-95 transition-all duration-200 shadow-md"
              >
                Buy it Now
              </button>
            </div>

            <div className="flex items-center justify-center space-x-6 pt-4 text-xs font-bold text-gray-500">
              <span className="flex items-center space-x-1">
                <span>🚚</span> <span>Free Delivery over ₹999</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🛡️</span> <span>Secure Checkout</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
