"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Subject {
    id: string;
    name: string;
    code: string;
    limit: number;
    description: string | null;
    currentCount: number;
    branch?: string | null;
}

export default function SelectionComponent({
    subjects,
    userBranch,
    isDeadlinePassed
}: {
    subjects: Subject[];
    userBranch: string | null;
    isDeadlinePassed: boolean;
}) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const handleSelect = async (subjectId: string) => {
        if (isDeadlinePassed) {
            alert("Selection deadline has passed.");
            return;
        }

        // Confirmation dialog removed as per user request
        // if (!confirm("Are you sure?")) return;

        setLoading(subjectId);
        try {
            const res = await fetch("/api/select", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subjectId }),
            });

            const data = await res.json();

            if (res.ok) {
                router.refresh();
            } else {
                alert(data.error || "Selection failed");
            }
        } catch (error) {
            console.error("Selection error:", error);
            alert("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    if (isDeadlinePassed) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-red-900">Selection Closed</h3>
                <p className="mt-2 text-red-700">The deadline for subject selection has passed.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
                const isFull = subject.currentCount >= subject.limit;
                const isOwnBranch = userBranch && subject.branch && userBranch === subject.branch;
                const isDisabled = isFull || isOwnBranch || isDeadlinePassed || loading !== null;

                return (
                    <div key={subject.id} className={`bg-white rounded-lg shadow-md p-6 flex flex-col ${isOwnBranch ? "opacity-75" : ""}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                                <p className="text-sm text-gray-500">{subject.code}</p>
                                {subject.branch && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">{subject.branch}</span>}
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isFull ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                                }`}>
                                {subject.currentCount} / {subject.limit}
                            </span>
                        </div>

                        {subject.description && (
                            <p className="text-gray-600 mb-4 flex-grow">{subject.description}</p>
                        )}

                        {isOwnBranch && (
                            <p className="text-xs text-red-500 mb-2">Not available for {userBranch} students</p>
                        )}

                        <button
                            onClick={() => handleSelect(subject.id)}
                            disabled={isDisabled}
                            className={`w-full py-2 px-4 rounded font-medium transition-colors ${isDisabled
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                        >
                            {loading === subject.id ? "Selecting..." : isFull ? "Full" : isOwnBranch ? "Restricted" : "Select"}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
