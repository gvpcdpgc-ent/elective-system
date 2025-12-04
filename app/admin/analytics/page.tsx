"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<{ subjectData: any[], branchData: any[], branches: string[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading analytics...</div>;
    if (!data) return <div>Error loading data</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">Analytics Dashboard</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Subject Popularity Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
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
                <div className="bg-white p-6 rounded-lg shadow-md">
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
