"use client";

import { useState, useEffect } from "react";
import ConfirmationModal from "@/app/components/ConfirmationModal";

export default function AdminStudentsPage() {
    // Upload State
    const [jsonInput, setJsonInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Single Student State
    const [singleStudentData, setSingleStudentData] = useState({ username: "", password: "", branch: "", year: "" });
    const [loadingSingle, setLoadingSingle] = useState(false);
    const [singleStudentStatus, setSingleStudentStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // List State
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("ALL");
    const [selectedYear, setSelectedYear] = useState("ALL");
    const [loadingList, setLoadingList] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch students on mount
    useEffect(() => {
        fetchStudents();
    }, []);

    // Filter students when branch, list, or search changes
    useEffect(() => {
        let result = students;

        if (selectedBranch !== "ALL") {
            result = result.filter(s => s.branch === selectedBranch);
        }

        if (selectedYear !== "ALL") {
            result = result.filter(s => s.year === parseInt(selectedYear));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s => s.username.toLowerCase().includes(query));
        }

        setFilteredStudents(result);
    }, [selectedBranch, selectedYear, searchQuery, students]);

    const fetchStudents = async () => {
        try {
            const res = await fetch("/api/admin/students");
            const data = await res.json();
            if (res.ok) {
                setStudents(data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoadingList(false);
        }
    };

    const handleSingleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingSingle(true);
        setSingleStudentStatus(null);

        try {
            const res = await fetch("/api/admin/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ students: [singleStudentData] }),
            });

            const data = await res.json();

            if (res.ok) {
                setSingleStudentStatus({ type: "success", message: "Student added successfully!" });
                setSingleStudentData({ username: "", password: "", branch: "", year: "" });
                fetchStudents();
            } else {
                setSingleStudentStatus({ type: "error", message: data.error || "Failed to add student" });
            }
        } catch (error) {
            setSingleStudentStatus({ type: "error", message: "An error occurred" });
        } finally {
            setLoadingSingle(false);
        }
    };

    const handleUpload = async () => {
        try {
            setLoading(true);
            setStatus(null);
            const students = JSON.parse(jsonInput);

            const res = await fetch("/api/admin/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ students }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: "success", message: `Successfully uploaded ${data.count} students.` });
                setJsonInput("");
                fetchStudents(); // Refresh list after upload
            } else {
                setStatus({ type: "error", message: data.error || "Upload failed" });
            }
        } catch (e) {
            setStatus({ type: "error", message: "Invalid JSON format" });
        } finally {
            setLoading(false);
        }
    };

    const downloadSampleCsv = () => {
        const headers = "username,password,branch,year";
        const sampleData = "student1,pass123,CSE,1\nstudent2,pass123,ECE,2";
        const csvContent = `${headers}\n${sampleData}`;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "student-data.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            // Simple CSV Parser
            const lines = text.split(/\r\n|\n/);
            const students = [];

            // Skip header if present (check if first line contains "username")
            const startIndex = lines[0].toLowerCase().includes("username") ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const parts = line.split(",");
                if (parts.length >= 3) {
                    students.push({
                        username: parts[0].trim(),
                        password: parts[1].trim(),
                        branch: parts[2].trim(),
                        year: parts[3] ? parts[3].trim() : null
                    });
                }
            }

            setJsonInput(JSON.stringify(students, null, 2));
            setStatus({ type: "success", message: `Parsed ${students.length} students from CSV. Click Upload to save.` });
        };
        reader.readAsText(file);
    };

    const confirmDeleteSelection = async () => {
        if (!selectedStudentId) return;

        setIsProcessing(true);
        try {
            const res = await fetch("/api/admin/selection", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedStudentId }),
            });

            if (res.ok) {
                fetchStudents(); // Refresh list
                setIsModalOpen(false);
                setSelectedStudentId(null);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to remove selection");
            }
        } catch (error) {
            console.error("Error removing selection:", error);
            alert("An error occurred while removing selection");
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmDeleteUser = async () => {
        if (!selectedStudentId) return;

        setIsProcessing(true);
        try {
            const res = await fetch("/api/admin/students", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedStudentId }),
            });

            if (res.ok) {
                fetchStudents(); // Refresh list
                setIsModalOpen(false);
                setSelectedStudentId(null);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete student");
            }
        } catch (error) {
            console.error("Error deleting student:", error);
            alert("An error occurred while deleting student");
        } finally {
            setIsProcessing(false);
        }
    };

    const openDeleteModal = (userId: string, action: "SELECTION" | "USER") => {
        setSelectedStudentId(userId);
        setModalAction(action);
        setIsModalOpen(true);
    };

    const [modalAction, setModalAction] = useState<"SELECTION" | "USER">("SELECTION");

    const sampleJson = `[
  { "username": "student1", "password": "password123", "branch": "CSE" },
  { "username": "student2", "password": "password123", "branch": "ECE" }
]`;

    // Get unique branches for filter
    const branches = ["ALL", ...Array.from(new Set(students.map(s => s.branch).filter(Boolean)))];

    const handleExportCsv = () => {
        const headers = "Username,Year,Branch,Selected Subject Code,Selected Subject Name";
        const rows = filteredStudents.map(s => {
            const subjectCode = s.selection?.subject?.code || "N/A";
            const subjectName = s.selection?.subject?.name || "N/A";
            return `${s.username},${s.year || ""},${s.branch || ""},${subjectCode},${subjectName}`;
        });

        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">Manage Students</h2>

            {/* Add Single Student Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-4">Add Single Student</h3>
                {singleStudentStatus && (
                    <div className={`p-4 rounded mb-4 ${singleStudentStatus.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {singleStudentStatus.message}
                    </div>
                )}
                <form onSubmit={handleSingleStudentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={singleStudentData.username}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, username: e.target.value })}
                        className="border p-2 rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={singleStudentData.password}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, password: e.target.value })}
                        className="border p-2 rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Branch (e.g., CSE)"
                        value={singleStudentData.branch}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, branch: e.target.value })}
                        className="border p-2 rounded"
                        required
                    />
                    <select
                        value={singleStudentData.year}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, year: e.target.value })}
                        className="border p-2 rounded"
                        required
                    >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                    <button
                        type="submit"
                        disabled={loadingSingle}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 md:col-span-2 w-full md:w-auto"
                    >
                        {loadingSingle ? "Adding..." : "Add Student"}
                    </button>
                </form>
            </div>

            {/* Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-4">Bulk Upload Students</h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Paste a JSON array of students below. Each object should have <code>username</code>, <code>password</code>, and <code>branch</code>.
                </p>

                <div className="flex gap-4 mb-4">
                    <button
                        onClick={downloadSampleCsv}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                        Download Sample CSV
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Option 1: Paste JSON</label>
                        <textarea
                            rows={5}
                            className="w-full border p-4 rounded font-mono text-sm mb-4"
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder={sampleJson}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Option 2: Upload CSV</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCsvUpload}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                            <p className="text-xs text-gray-500 mt-2">Format: username, password, branch, year</p>
                        </div>
                    </div>
                </div>

                {status && (
                    <div className={`p-4 rounded mb-4 ${status.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {status.message}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={loading || !jsonInput}
                    className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50 w-full md:w-auto"
                >
                    {loading ? "Uploading..." : "Upload Students (from JSON/CSV)"}
                </button>
            </div>

            {/* Student List Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-xl font-semibold">Student List</h3>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                        <button
                            onClick={handleExportCsv}
                            className="bg-green-600 text-white py-1 px-4 rounded hover:bg-green-700 text-sm whitespace-nowrap"
                        >
                            Export CSV
                        </button>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Search:</label>
                            <input
                                type="text"
                                placeholder="Username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border rounded px-3 py-1"
                            />
                        </div>

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

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Filter by Branch:</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="border rounded px-3 py-1"
                            >
                                {branches.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loadingList ? (
                    <p>Loading students...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selected Subject</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.year || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.branch || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {student.selection ? (
                                                <span className="text-green-600 font-medium">
                                                    {student.selection.subject.name} ({student.selection.subject.code})
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Not Selected</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {student.selection && (
                                                <button
                                                    onClick={() => openDeleteModal(student.id, "SELECTION")}
                                                    className="text-yellow-600 hover:text-yellow-900 text-xs border border-yellow-200 bg-yellow-50 px-2 py-1 rounded"
                                                >
                                                    Reset Selection
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openDeleteModal(student.id, "USER")}
                                                className="text-red-600 hover:text-red-900 text-xs border border-red-200 bg-red-50 px-2 py-1 rounded"
                                            >
                                                Delete User
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No students found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                title={modalAction === "SELECTION" ? "Reset Selection" : "Delete Student"}
                message={modalAction === "SELECTION"
                    ? "Are you sure you want to remove this student's selection? They will need to select a subject again."
                    : "Are you sure you want to delete this student? This will remove their account and any selections they have made. This action cannot be undone."
                }
                onConfirm={modalAction === "SELECTION" ? confirmDeleteSelection : confirmDeleteUser}
                onCancel={() => setIsModalOpen(false)}
                isLoading={isProcessing}
            />
        </div>
    );
}
