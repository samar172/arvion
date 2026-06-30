"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 font-medium animate-pulse">Checking authorization...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold tracking-wider text-emerald-400">Arvion Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm font-medium">
          <Link href="/admin" className="block py-2.5 px-4 rounded transition duration-200 bg-gray-800 text-white">
            Dashboard
          </Link>
          <Link href="/admin/products" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800 hover:text-white">
            Products
          </Link>
          <Link href="/admin/orders" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800 hover:text-white">
            Orders
          </Link>
          <Link href="/admin/inventory" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800 hover:text-white">
            Inventory
          </Link>
          <Link href="/admin/analytics" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800 hover:text-white">
            Analytics
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow py-4 px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Admin Control Panel</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 font-medium">{user.name}</span>
            <button 
              onClick={logout}
              className="text-sm text-red-600 font-medium hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-8 flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
