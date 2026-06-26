"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompletionItem {
    id: string;
    name: string;
    year: number;
    semester: number;
    windowStatus: "NONE" | "SCHEDULED" | "ACTIVE" | "CLOSED";
    totalStudentsInYear: number;
    selectedCount: number;
    percentage: number;
}

const STATUS_CONFIG = {
    ACTIVE:    { label: "Active",    bg: "bg-green-100",  text: "text-green-800" },
    SCHEDULED: { label: "Scheduled", bg: "bg-yellow-100", text: "text-yellow-800" },
    CLOSED:    { label: "Closed",    bg: "bg-red-100",    text: "text-red-800" },
    NONE:      { label: "No Window", bg: "bg-gray-100",   text: "text-gray-500" },
};

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<{
        subjectData: any[];
        branchData: any[];
        branches: string[];
        completionData: CompletionItem[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching analytics:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="flex items-center gap-3 text-gray-500 mt-16 justify-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading analytics...</span>
        </div>
    );
    if (!data) return <div className="text-red-500">Error loading data</div>;

    return (
        <div className="space-y-10">
            <h2 className="text-3xl font-bold">Analytics Dashboard</h2>

            {/* Completion Rate Section */}
            {data.completionData && data.completionData.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold mb-1">Selection Completion Rate</h3>
                    <p className="text-sm text-gray-500 mb-6">How many students in each year have completed their selection.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {data.completionData.map((item) => {
                            const cfg = STATUS_CONFIG[item.windowStatus];
                            return (
                                <div key={item.id} className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.year} Year · Sem {item.semester}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                                            {cfg.label}
                                        </span>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-700 ${
                                                item.percentage >= 80 ? "bg-green-500" :
                                                item.percentage >= 50 ? "bg-blue-500" : "bg-orange-400"
                                            }`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600">
                                            <span className="font-bold text-gray-900">{item.selectedCount}</span> / {item.totalStudentsInYear} students selected
                                        </span>
                                        <span className={`font-bold text-base ${
                                            item.percentage >= 80 ? "text-green-600" :
                                            item.percentage >= 50 ? "text-blue-600" : "text-orange-500"
                                        }`}>{item.percentage}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Subject Popularity Chart */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold mb-6">Subject Popularity</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.subjectData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="code" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#3b82f6" name="Selections" />
                                <Bar dataKey="limit" fill="#e5e7eb" name="Total Seats" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Branch Distribution Chart */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold mb-6">Branch Distribution</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.branchData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="subject" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {data.branches?.map((branch: string, index: number) => (
                                    <Bar key={branch} dataKey={branch} stackId="a" fill={`hsl(${index * 60}, 70%, 50%)`} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
