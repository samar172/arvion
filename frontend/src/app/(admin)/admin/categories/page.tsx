"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Folder, Edit2, Trash2 } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/category");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      setForm(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/category/${editingId}`, form);
      } else {
        await api.post("/category", form);
      }
      setForm({ name: "", slug: "", description: "", imageUrl: "" });
      setIsEditing(false);
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.message || "Failed to save category"));
    }
  };

  const handleEdit = (cat: any) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
    });
    setEditingId(cat.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await api.delete(`/category/${id}`);
        fetchCategories();
      } catch (err) {
        alert("Failed to delete category");
      }
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setForm({ ...form, name, slug });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            if (isEditing) {
              setEditingId(null);
              setForm({ name: "", slug: "", description: "", imageUrl: "" });
            }
          }}
          className="bg-brand-emerald text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-800"
        >
          {isEditing ? "Cancel" : "+ Add New Category"}
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Category Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Rare Attars"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. rare-attars"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-brand-emerald focus:border-brand-emerald"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the category..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Upload Banner Image (Cloudinary)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-brand-emerald hover:file:bg-emerald-100 cursor-pointer"
              />
              {uploading && <span className="text-xs text-brand-emerald animate-pulse mt-1 block">Uploading to Cloudinary...</span>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Or Banner Image URL</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-emerald focus:border-brand-emerald"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-brand-emerald text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-800"
              >
                {editingId ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading categories...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Products Count
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 text-brand-emerald flex items-center justify-center border border-emerald-100">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <Folder className="h-5 w-5" />
                        )}
                      </div>
                      <div className="font-bold text-gray-900">{cat.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {cat.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {cat.description || <span className="text-gray-300 italic">No description</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {cat._count?.products || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1 font-bold text-xs"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 font-bold text-xs"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No categories found.
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
