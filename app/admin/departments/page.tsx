"use client";

import { useState, useEffect } from "react";
import ConfirmationModal from "@/app/components/ConfirmationModal";

export default function AdminDepartmentsPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Delete Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editDeptId, setEditDeptId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editCode, setEditCode] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/admin/departments");
            const data = await res.json();
            if (res.ok) {
                setDepartments(data);
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDept = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            const res = await fetch("/api/admin/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, code }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: "success", message: "Department created successfully!" });
                setName("");
                setCode("");
                fetchDepartments();
            } else {
                setStatus({ type: "error", message: data.error || "Failed to create department" });
            }
        } catch (error) {
            setStatus({ type: "error", message: "An error occurred" });
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (id: string) => {
        setSelectedDeptId(id);
        setIsModalOpen(true);
    };

    const confirmDeleteDept = async () => {
        if (!selectedDeptId) return;
        setDeleting(true);

        try {
            const res = await fetch("/api/admin/departments", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedDeptId }),
            });

            if (res.ok) {
                fetchDepartments();
                setIsModalOpen(false);
                setSelectedDeptId(null);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete department");
            }
        } catch (error) {
            console.error("Error deleting department:", error);
            alert("An error occurred while deleting department");
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (dept: any) => {
        setEditDeptId(dept.id);
        setEditName(dept.name);
        setEditCode(dept.code);
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleEditDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDeptId) return;
        setEditSaving(true);
        setEditError(null);

        try {
            const res = await fetch("/api/admin/departments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editDeptId, name: editName, code: editCode }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchDepartments();
            } else {
                setEditError(data.error || "Failed to update department");
            }
        } catch (error) {
            setEditError("An error occurred");
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">Manage Departments</h2>

            {/* Create Department Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-4">Create New Department</h3>
                {status && (
                    <div className={`p-4 rounded mb-4 ${status.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {status.message}
                    </div>
                )}
                <form onSubmit={handleCreateDept} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                        <input
                            type="text"
                            placeholder="e.g. COMPUTER SCIENCE AND ENGINEERING"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border p-2 rounded w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                        <input
                            type="text"
                            placeholder="e.g. CSE"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="border p-2 rounded w-full"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 md:col-span-2 w-full md:w-auto"
                    >
                        {saving ? "Creating..." : "Create Department"}
                    </button>
                </form>
            </div>

            {/* Departments List Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-6">Departments List</h3>
                {loading ? (
                    <p>Loading departments...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students Count</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects Count</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {departments.map((dept) => (
                                    <tr key={dept.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept._count?.users || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept._count?.subjects || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => openEditModal(dept)}
                                                className="text-blue-600 hover:text-blue-900 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(dept.id)}
                                                className="text-red-600 hover:text-red-900 border border-red-200 bg-red-50 px-2.5 py-1 rounded text-xs"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {departments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No departments found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                title="Delete Department"
                message="Are you sure you want to delete this department? This will delete all subjects and selections associated with it. This action cannot be undone."
                onConfirm={confirmDeleteDept}
                onCancel={() => setIsModalOpen(false)}
                isLoading={deleting}
            />

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Department</h3>
                        {editError && (
                            <div className="p-3 bg-red-100 text-red-800 rounded mb-4 text-sm">
                                {editError}
                            </div>
                        )}
                        <form onSubmit={handleEditDept} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                                <input
                                    type="text"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value)}
                                    className="border p-2 rounded w-full"
                                    required
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
