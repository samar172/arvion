"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

interface ProductProps {
  id: string;
  title: string;
  price: number;
  halalCertified?: boolean;
  imageUrl?: string;
}

export default function ProductCard({ id, title, price, halalCertified = false, imageUrl }: ProductProps) {
  const { items, addToCart } = useCart();
  const router = useRouter();
  
  const cartItem = items.find((item) => item.productId === id);
  const isInCart = !!cartItem;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ productId: id, title, price, imageUrl, quantity: 1 });
  };

  const handleGoToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/cart');
  };

  return (
    <Link href={`/products/${id}`} className="bg-white border border-gray-100 rounded-lg p-3 relative flex flex-col justify-between hover:shadow-md transition-shadow duration-200 block">
      {/* Halal Badge */}
      {halalCertified && (
        <span className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs">
          Halal Certified
        </span>
      )}

      {/* Product Image */}
      <div className="w-full h-32 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center mb-3">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="object-cover w-full h-full" />
        ) : (
          <span className="text-3xl text-gray-300">📦</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center space-x-1 mb-1">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-[10px] text-gray-500 font-bold">4.8</span>
          </div>
          
          <h4 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-8 mb-1 leading-snug">
            {title}
          </h4>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Price</p>
            <p className="text-sm font-extrabold text-brand-emerald">₹{price.toFixed(2)}</p>
          </div>

          {/* Action button */}
          {!isInCart ? (
            <button
              onClick={handleAddToCart}
              className="bg-white border border-brand-emerald text-brand-emerald font-bold text-xs px-3 py-1.5 rounded-md hover:bg-brand-emerald hover:text-white transition duration-200 active:scale-95 whitespace-nowrap"
            >
              ADD
            </button>
          ) : (
            <button
              onClick={handleGoToCart}
              className="bg-brand-emerald text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition active:scale-95 whitespace-nowrap"
            >
              GO TO CART
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
