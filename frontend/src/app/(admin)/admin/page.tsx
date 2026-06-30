import React from "react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">₹0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500">Active Orders</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500">Total Products</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500">Low Stock Alert</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">0 items</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-sm text-gray-500">No recent transactions or orders to display.</p>
      </div>
    </div>
  );
}
