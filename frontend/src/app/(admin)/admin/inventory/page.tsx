"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Download, AlertTriangle, Package } from "lucide-react";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const updateStock = async (productId: string, newStock: number) => {
    try {
      await api.put(`/inventory/${productId}`, { stock: newStock });
      fetchInventory();
    } catch (err) {
      alert("Failed to update stock");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock</h1>
        <div className="flex space-x-2">
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2">
            <Download className="h-4 w-4" strokeWidth={2.25} /> Export CSV
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-lg text-red-600">
            <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <h3 className="font-bold text-red-900">Low Stock Alerts</h3>
            <p className="text-sm text-red-700 mt-1">
              {inventory.filter(item => item.stock < 10).length} items require immediate restocking
            </p>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
            <Package className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">Total Items in Stock</h3>
            <p className="text-sm text-amber-700 mt-1">
              {inventory.reduce((acc, item) => acc + item.stock, 0)} units across {inventory.length} SKUs
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading inventory...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reserved</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{item.product?.title || "Unknown Product"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {item.product?.sku || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {item.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.reserved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.stock === 0 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Out of Stock</span>
                    ) : item.stock < 10 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">Low Stock</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => {
                        const newStock = prompt("Enter new stock amount:", item.stock.toString());
                        if (newStock !== null && !isNaN(parseInt(newStock))) {
                          updateStock(item.productId, parseInt(newStock));
                        }
                      }}
                      className="text-brand-emerald hover:text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded"
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
