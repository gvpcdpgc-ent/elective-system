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
    branch?: string;
    year?: number;
}

export default function AdminSubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
    const [formData, setFormData] = useState({ name: "", code: "", limit: "", description: "", branch: "", year: "" });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [selectedYear, setSelectedYear] = useState("ALL");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        let result = subjects;
        if (selectedYear !== "ALL") {
            result = result.filter(s => s.year === parseInt(selectedYear));
        }
        setFilteredSubjects(result);
    }, [selectedYear, subjects]);

    const fetchSubjects = async () => {
        const res = await fetch("/api/subjects");
        if (res.ok) {
            const data = await res.json();
            setSubjects(data);
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
            setFormData({ name: "", code: "", limit: "", description: "", branch: "", year: "" });
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
                    <input
                        type="text"
                        placeholder="Branch (e.g., CSE, ECE)"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        className="border p-2 rounded"
                        required
                    />
                    <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="border p-2 rounded"
                        required
                    >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
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
                        <label className="text-sm font-medium text-gray-700">Filter by Year:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="border rounded px-3 py-1"
                        >
                            <option value="ALL">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
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
                                <td className="px-6 py-4 whitespace-nowrap">{subject.year || "-"}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{subject.branch || "All"}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{subject.limit}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${subject.currentCount >= subject.limit ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                                        }`}>
                                        {subject.currentCount} / {subject.limit}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => openDeleteModal(subject.id)}
                                        className="text-red-600 hover:text-red-900"
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
        </div>
    );
}
