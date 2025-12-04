"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({ isStudentLoginEnabled: true, deadline: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                setSettings({
                    isStudentLoginEnabled: data.isStudentLoginEnabled ?? true,
                    deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : "",
                });
            });
    }, []);

    const handleSave = async () => {
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

    const handleExport = async () => {
        window.open("/api/admin/export", "_blank");
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">System Settings</h2>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-semibold mb-6">General Settings</h3>

                <div className="mb-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.isStudentLoginEnabled ?? false}
                            onChange={(e) => setSettings({ ...settings, isStudentLoginEnabled: e.target.checked })}
                            className="h-5 w-5 text-blue-600"
                        />
                        <span className="text-gray-700 font-medium">Enable Student Login</span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1 ml-8">
                        If unchecked, students will not be able to log in to the portal.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selection Deadline</label>
                    <input
                        type="datetime-local"
                        value={settings.deadline}
                        onChange={(e) => setSettings({ ...settings, deadline: e.target.value })}
                        className="border p-2 rounded w-full max-w-md"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Students cannot select subjects after this time.
                    </p>
                </div>

                {message && (
                    <p className={`mb-4 ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
                        {message}
                    </p>
                )}

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
                >
                    {loading ? "Saving..." : "Save Settings"}
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Data Management</h3>
                <p className="text-gray-600 mb-4">Download a CSV file of all student selections.</p>
                <button
                    onClick={handleExport}
                    className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700"
                >
                    Export Selections to CSV
                </button>
            </div>
        </div>
    );
}
