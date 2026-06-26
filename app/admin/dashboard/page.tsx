"use client";

import { useState, useEffect, useCallback } from "react";

interface CategoryStat {
    id: string;
    name: string;
    year: number;
    semester: number;
    windowStatus: "NONE" | "SCHEDULED" | "ACTIVE" | "CLOSED";
    startTime: string | null;
    endTime: string | null;
    totalStudentsInYear: number;
    totalSelections: number;
}

interface DashboardStats {
    totalStudents: number;
    totalSubjects: number;
    totalSelections: number;
    categories: CategoryStat[];
}

function useCountdown(targetTime: string | null): string | null {
    const [display, setDisplay] = useState<string | null>(null);

    useEffect(() => {
        if (!targetTime) { setDisplay(null); return; }
        const update = () => {
            const diff = new Date(targetTime).getTime() - Date.now();
            if (diff <= 0) { setDisplay("00:00:00"); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setDisplay(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [targetTime]);

    return display;
}

function CategoryCard({ cat }: { cat: CategoryStat }) {
    const countdownTarget =
        cat.windowStatus === "SCHEDULED" ? cat.startTime :
        cat.windowStatus === "ACTIVE" ? cat.endTime : null;
    const countdown = useCountdown(countdownTarget);
    const pct = cat.totalStudentsInYear > 0
        ? Math.round((cat.totalSelections / cat.totalStudentsInYear) * 100)
        : 0;

    const statusConfig = {
        ACTIVE:    { label: "Active",     bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500",  border: "border-green-200" },
        SCHEDULED: { label: "Scheduled",  bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500", border: "border-yellow-200" },
        CLOSED:    { label: "Closed",     bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-400",    border: "border-red-200" },
        NONE:      { label: "No Window",  bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400",   border: "border-gray-200" },
    }[cat.windowStatus];

    return (
        <div className={`bg-white border ${statusConfig.border} rounded-xl p-5 shadow-sm`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-bold text-gray-900 text-sm">{cat.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.year} Year · Sem {cat.semester}</p>
                </div>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${cat.windowStatus === "ACTIVE" ? "animate-pulse" : ""}`} />
                    {statusConfig.label}
                </span>
            </div>

            {/* Completion bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{cat.totalSelections} selected</span>
                    <span>{cat.totalStudentsInYear} students in year</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                            pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-blue-500" : "bg-orange-400"
                        }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className="text-right text-xs font-semibold mt-1 text-gray-700">{pct}%</p>
            </div>

            {/* Countdown */}
            {countdown && (
                <div className={`text-xs font-mono font-medium rounded-lg px-3 py-1.5 text-center ${
                    cat.windowStatus === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                }`}>
                    {cat.windowStatus === "ACTIVE" ? "⏱ Closes in: " : "🕒 Opens in: "}
                    <span className="font-bold">{countdown}</span>
                </div>
            )}
            {cat.windowStatus === "CLOSED" && (
                <p className="text-xs text-gray-400 text-center mt-1">
                    Closed · {cat.endTime ? new Date(cat.endTime).toLocaleString() : ""}
                </p>
            )}
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/dashboard-stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error("Dashboard stats fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const id = setInterval(fetchStats, 10000); // refresh every 10s
        return () => clearInterval(id);
    }, [fetchStats]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading dashboard...</span>
                </div>
            </div>
        );
    }

    if (!stats) return <div className="text-red-500">Failed to load dashboard stats.</div>;

    const summaryCards = [
        { label: "Total Students", value: stats.totalStudents, icon: "👨‍🎓", color: "bg-blue-50 border-blue-200 text-blue-700" },
        { label: "Total Subjects", value: stats.totalSubjects, icon: "📚", color: "bg-purple-50 border-purple-200 text-purple-700" },
        { label: "Total Selections", value: stats.totalSelections, icon: "✅", color: "bg-green-50 border-green-200 text-green-700" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
                {lastUpdated && (
                    <p className="text-xs text-gray-400">
                        Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 10s
                    </p>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summaryCards.map((card) => (
                    <div key={card.label} className={`border rounded-xl p-6 flex items-center gap-4 ${card.color}`}>
                        <span className="text-3xl">{card.icon}</span>
                        <div>
                            <p className="text-sm font-medium opacity-80">{card.label}</p>
                            <p className="text-4xl font-bold">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Per-Category Status Cards */}
            {stats.categories.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Elective Category Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {stats.categories.map((cat) => (
                            <CategoryCard key={cat.id} cat={cat} />
                        ))}
                    </div>
                </div>
            )}

            {stats.categories.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                    <p className="text-2xl mb-2">📋</p>
                    <p className="font-medium">No active elective categories found.</p>
                    <p className="text-sm mt-1">Create categories from the Categories page to see them here.</p>
                </div>
            )}
        </div>
    );
}
