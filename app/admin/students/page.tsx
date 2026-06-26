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
    const [departments, setDepartments] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("ALL");
    const [selectedYear, setSelectedYear] = useState("ALL");
    const [loadingList, setLoadingList] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Delete Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [modalAction, setModalAction] = useState<"SELECTION" | "USER" | "ALL_SELECTIONS" | "ALL_STUDENTS">("SELECTION");

    // Assign Subject Modal
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignStudent, setAssignStudent] = useState<any>(null);
    const [assignCategoryId, setAssignCategoryId] = useState("");
    const [assignSubjectId, setAssignSubjectId] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

    // Reset Password Modal State
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [resetPasswordStudent, setResetPasswordStudent] = useState<any>(null);
    const [newPasswordVal, setNewPasswordVal] = useState("");
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
    const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
    const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);

    // CSV Preview State
    const [csvPreview, setCsvPreview] = useState<{ rows: any[]; errors: string[] } | null>(null);
    const [csvSkipErrors, setCsvSkipErrors] = useState(false);

    useEffect(() => {
        fetchStudents();
        fetchDepartments();
        fetchCategories();
        fetchSubjects();
    }, []);

    useEffect(() => {
        let result = students;
        if (selectedBranch !== "ALL") result = result.filter(s => s.department?.code === selectedBranch);
        if (selectedYear !== "ALL") result = result.filter(s => s.year === parseInt(selectedYear));
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s => s.username.toLowerCase().includes(query));
        }
        setFilteredStudents(result);
    }, [selectedBranch, selectedYear, searchQuery, students]);

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/admin/departments");
            const data = await res.json();
            if (res.ok) setDepartments(data);
        } catch (error) { console.error("Failed to fetch departments", error); }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch("/api/admin/students");
            const data = await res.json();
            if (res.ok) setStudents(data);
        } catch (error) { console.error("Failed to fetch students", error); } finally { setLoadingList(false); }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/admin/categories");
            const data = await res.json();
            if (res.ok) setCategories(data);
        } catch (error) { console.error("Failed to fetch categories", error); }
    };

    const fetchSubjects = async () => {
        try {
            const res = await fetch("/api/subjects");
            const data = await res.json();
            if (res.ok) setSubjects(data);
        } catch (error) { console.error("Failed to fetch subjects", error); }
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
        } finally { setLoadingSingle(false); }
    };

    const handleUpload = async () => {
        try {
            setLoading(true);
            setStatus(null);
            const studentsToUpload = JSON.parse(jsonInput);
            const res = await fetch("/api/admin/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ students: studentsToUpload }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus({ type: "success", message: `Successfully uploaded ${data.count} students.` });
                setJsonInput("");
                setCsvPreview(null);
                fetchStudents();
            } else {
                setStatus({ type: "error", message: data.error || "Upload failed" });
            }
        } catch (e) {
            setStatus({ type: "error", message: "Invalid JSON format" });
        } finally { setLoading(false); }
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

    // ---- CSV Upload with Preview ----
    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validDeptCodes = new Set(departments.map((d: any) => d.code.toUpperCase()));

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r\n|\n/);
            const rows: any[] = [];
            const startIndex = lines[0].toLowerCase().includes("username") ? 1 : 0;
            const seenUsernames = new Set<string>();

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(",");
                const username = parts[0]?.trim();
                const password = parts[1]?.trim();
                const branch = parts[2]?.trim().toUpperCase();
                const year = parts[3]?.trim();

                const errors: string[] = [];
                if (!username) errors.push("Missing username");
                if (!password) errors.push("Missing password");
                if (!branch) errors.push("Missing branch");
                else if (!validDeptCodes.has(branch)) errors.push(`Unknown branch "${branch}"`);
                if (year && (isNaN(parseInt(year)) || parseInt(year) < 1 || parseInt(year) > 4)) errors.push("Year must be 1–4");
                if (username && seenUsernames.has(username)) errors.push("Duplicate username in CSV");
                if (username) seenUsernames.add(username);

                rows.push({ username, password, branch, year: year || "", errors, rowNum: i + 1 });
            }

            const allErrors = rows.flatMap(r => r.errors.map((e: string) => `Row ${r.rowNum}: ${e}`));
            setCsvPreview({ rows, errors: allErrors });
            // Also set the JSON for upload (only valid rows)
            const validRows = rows.filter(r => r.errors.length === 0);
            setJsonInput(JSON.stringify(validRows.map(r => ({
                username: r.username,
                password: r.password,
                branch: r.branch,
                year: r.year,
            })), null, 2));
        };
        reader.readAsText(file);
    };

    // ---- Delete / Modal Actions ----
    const confirmDeleteSelection = async () => {
        if (!selectedStudentId) return;
        setIsProcessing(true);
        try {
            const res = await fetch("/api/admin/selection", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedStudentId }),
            });
            if (res.ok) { fetchStudents(); setIsModalOpen(false); setSelectedStudentId(null); }
            else { const data = await res.json(); alert(data.error || "Failed to remove selection"); }
        } catch (error) { alert("An error occurred"); } finally { setIsProcessing(false); }
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
            if (res.ok) { fetchStudents(); setIsModalOpen(false); setSelectedStudentId(null); }
            else { const data = await res.json(); alert(data.error || "Failed to delete student"); }
        } catch (error) { alert("An error occurred"); } finally { setIsProcessing(false); }
    };

    const confirmDeleteAllSelections = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch("/api/admin/selection", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: "all" }),
            });
            if (res.ok) { fetchStudents(); setIsModalOpen(false); }
            else { const data = await res.json(); alert(data.error || "Failed to remove all selections"); }
        } catch (error) { alert("An error occurred"); } finally { setIsProcessing(false); }
    };

    const confirmDeleteAllStudents = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch("/api/admin/students", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: "all" }),
            });
            if (res.ok) { fetchStudents(); setIsModalOpen(false); }
            else { const data = await res.json(); alert(data.error || "Failed to delete all students"); }
        } catch (error) { alert("An error occurred"); } finally { setIsProcessing(false); }
    };

    const openDeleteModal = (userId: string, action: "SELECTION" | "USER") => {
        setSelectedStudentId(userId);
        setModalAction(action);
        setIsModalOpen(true);
    };

    const openBulkDeleteModal = (action: "ALL_SELECTIONS" | "ALL_STUDENTS") => {
        setSelectedStudentId(null);
        setModalAction(action);
        setIsModalOpen(true);
    };

    // ---- Assign Subject ----
    const openAssignModal = (student: any) => {
        setAssignStudent(student);
        setAssignCategoryId("");
        setAssignSubjectId("");
        setAssignError(null);
        setAssignSuccess(null);
        setAssignModalOpen(true);
    };

    const filteredSubjectsForAssign = subjects.filter(s => s.categoryId === assignCategoryId);

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignStudent || !assignCategoryId || !assignSubjectId) return;
        setAssignLoading(true);
        setAssignError(null);
        setAssignSuccess(null);
        try {
            const res = await fetch("/api/admin/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: assignStudent.id, categoryId: assignCategoryId, subjectId: assignSubjectId }),
            });
            const data = await res.json();
            if (res.ok) {
                setAssignSuccess(`✅ Successfully assigned "${data.subject?.name}" to ${assignStudent.username}.`);
                fetchStudents();
            } else {
                setAssignError(data.error || "Assignment failed");
            }
        } catch (err) {
            setAssignError("An error occurred");
        } finally { setAssignLoading(false); }
    };

    // ---- Reset Password ----
    const openResetPasswordModal = (student: any) => {
        setResetPasswordStudent(student);
        setNewPasswordVal("");
        setResetPasswordError(null);
        setResetPasswordSuccess(null);
        setResetPasswordModalOpen(true);
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetPasswordStudent || !newPasswordVal) return;
        setResetPasswordLoading(true);
        setResetPasswordError(null);
        setResetPasswordSuccess(null);
        try {
            const res = await fetch("/api/admin/students", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: resetPasswordStudent.id, newPassword: newPasswordVal }),
            });
            const data = await res.json();
            if (res.ok) {
                setResetPasswordSuccess(`✅ Password successfully reset for ${resetPasswordStudent.username}.`);
            } else {
                setResetPasswordError(data.error || "Password reset failed");
            }
        } catch (err) {
            setResetPasswordError("An error occurred");
        } finally {
            setResetPasswordLoading(false);
        }
    };

    // ---- Export CSV ----
    const handleExportCsv = () => {
        const categoryNames = Array.from(new Set(
            students.flatMap(s => s.selections?.map((sel: any) => sel.category.name) || [])
        )).sort();
        const headers = ["Username", "Year", "Branch", ...categoryNames].join(",");
        const rows = filteredStudents.map(s => {
            const selectionCols = categoryNames.map(catName => {
                const foundSel = s.selections?.find((sel: any) => sel.category.name === catName);
                return foundSel ? `"${foundSel.subject.name} (${foundSel.subject.code})"` : "N/A";
            });
            return [s.username, s.year || "", s.department?.code || "", ...selectionCols].join(",");
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

    const branches = ["ALL", ...departments.map(d => d.code)];
    const sampleJson = `[\n  { "username": "student1", "password": "password123", "branch": "CSE" },\n  { "username": "student2", "password": "password123", "branch": "ECE" }\n]`;

    const validRows = csvPreview?.rows.filter(r => r.errors.length === 0) ?? [];
    const invalidRows = csvPreview?.rows.filter(r => r.errors.length > 0) ?? [];
    const uploadableRows = csvSkipErrors ? validRows : csvPreview?.rows ?? [];
    const canUpload = csvPreview
        ? (csvSkipErrors ? validRows.length > 0 : invalidRows.length === 0)
        : !!jsonInput;

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
                    <input type="text" placeholder="Username" value={singleStudentData.username}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, username: e.target.value })}
                        className="border p-2 rounded" required />
                    <input type="password" placeholder="Password" value={singleStudentData.password}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, password: e.target.value })}
                        className="border p-2 rounded" required />
                    <select value={singleStudentData.branch}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, branch: e.target.value })}
                        className="border p-2 rounded" required>
                        <option value="">Select Department (Branch)</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.code}>{dept.name} ({dept.code})</option>
                        ))}
                    </select>
                    <select value={singleStudentData.year}
                        onChange={(e) => setSingleStudentData({ ...singleStudentData, year: e.target.value })}
                        className="border p-2 rounded" required>
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                    <button type="submit" disabled={loadingSingle}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 md:col-span-2 w-full md:w-auto">
                        {loadingSingle ? "Adding..." : "Add Student"}
                    </button>
                </form>
            </div>

            {/* Bulk Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-4">Bulk Upload Students</h3>
                <p className="text-gray-600 mb-4 text-sm">Upload a CSV file — it will be validated before upload.</p>

                <div className="flex gap-4 mb-4">
                    <button onClick={downloadSampleCsv} className="text-blue-600 hover:text-blue-800 text-sm underline">
                        Download Sample CSV
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Option 1: Upload CSV (with preview)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                            <input type="file" accept=".csv" onChange={handleCsvUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            <p className="text-xs text-gray-500 mt-2">Format: username, password, branch, year</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Option 2: Paste JSON</label>
                        <textarea rows={5} className="w-full border p-4 rounded font-mono text-sm"
                            value={jsonInput} onChange={(e) => { setJsonInput(e.target.value); setCsvPreview(null); }}
                            placeholder={sampleJson} />
                    </div>
                </div>

                {/* CSV Preview Table */}
                {csvPreview && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-700">
                                    Preview: {csvPreview.rows.length} rows
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    ✅ {validRows.length} valid
                                </span>
                                {invalidRows.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                        ❌ {invalidRows.length} errors
                                    </span>
                                )}
                            </div>
                            {invalidRows.length > 0 && (
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={csvSkipErrors}
                                        onChange={e => setCsvSkipErrors(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 rounded" />
                                    Skip invalid rows and upload only valid ones
                                </label>
                            )}
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-72">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Row</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Username</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Branch</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Year</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {csvPreview.rows.map((row, i) => (
                                        <tr key={i} className={row.errors.length > 0 ? "bg-red-50" : "bg-green-50"}>
                                            <td className="px-4 py-2 text-gray-400 font-mono text-xs">{row.rowNum}</td>
                                            <td className="px-4 py-2 font-medium text-gray-900">{row.username || <span className="text-gray-400 italic">—</span>}</td>
                                            <td className="px-4 py-2 text-gray-700">{row.branch || <span className="text-gray-400 italic">—</span>}</td>
                                            <td className="px-4 py-2 text-gray-700">{row.year || <span className="text-gray-400 italic">—</span>}</td>
                                            <td className="px-4 py-2">
                                                {row.errors.length === 0 ? (
                                                    <span className="text-green-600 font-semibold text-xs">✅ Valid</span>
                                                ) : (
                                                    <span className="text-red-600 text-xs font-medium">❌ {row.errors.join("; ")}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {status && (
                    <div className={`p-4 rounded mb-4 ${status.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {status.message}
                    </div>
                )}

                <button onClick={() => {
                    if (csvPreview && csvSkipErrors) {
                        setJsonInput(JSON.stringify(validRows.map(r => ({
                            username: r.username, password: r.password, branch: r.branch, year: r.year,
                        })), null, 2));
                    }
                    handleUpload();
                }}
                    disabled={loading || !canUpload}
                    className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50 w-full md:w-auto">
                    {loading ? "Uploading..." : csvPreview
                        ? `Upload ${csvSkipErrors ? validRows.length : uploadableRows.length} Students`
                        : "Upload Students (from JSON/CSV)"}
                </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-red-900">Danger Zone (Bulk Actions)</h3>
                    <p className="text-sm text-red-700 mt-1">These actions are highly destructive and cannot be undone.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => openBulkDeleteModal("ALL_SELECTIONS")}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded text-sm">
                        Reset All Selections
                    </button>
                    <button onClick={() => openBulkDeleteModal("ALL_STUDENTS")}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm">
                        Delete All Students
                    </button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-xl font-semibold">Student List</h3>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                        <button onClick={handleExportCsv} className="bg-green-600 text-white py-1 px-4 rounded hover:bg-green-700 text-sm whitespace-nowrap">
                            Export CSV
                        </button>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Search:</label>
                            <input type="text" placeholder="Username..." value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} className="border rounded px-3 py-1" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Year:</label>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border rounded px-3 py-1">
                                <option value="ALL">All Years</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Branch:</label>
                            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="border rounded px-3 py-1">
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department?.code || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {student.selections && student.selections.length > 0 ? (
                                                <div className="space-y-1">
                                                    {student.selections.map((sel: any) => (
                                                        <div key={sel.id} className="text-xs">
                                                            <span className="font-semibold text-blue-600">{sel.category.name}:</span>{" "}
                                                            <span className="text-green-600 font-medium">{sel.subject.name} ({sel.subject.code})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Not Selected</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => openAssignModal(student)}
                                                className="text-purple-600 hover:text-purple-900 text-xs border border-purple-200 bg-purple-50 px-2 py-1 rounded"
                                            >
                                                Assign Subject
                                            </button>
                                            {student.selections && student.selections.length > 0 && (
                                                <button
                                                    onClick={() => openDeleteModal(student.id, "SELECTION")}
                                                    className="text-yellow-600 hover:text-yellow-900 text-xs border border-yellow-200 bg-yellow-50 px-2 py-1 rounded"
                                                >
                                                    Reset Selections
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openResetPasswordModal(student)}
                                                className="text-blue-600 hover:text-blue-900 text-xs border border-blue-200 bg-blue-50 px-2 py-1 rounded"
                                            >
                                                Reset Password
                                            </button>
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

            {/* Assign Subject Modal */}
            {assignModalOpen && assignStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Assign Subject</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Manually assign a subject to <span className="font-semibold text-gray-800">{assignStudent.username}</span>. Bypasses window and seat limits.
                        </p>

                        {assignError && (
                            <div className="p-3 bg-red-100 text-red-800 rounded mb-4 text-sm font-medium">{assignError}</div>
                        )}
                        {assignSuccess && (
                            <div className="p-3 bg-green-100 text-green-800 rounded mb-4 text-sm font-medium">{assignSuccess}</div>
                        )}

                        {!assignSuccess && (
                            <form onSubmit={handleAssignSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Elective Category</label>
                                    <select value={assignCategoryId}
                                        onChange={(e) => { setAssignCategoryId(e.target.value); setAssignSubjectId(""); }}
                                        className="border p-2 rounded w-full" required>
                                        <option value="">Choose category...</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.year} Year / {c.semester} Sem)</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select value={assignSubjectId} onChange={(e) => setAssignSubjectId(e.target.value)}
                                        className="border p-2 rounded w-full" required disabled={!assignCategoryId}>
                                        <option value="">Choose subject...</option>
                                        {filteredSubjectsForAssign.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code}) — {s.currentCount}/{s.limit} seats</option>
                                        ))}
                                    </select>
                                    {assignCategoryId && filteredSubjectsForAssign.length === 0 && (
                                        <p className="text-xs text-orange-600 mt-1">No subjects in this category.</p>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setAssignModalOpen(false)} disabled={assignLoading}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 text-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={assignLoading || !assignCategoryId || !assignSubjectId}
                                        className="px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 text-sm font-semibold">
                                        {assignLoading ? "Assigning..." : "Assign Subject"}
                                    </button>
                                </div>
                            </form>
                        )}
                        {assignSuccess && (
                            <div className="flex justify-end">
                                <button onClick={() => setAssignModalOpen(false)}
                                    className="px-4 py-2 text-white bg-gray-700 rounded hover:bg-gray-800 text-sm">
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPasswordModalOpen && resetPasswordStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Reset password for student <span className="font-semibold text-gray-800">{resetPasswordStudent.username}</span>.
                        </p>

                        {resetPasswordError && (
                            <div className="p-3 bg-red-100 text-red-800 rounded mb-4 text-sm font-medium">{resetPasswordError}</div>
                        )}
                        {resetPasswordSuccess && (
                            <div className="p-3 bg-green-100 text-green-800 rounded mb-4 text-sm font-medium">{resetPasswordSuccess}</div>
                        )}

                        {!resetPasswordSuccess && (
                            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="text"
                                        value={newPasswordVal}
                                        onChange={(e) => setNewPasswordVal(e.target.value)}
                                        placeholder="e.g. DDMMYYYY"
                                        className="border p-2 rounded w-full"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setResetPasswordModalOpen(false)} disabled={resetPasswordLoading}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 text-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={resetPasswordLoading || !newPasswordVal}
                                        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold">
                                        {resetPasswordLoading ? "Resetting..." : "Reset Password"}
                                    </button>
                                </div>
                            </form>
                        )}
                        {resetPasswordSuccess && (
                            <div className="flex justify-end">
                                <button onClick={() => setResetPasswordModalOpen(false)}
                                    className="px-4 py-2 text-white bg-gray-700 rounded hover:bg-gray-800 text-sm">
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                title={
                    modalAction === "SELECTION" ? "Reset Selection" :
                    modalAction === "USER" ? "Delete Student" :
                    modalAction === "ALL_SELECTIONS" ? "Reset All Selections" :
                    "Delete All Students"
                }
                message={
                    modalAction === "SELECTION" ? "Are you sure you want to remove this student's selection?" :
                    modalAction === "USER" ? "Are you sure you want to delete this student? This action cannot be undone." :
                    modalAction === "ALL_SELECTIONS" ? "Are you sure you want to reset ALL selections? This cannot be undone." :
                    "Are you sure you want to delete ALL students? This cannot be undone."
                }
                onConfirm={
                    modalAction === "SELECTION" ? confirmDeleteSelection :
                    modalAction === "USER" ? confirmDeleteUser :
                    modalAction === "ALL_SELECTIONS" ? confirmDeleteAllSelections :
                    confirmDeleteAllStudents
                }
                onCancel={() => setIsModalOpen(false)}
                isLoading={isProcessing}
            />
        </div>
    );
}
