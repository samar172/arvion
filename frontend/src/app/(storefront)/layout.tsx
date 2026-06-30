import React from "react";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Storefront Global Navbar will go here */}
      <header className="border-b bg-white py-4 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-emerald-800">Arvion</h1>
        <nav className="flex space-x-6 text-sm font-medium">
          <a href="/" className="hover:text-emerald-700">Home</a>
          <a href="/products" className="hover:text-emerald-700">Shop</a>
          <a href="/cart" className="hover:text-emerald-700">Cart</a>
        </nav>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="border-t bg-gray-50 py-6 px-6 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Arvion Muslim Community E-Commerce Platform. All rights reserved.
      </footer>
    </div>
  );
}
