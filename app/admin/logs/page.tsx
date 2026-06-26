"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ----- Types -----
interface SelectionLog {
    id: string;
    createdAt: string;
    user: { username: string; year: number | null; department: { code: string } | null };
    subject: { name: string; code: string };
    category: { name: string };
}

interface AuthLog {
    id: string;
    username: string;
    event: "SUCCESS" | "WRONG_PASSWORD" | "USER_NOT_FOUND" | "LOGIN_DISABLED";
    role: string | null;
    createdAt: string;
}

// ----- Helpers -----
function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const AUTH_EVENT_CONFIG: Record<string, { icon: string; label: string; rowClass: string; badgeClass: string }> = {
    SUCCESS:       { icon: "✅", label: "Login Success",   rowClass: "bg-green-50",   badgeClass: "bg-green-100 text-green-800" },
    WRONG_PASSWORD:{ icon: "❌", label: "Wrong Password",  rowClass: "bg-red-50",     badgeClass: "bg-red-100 text-red-800" },
    USER_NOT_FOUND:{ icon: "🔍", label: "User Not Found",  rowClass: "bg-orange-50",  badgeClass: "bg-orange-100 text-orange-800" },
    LOGIN_DISABLED:{ icon: "🚫", label: "Login Disabled",  rowClass: "bg-yellow-50",  badgeClass: "bg-yellow-100 text-yellow-800" },
};

// ----- Selection Log Tab -----
function SelectionLogTab() {
    const [logs, setLogs] = useState<SelectionLog[]>([]);
    const [paused, setPaused] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [newCount, setNewCount] = useState(0);
    const prevIdsRef = useRef<Set<string>>(new Set());

    const fetchLogs = useCallback(async () => {
        if (paused) return;
        try {
            const res = await fetch("/api/admin/logs/selections");
            if (res.ok) {
                const data: SelectionLog[] = await res.json();
                setLogs(data);
                setLastUpdated(new Date());
                const newEntries = data.filter(l => !prevIdsRef.current.has(l.id));
                if (prevIdsRef.current.size > 0 && newEntries.length > 0) {
                    setNewCount(c => c + newEntries.length);
                }
                prevIdsRef.current = new Set(data.map(l => l.id));
            }
        } catch (err) { /* ignore */ }
    }, [paused]);

    useEffect(() => {
        fetchLogs();
        const id = setInterval(fetchLogs, 3000);
        return () => clearInterval(id);
    }, [fetchLogs]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${paused ? "bg-gray-400" : "bg-green-500 animate-pulse"}`} />
                    <span className="text-sm font-medium text-gray-600">
                        {paused ? "Paused" : "Live — refreshing every 3s"}
                    </span>
                    {newCount > 0 && !paused && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            +{newCount} new
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-xs text-gray-400">Updated: {lastUpdated.toLocaleTimeString()}</span>
                    )}
                    <button
                        onClick={() => { setPaused(p => !p); setNewCount(0); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            paused ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        {paused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                </div>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="font-medium">No selections yet.</p>
                    <p className="text-sm mt-1">Selection events will appear here as students confirm their choices.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject Selected</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-green-50 transition-colors">
                                    <td className="px-5 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                                        {formatDateTime(log.createdAt)}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className="font-semibold text-sm text-gray-900">{log.user.username}</span>
                                        <span className="ml-2 text-xs text-gray-400">
                                            {log.user.department?.code || "?"} · Year {log.user.year || "?"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                                        {log.category.name}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className="font-semibold text-green-700 text-sm">{log.subject.name}</span>
                                        <span className="ml-1.5 text-xs text-gray-400">({log.subject.code})</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ----- Auth Log Tab -----
function AuthLogTab() {
    const [logs, setLogs] = useState<AuthLog[]>([]);
    const [paused, setPaused] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [filter, setFilter] = useState<string>("ALL");

    const fetchLogs = useCallback(async () => {
        if (paused) return;
        try {
            const res = await fetch("/api/admin/logs/auth");
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
                setLastUpdated(new Date());
            }
        } catch (err) { /* ignore */ }
    }, [paused]);

    useEffect(() => {
        fetchLogs();
        const id = setInterval(fetchLogs, 5000);
        return () => clearInterval(id);
    }, [fetchLogs]);

    const filteredLogs = filter === "ALL" ? logs : logs.filter(l => l.event === filter);

    const counts = {
        ALL: logs.length,
        SUCCESS: logs.filter(l => l.event === "SUCCESS").length,
        WRONG_PASSWORD: logs.filter(l => l.event === "WRONG_PASSWORD").length,
        USER_NOT_FOUND: logs.filter(l => l.event === "USER_NOT_FOUND").length,
        LOGIN_DISABLED: logs.filter(l => l.event === "LOGIN_DISABLED").length,
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${paused ? "bg-gray-400" : "bg-green-500 animate-pulse"}`} />
                    <span className="text-sm font-medium text-gray-600">
                        {paused ? "Paused" : "Live — refreshing every 5s"}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {(["ALL", "SUCCESS", "WRONG_PASSWORD", "USER_NOT_FOUND", "LOGIN_DISABLED"] as const).map((key) => {
                        const cfg = key === "ALL"
                            ? { icon: "📋", label: "All", badgeClass: "bg-gray-100 text-gray-700" }
                            : AUTH_EVENT_CONFIG[key];
                        return (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                                    filter === key ? "ring-2 ring-blue-400 border-blue-400" : "border-gray-200"
                                } ${cfg.badgeClass}`}
                            >
                                {cfg.icon} {cfg.label} ({counts[key]})
                            </button>
                        );
                    })}
                    {lastUpdated && (
                        <span className="text-xs text-gray-400 ml-2">Updated: {lastUpdated.toLocaleTimeString()}</span>
                    )}
                    <button
                        onClick={() => setPaused(p => !p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            paused ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        {paused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                </div>
            </div>

            {filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">🔐</p>
                    <p className="font-medium">No auth events yet.</p>
                    <p className="text-sm mt-1">Login attempts will appear here in real time.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Event</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredLogs.map((log) => {
                                const cfg = AUTH_EVENT_CONFIG[log.event] || AUTH_EVENT_CONFIG.USER_NOT_FOUND;
                                return (
                                    <tr key={log.id} className={`transition-colors ${cfg.rowClass}`}>
                                        <td className="px-5 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                                            {formatDateTime(log.createdAt)}
                                        </td>
                                        <td className="px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                                            {log.username}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeClass}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-500">
                                            {log.role || <span className="italic text-gray-300">—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ----- Main Page -----
export default function AdminLogsPage() {
    const [activeTab, setActiveTab] = useState<"selections" | "auth">("selections");

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">System Logs</h2>
                <p className="text-gray-500 mt-1 text-sm">Live feed of student selections and login attempts.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {(["selections", "auth"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === tab
                                ? "bg-white text-blue-700 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        {tab === "selections" ? "📋 Selection Log" : "🔐 Auth / Login Log"}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {activeTab === "selections" ? <SelectionLogTab /> : <AuthLogTab />}
            </div>
        </div>
    );
}
