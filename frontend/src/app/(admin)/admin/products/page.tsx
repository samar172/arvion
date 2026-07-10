"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Package, Upload, Edit2 } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    sku: "",
    price: "",
    halalCertified: false,
    imageUrl: "",
    categoryId: ""
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

  const fetchCategories = async () => {
    try {
      const res = await api.get('/category');
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewProduct(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      categoryId: newProduct.categoryId || null
    };
    try {
      if (editingId) {
        await api.patch(`/catalog/${editingId}`, payload);
      } else {
        await api.post('/catalog', payload);
      }
      setIsAdding(false);
      setEditingId(null);
      setNewProduct({
        title: "", description: "", sku: "", price: "", halalCertified: false, imageUrl: "", categoryId: ""
      });
      fetchProducts();
    } catch (err: any) {
      alert(`Failed to ${editingId ? "update" : "add"} product: ` + err.response?.data?.message);
    }
  };

  const handleEdit = (product: any) => {
    setNewProduct({
      title: product.title,
      description: product.description || "",
      sku: product.sku,
      price: String(product.price),
      halalCertified: product.halalCertified,
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId || ""
    });
    setEditingId(product.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewProduct({
      title: "", description: "", sku: "", price: "", halalCertified: false, imageUrl: "", categoryId: ""
    });
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
          onClick={() => (isAdding ? handleCancel() : setIsAdding(true))}
          className="bg-brand-emerald text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-800"
        >
          {isAdding ? "Cancel" : "+ Add New Product"}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{editingId ? "Edit Product" : "Add New Product"}</h2>
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
              <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
              <select
                value={newProduct.categoryId}
                onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald"
              >
                <option value="">No Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Image Upload (Cloudinary)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-brand-emerald hover:file:bg-emerald-100 cursor-pointer" 
              />
              {uploading && <span className="text-xs text-brand-emerald animate-pulse mt-1 block">Uploading to Cloudinary...</span>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Or Image URL</label>
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
                {editingId ? "Save Changes" : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
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
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover rounded" /> : <Package className="h-5 w-5 text-gray-400" strokeWidth={1.75} />}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500">{product.halalCertified ? "Halal Certified" : "Standard"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category ? (
                      <span className="bg-emerald-50 text-brand-emerald px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100">
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Uncategorized</span>
                    )}
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
                    <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1 font-bold text-xs">
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
