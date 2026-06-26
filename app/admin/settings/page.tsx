"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({ isStudentLoginEnabled: true, isVirtualQueueEnabled: false, maxConcurrency: 50 });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Queue reset
    const [queueResetting, setQueueResetting] = useState(false);
    const [queueResetMessage, setQueueResetMessage] = useState<string | null>(null);

    // Categories & Windows
    const [categories, setCategories] = useState<any[]>([]);
    const [windows, setWindows] = useState<any[]>([]);

    // Create Window Form
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [windowSaving, setWindowSaving] = useState(false);
    const [windowError, setWindowError] = useState<string | null>(null);

    // Edit Window Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editWindowId, setEditWindowId] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState("");
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
        fetchCategories();
        fetchWindows();
    }, []);

    const fetchSettings = () => {
        fetch("/api/settings")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                if (data) {
                    setSettings({
                        isStudentLoginEnabled: data.isStudentLoginEnabled ?? true,
                        isVirtualQueueEnabled: data.isVirtualQueueEnabled ?? false,
                        maxConcurrency: data.maxConcurrency ?? 50,
                    });
                }
            })
            .catch((err) => {
                console.error("Error fetching settings:", err);
            });
    };

    const fetchCategories = () => {
        fetch("/api/admin/categories")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) setCategories(data);
            })
            .catch((err) => {
                console.error("Error fetching categories:", err);
            });
    };

    const fetchWindows = () => {
        fetch("/api/admin/windows")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) setWindows(data);
            })
            .catch((err) => {
                console.error("Error fetching windows:", err);
            });
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
        });

        if (res.ok) {
            setMessage("Settings saved successfully");
        } else {
            setMessage("Failed to save settings");
        }
        setLoading(false);
    };

    const handleExport = (type: string) => {
        window.open(`/api/admin/export?type=${type}`, "_blank");
    };

    const handleQueueReset = async () => {
        if (!confirm("This will clear all active session slots and the waiting queue. Any students currently on the dashboard or waiting room will be redirected. Continue?")) return;
        setQueueResetting(true);
        setQueueResetMessage(null);
        try {
            const res = await fetch("/api/admin/queue-reset", { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                setQueueResetMessage(`✅ Reset complete — ${data.activeUsersCleared} active session(s) and ${data.queueCleared} queue entry(ies) cleared.`);
            } else {
                setQueueResetMessage(`❌ Failed: ${data.error}`);
            }
        } catch (err) {
            setQueueResetMessage("❌ An error occurred.");
        } finally {
            setQueueResetting(false);
        }
    };

    const handleCreateWindow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId || !startTime || !endTime) return;
        setWindowSaving(true);
        setWindowError(null);

        try {
            const res = await fetch("/api/admin/windows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryId: selectedCategoryId, startTime, endTime }),
            });

            const data = await res.json();

            if (res.ok) {
                setSelectedCategoryId("");
                setStartTime("");
                setEndTime("");
                fetchWindows();
            } else {
                setWindowError(data.error || "Failed to create selection window");
            }
        } catch (error) {
            setWindowError("An error occurred");
        } finally {
            setWindowSaving(false);
        }
    };

    const openEditModal = (win: any) => {
        setEditWindowId(win.id);
        setEditCategoryName(win.category.name);
        setEditStartTime(new Date(win.startTime).toISOString().slice(0, 16));
        setEditEndTime(new Date(win.endTime).toISOString().slice(0, 16));
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleEditWindow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editWindowId || !editStartTime || !editEndTime) return;
        setEditSaving(true);
        setEditError(null);

        try {
            const res = await fetch("/api/admin/windows", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editWindowId, startTime: editStartTime, endTime: editEndTime }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsEditModalOpen(false);
                fetchWindows();
            } else {
                setEditError(data.error || "Failed to update selection window");
            }
        } catch (error) {
            setEditError("An error occurred");
        } finally {
            setEditSaving(false);
        }
    };

    const handleDeleteWindow = async (id: string) => {
        if (!confirm("Are you sure you want to delete this selection window?")) return;

        try {
            const res = await fetch("/api/admin/windows", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                fetchWindows();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete selection window");
            }
        } catch (error) {
            alert("An error occurred");
        }
    };

    const handleCloseWindowNow = async (win: any) => {
        if (!confirm(`Are you sure you want to close the window for ${win.category.name} immediately?`)) return;

        try {
            const res = await fetch("/api/admin/windows", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: win.id, startTime: win.startTime, endTime: new Date().toISOString() }),
            });

            if (res.ok) {
                fetchWindows();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to close selection window");
            }
        } catch (error) {
            alert("An error occurred");
        }
    };

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    return (
        <div className="space-y-8 pb-12">
            <h2 className="text-3xl font-bold">System Settings & Scheduling</h2>

            {/* General Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-6">General System Config</h3>

                <div className="mb-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.isStudentLoginEnabled}
                            onChange={(e) => setSettings({ ...settings, isStudentLoginEnabled: e.target.checked })}
                            className="h-5 w-5 text-blue-600 rounded"
                        />
                        <span className="text-gray-700 font-semibold">Enable Student Login</span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1 ml-8">
                        If unchecked, students will not be able to log in to the portal.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.isVirtualQueueEnabled}
                            onChange={(e) => setSettings({ ...settings, isVirtualQueueEnabled: e.target.checked })}
                            className="h-5 w-5 text-blue-600 rounded"
                        />
                        <span className="text-gray-700 font-semibold">Enable Virtual Waiting Room (Queue)</span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1 ml-8">
                        If checked, students will enter a virtual queue under high traffic load to protect the database.
                    </p>
                </div>

                {settings.isVirtualQueueEnabled && (
                    <div className="mb-6 ml-8">
                        <label className="block text-sm font-medium text-gray-700">
                            Maximum Concurrency Limit (Students allowed at a time)
                        </label>
                        <input
                            type="number"
                            value={settings.maxConcurrency}
                            onChange={(e) => setSettings({ ...settings, maxConcurrency: parseInt(e.target.value) || 1 })}
                            min="1"
                            className="mt-1 block w-32 border border-gray-300 rounded px-3 py-2 text-gray-950 font-medium"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            For local testing, set this to 1 or 2. Default is 50.
                        </p>
                    </div>
                )}

                {message && (
                    <p className={`mb-4 ${message.includes("Failed") ? "text-red-600 font-medium" : "text-green-600 font-medium"}`}>
                        {message}
                    </p>
                )}

                <button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save Settings"}
                </button>
            </div>

            {/* Selection Scheduling Windows */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-6">Selection Windows (Scheduling)</h3>

                {windowError && (
                    <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm font-medium">
                        {windowError}
                    </div>
                )}

                {/* Create Window Form */}
                <form onSubmit={handleCreateWindow} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-8 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="border p-2 rounded w-full bg-white text-sm"
                            required
                        >
                            <option value="">Choose category...</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Semester (Info)</label>
                        <input
                            type="text"
                            value={selectedCategory ? `${selectedCategory.year} Year / ${selectedCategory.semester} Sem` : ""}
                            className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed text-sm"
                            disabled
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="border p-2 rounded w-full bg-white text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="border p-2 rounded w-full bg-white text-sm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={windowSaving}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 md:col-span-2 lg:col-span-4 w-full md:w-auto mt-2"
                    >
                        {windowSaving ? "Scheduling..." : "Schedule Selection Window"}
                    </button>
                </form>

                {/* Active Windows List */}
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Active Scheduling Windows</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time (Deadline)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {windows.map((win) => {
                                const now = new Date();
                                const start = new Date(win.startTime);
                                const end = new Date(win.endTime);
                                let statusText = "Active";
                                let statusClass = "bg-green-100 text-green-800";

                                if (now < start) {
                                    statusText = "Scheduled";
                                    statusClass = "bg-yellow-100 text-yellow-800";
                                } else if (now > end) {
                                    statusText = "Closed";
                                    statusClass = "bg-red-100 text-red-800";
                                }

                                return (
                                    <tr key={win.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{win.category.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {win.category.year} Year / {win.category.semester} Sem
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{start.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{end.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusClass}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {statusText !== "Closed" && (
                                                <button
                                                    onClick={() => handleCloseWindowNow(win)}
                                                    className="text-orange-600 hover:text-orange-950 border border-orange-200 bg-orange-50 px-2.5 py-1 rounded text-xs font-normal"
                                                >
                                                    Close Now
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(win)}
                                                className="text-blue-600 hover:text-blue-900 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded text-xs font-normal"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWindow(win.id)}
                                                className="text-red-600 hover:text-red-900 border border-red-200 bg-red-50 px-2.5 py-1 rounded text-xs font-normal"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {windows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No selection windows scheduled yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Data Management Reports */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-6">Data Management & Reports</h3>
                <p className="text-gray-600 mb-6 font-normal">Download custom reports containing all student subject choices formatted for direct administrative processing.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border p-5 rounded-lg flex flex-col justify-between bg-gray-50">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2">Department-wise List</h4>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Export selections grouped by student's department (e.g. MECH students list containing their elective selections).</p>
                        </div>
                        <button
                            onClick={() => handleExport("department")}
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm font-medium w-full transition-colors"
                        >
                            Export Department List
                        </button>
                    </div>

                    <div className="border p-5 rounded-lg flex flex-col justify-between bg-gray-50">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2">Open Elective-wise List</h4>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Export selections grouped by elective categories (e.g., complete student choice list for OPEN ELECTIVE - I).</p>
                        </div>
                        <button
                            onClick={() => handleExport("category")}
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm font-medium w-full transition-colors"
                        >
                            Export Elective List
                        </button>
                    </div>

                    <div className="border p-5 rounded-lg flex flex-col justify-between bg-gray-50">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-2">Subject-wise List</h4>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Export selections sorted by the department offering the subject (e.g., list of students from all branches in CSE OE-I subject).</p>
                        </div>
                        <button
                            onClick={() => handleExport("subject")}
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm font-medium w-full transition-colors"
                        >
                            Export Subject List
                        </button>
                    </div>
                </div>
            </div>

            {/* Queue / Active Session Reset */}
            <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-orange-900">Virtual Queue Management</h3>
                <p className="text-sm text-orange-700 mb-4">
                    If students are stuck in the waiting room due to stale sessions (e.g., after server restarts or testing),
                    use this to clear all active session slots and the queue instantly.
                </p>
                {queueResetMessage && (
                    <p className={`mb-4 text-sm font-medium ${queueResetMessage.startsWith("✅") ? "text-green-700" : "text-red-700"}`}>
                        {queueResetMessage}
                    </p>
                )}
                <button
                    onClick={handleQueueReset}
                    disabled={queueResetting}
                    className="bg-orange-600 text-white py-2 px-5 rounded hover:bg-orange-700 disabled:opacity-50 font-medium"
                >
                    {queueResetting ? "Resetting..." : "🔄 Reset Active Sessions & Queue"}
                </button>
            </div>

            {/* Edit Window Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Selection Window</h3>
                        <p className="text-sm text-gray-600 mb-4">Category: <strong>{editCategoryName}</strong></p>
                        {editError && (
                            <div className="p-3 bg-red-100 text-red-800 rounded mb-4 text-sm font-medium">
                                {editError}
                            </div>
                        )}
                        <form onSubmit={handleEditWindow} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="border p-2 rounded w-full bg-white text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
                                    className="border p-2 rounded w-full bg-white text-sm"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={editSaving}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSaving}
                                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
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
