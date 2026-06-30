"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    sku: "",
    price: "",
    halalCertified: false,
    imageUrl: ""
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/catalog');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/catalog', {
        ...newProduct,
        price: parseFloat(newProduct.price)
      });
      setIsAdding(false);
      setNewProduct({
        title: "", description: "", sku: "", price: "", halalCertified: false, imageUrl: ""
      });
      fetchProducts();
    } catch (err: any) {
      alert("Failed to add product: " + err.response?.data?.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/catalog/${id}`);
        fetchProducts();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products Catalog</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-brand-emerald text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-800"
        >
          {isAdding ? "Cancel" : "+ Add New Product"}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Product</h2>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Product Title</label>
              <input 
                type="text" 
                required 
                value={newProduct.title}
                onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">SKU</label>
              <input 
                type="text" 
                required 
                value={newProduct.sku}
                onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
              <input 
                type="url" 
                value={newProduct.imageUrl}
                onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <textarea 
                rows={3} 
                value={newProduct.description}
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald"
              ></textarea>
            </div>
            <div className="md:col-span-2 flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="halal" 
                checked={newProduct.halalCertified}
                onChange={e => setNewProduct({...newProduct, halalCertified: e.target.checked})}
                className="rounded text-brand-emerald focus:ring-brand-emerald" 
              />
              <label htmlFor="halal" className="text-sm font-bold text-gray-700">Halal Certified</label>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-brand-emerald text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-800">
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover rounded" /> : "📦"}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500">{product.halalCertified ? "Halal Certified" : "Standard"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₹{parseFloat(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button className="text-brand-emerald hover:text-emerald-800 font-bold">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 font-bold">Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No products found. Add one above.
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
