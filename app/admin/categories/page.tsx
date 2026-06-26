"use client";

import { useState, useEffect } from "react";
import ConfirmationModal from "@/app/components/ConfirmationModal";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [name, setName] = useState("");
    const [year, setYear] = useState("3");
    const [semester, setSemester] = useState("1");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Delete Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editYear, setEditYear] = useState("3");
    const [editSemester, setEditSemester] = useState("1");
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/admin/categories");
            const data = await res.json();
            if (res.ok) {
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, year, semester }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: "success", message: "Category created successfully!" });
                setName("");
                fetchCategories();
            } else {
                setStatus({ type: "error", message: data.error || "Failed to create category" });
            }
        } catch (error) {
            setStatus({ type: "error", message: "An error occurred" });
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (id: string) => {
        setSelectedCategoryId(id);
        setIsModalOpen(true);
    };

    const confirmDeleteCategory = async () => {
        if (!selectedCategoryId) return;
        setDeleting(true);

        try {
            const res = await fetch("/api/admin/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedCategoryId }),
            });

            if (res.ok) {
                fetchCategories();
                setIsModalOpen(false);
                setSelectedCategoryId(null);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete category");
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("An error occurred while deleting category");
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (cat: any) => {
        setEditCategoryId(cat.id);
        setEditName(cat.name);
        setEditYear(cat.year.toString());
        setEditSemester(cat.semester.toString());
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleEditCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editCategoryId) return;
        setEditSaving(true);
        setEditError(null);

        try {
            const res = await fetch("/api/admin/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editCategoryId,
                    name: editName,
                    year: editYear,
                    semester: editSemester
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchCategories();
            } else {
                setEditError(data.error || "Failed to update category");
            }
        } catch (error) {
            setEditError("An error occurred");
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">Manage Elective Categories</h2>

            {/* Create Category Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-4">Create New Category</h3>
                {status && (
                    <div className={`p-4 rounded mb-4 ${status.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {status.message}
                    </div>
                )}
                <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                        <input
                            type="text"
                            placeholder="e.g. OPEN ELECTIVE I"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border p-2 rounded w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="border p-2 rounded w-full"
                            required
                        >
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="border p-2 rounded w-full"
                            required
                        >
                            <option value="1">1st Sem</option>
                            <option value="2">2nd Sem</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 md:col-span-3 w-full md:w-auto"
                    >
                        {saving ? "Creating..." : "Create Category"}
                    </button>
                </form>
            </div>

            {/* Categories List Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-6">Elective Categories List</h3>
                {loading ? (
                    <p>Loading categories...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects Count</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Selections</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((cat) => (
                                    <tr key={cat.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.year} Year</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.semester} Semester</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat._count?.subjects || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat._count?.selections || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => openEditModal(cat)}
                                                className="text-blue-600 hover:text-blue-900 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(cat.id)}
                                                className="text-red-600 hover:text-red-900 border border-red-200 bg-red-50 px-2.5 py-1 rounded text-xs"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No categories found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                title="Delete Category"
                message="Are you sure you want to delete this category? This will delete all subjects, selections, and student preferences associated with this category. This action cannot be undone."
                onConfirm={confirmDeleteCategory}
                onCancel={() => setIsModalOpen(false)}
                isLoading={deleting}
            />

            {/* Edit Category Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Category</h3>
                        {editError && (
                            <div className="p-3 bg-red-100 text-red-800 rounded mb-4 text-sm">
                                {editError}
                            </div>
                        )}
                        <form onSubmit={handleEditCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <select
                                    value={editYear}
                                    onChange={(e) => setEditYear(e.target.value)}
                                    className="border p-2 rounded w-full"
                                    required
                                >
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                <select
                                    value={editSemester}
                                    onChange={(e) => setEditSemester(e.target.value)}
                                    className="border p-2 rounded w-full"
                                    required
                                >
                                    <option value="1">1st Sem</option>
                                    <option value="2">2nd Sem</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={editSaving}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSaving}
                                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {editSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
