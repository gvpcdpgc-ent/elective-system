"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/app/components/ConfirmationModal";

interface Subject {
    id: string;
    name: string;
    code: string;
    limit: number;
    currentCount: number;
    departmentId: string;
    department?: {
        name: string;
        code: string;
    };
    year?: number;
    categoryId: string;
    category?: {
        name: string;
        year: number;
        semester: number;
    };
}

export default function AdminSubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: "", code: "", limit: "", description: "", departmentId: "", categoryId: "" });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

    // Delete Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({ name: "", code: "", limit: "", description: "", departmentId: "", categoryId: "" });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        fetchSubjects();
        fetchCategories();
        fetchDepartments();
    }, []);

    useEffect(() => {
        let result = subjects;
        if (selectedCategoryFilter !== "ALL") {
            result = result.filter(s => s.categoryId === selectedCategoryFilter);
        }
        setFilteredSubjects(result);
    }, [selectedCategoryFilter, subjects]);

    const fetchSubjects = async () => {
        const res = await fetch("/api/subjects");
        if (res.ok) {
            const data = await res.json();
            setSubjects(data);
        }
    };

    const fetchCategories = async () => {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
            const data = await res.json();
            setCategories(data);
        }
    };

    const fetchDepartments = async () => {
        const res = await fetch("/api/admin/departments");
        if (res.ok) {
            const data = await res.json();
            setDepartments(data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        const res = await fetch("/api/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            setFormData({ name: "", code: "", limit: "", description: "", departmentId: "", categoryId: "" });
            setStatus({ type: "success", message: "Subject created successfully!" });
            fetchSubjects();
        } else {
            const data = await res.json();
            setStatus({ type: "error", message: data.error || "Failed to create subject" });
        }
        setLoading(false);
    };

    const confirmDelete = async () => {
        if (!selectedSubjectId) return;

        setIsProcessing(true);
        try {
            const res = await fetch("/api/subjects", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedSubjectId }),
            });

            if (res.ok) {
                fetchSubjects();
                setIsModalOpen(false);
                setSelectedSubjectId(null);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete subject");
            }
        } catch (error) {
            console.error("Error deleting subject:", error);
            alert("An error occurred while deleting subject");
        } finally {
            setIsProcessing(false);
        }
    };

    const openDeleteModal = (id: string) => {
        setSelectedSubjectId(id);
        setIsModalOpen(true);
    };

    const openEditModal = (subject: Subject) => {
        setEditSubjectId(subject.id);
        setEditFormData({
            name: subject.name,
            code: subject.code,
            limit: subject.limit.toString(),
            description: (subject as any).description || "",
            departmentId: subject.departmentId,
            categoryId: subject.categoryId
        });
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editSubjectId) return;
        setEditSaving(true);
        setEditError(null);

        try {
            const res = await fetch("/api/subjects", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editSubjectId,
                    ...editFormData
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchSubjects();
            } else {
                setEditError(data.error || "Failed to update subject");
            }
        } catch (error) {
            setEditError("An error occurred");
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">Manage Subjects</h2>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-4">Add New Subject</h3>

                {status && (
                    <div className={`p-4 rounded mb-4 ${status.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Subject Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="border p-2 rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Subject Code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="border p-2 rounded"
                        required
                    />
                    <input
                        type="number"
                        placeholder="Seat Limit"
                        value={formData.limit}
                        onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                        className="border p-2 rounded"
                        required
                    />
                    <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        className="border p-2 rounded"
                        required
                    >
                        <option value="">Select Department (Branch)</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                        ))}
                    </select>
                    
                    <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="border p-2 rounded md:col-span-2"
                        required
                    >
                        <option value="">Select Elective Category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.year} Year / {cat.semester} Sem)
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Description (Optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="border p-2 rounded md:col-span-2"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 md:col-span-2"
                    >
                        {loading ? "Adding..." : "Add Subject"}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
                <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
                        <select
                            value={selectedCategoryFilter}
                            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                            className="border rounded px-3 py-1"
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filled</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSubjects.map((subject) => (
                            <tr key={subject.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{subject.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{subject.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{subject.category?.name || "Uncategorized"}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{subject.department?.name || "All"}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{subject.limit}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${subject.currentCount >= subject.limit ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                                        }`}>
                                        {subject.currentCount} / {subject.limit}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => openEditModal(subject)}
                                        className="text-blue-600 hover:text-blue-900 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded text-xs font-normal"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(subject.id)}
                                        className="text-red-600 hover:text-red-900 border border-red-200 bg-red-50 px-2.5 py-1 rounded text-xs font-normal"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                title="Delete Subject"
                message="Are you sure you want to delete this subject? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setIsModalOpen(false)}
                isLoading={isProcessing}
            />

            {/* Edit Subject Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Subject</h3>
                        {editError && (
                            <div className="p-3 bg-red-100 text-red-800 rounded mb-4 text-sm">
                                {editError}
                            </div>
                        )}
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                                <input
                                    type="text"
                                    value={editFormData.code}
                                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Limit</label>
                                <input
                                    type="number"
                                    value={editFormData.limit}
                                    onChange={(e) => setEditFormData({ ...editFormData, limit: e.target.value })}
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select
                                    value={editFormData.departmentId}
                                    onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                                    className="border p-2 rounded w-full"
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Elective Category</label>
                                <select
                                    value={editFormData.categoryId}
                                    onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                                    className="border p-2 rounded w-full"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} ({cat.year} Year / {cat.semester} Sem)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="border p-2 rounded w-full"
                                />
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
