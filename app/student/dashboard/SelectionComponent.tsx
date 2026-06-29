"use client";

import { useState, useEffect } from "react";
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
    categoryId,
    userBranch,
    isDeadlinePassed,
    startTime,
    endTime,
    windowState,
    isCseCsmRestrictionEnabled = false,
}: {
    subjects: Subject[];
    categoryId: string;
    userBranch: string | null;
    isDeadlinePassed: boolean;
    startTime?: Date | string | null;
    endTime?: Date | string | null;
    windowState?: "NONE" | "SCHEDULED" | "ACTIVE" | "CLOSED";
    isCseCsmRestrictionEnabled?: boolean;
}) {
    const [loading, setLoading] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isStarted, setIsStarted] = useState(true);
    const [confirmSubject, setConfirmSubject] = useState<Subject | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!startTime) {
            setIsStarted(true);
            return;
        }

        const start = new Date(startTime).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = start - now;

            if (diff <= 0) {
                setIsStarted(true);
                setTimeLeft(null);
                router.refresh();
            } else {
                setIsStarted(false);
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                const parts = [];
                if (days > 0) parts.push(`${days}d`);
                if (hours > 0 || days > 0) parts.push(`${hours}h`);
                if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
                parts.push(`${seconds}s`);

                setTimeLeft(parts.join(" "));
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startTime, router]);

    const handleSelectClick = (subject: Subject) => {
        if (isDeadlinePassed || (endTime && new Date() > new Date(endTime))) {
            alert("Selection window is closed.");
            return;
        }
        if (startTime && new Date() < new Date(startTime)) {
            alert("Selection has not opened yet.");
            return;
        }
        setConfirmSubject(subject);
    };

    const handleSelect = async (subjectId: string) => {
        if (isDeadlinePassed || (endTime && new Date() > new Date(endTime))) {
            alert("Selection window is closed.");
            return;
        }
        if (startTime && new Date() < new Date(startTime)) {
            alert("Selection has not opened yet.");
            return;
        }

        setLoading(subjectId);
        try {
            const res = await fetch("/api/select", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subjectId, categoryId }),
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

    // ── No window scheduled ──────────────────────────────────────────────
    if (!startTime || !endTime) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 font-semibold">Selection Not Scheduled</h3>
                <p className="mt-2 text-gray-700">The selection window for this category has not been scheduled yet.</p>
            </div>
        );
    }

    // ── Window closed ────────────────────────────────────────────────────
    if (isDeadlinePassed || (endTime && new Date() > new Date(endTime))) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-red-900 font-semibold">Selection Closed</h3>
                <p className="mt-2 text-red-700">The selection window for this category has closed.</p>
                {endTime && (
                    <p className="text-xs text-red-500 mt-1">Closed on: {new Date(endTime).toLocaleString()}</p>
                )}
            </div>
        );
    }

    // ── Window scheduled (not yet open) — show subject preview ───────────
    if (!isStarted && timeLeft && windowState === "SCHEDULED") {
        return (
            <div className="space-y-5">
                {/* Countdown banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-blue-900">Selection Opening Soon</h3>
                    <p className="mt-1 text-blue-700">
                        Opens in: <span className="font-mono font-bold text-xl">{timeLeft}</span>
                    </p>
                    {startTime && (
                        <p className="text-xs text-blue-500 mt-1">Scheduled for: {new Date(startTime).toLocaleString()}</p>
                    )}
                </div>

                {/* Read-only subject preview */}
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">
                        📋 Preview of available subjects — you can browse but cannot select until the window opens.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjects.map((subject) => {
                            const isOwnBranch = userBranch && subject.branch && userBranch === subject.branch;
                            const isFull = subject.currentCount >= subject.limit;
                            const isCseCsmRestricted = isCseCsmRestrictionEnabled && userBranch && subject.branch &&
                                ((userBranch === "CSE" && subject.branch === "CSM") || (userBranch === "CSM" && subject.branch === "CSE"));
                            return (
                                <div
                                    key={subject.id}
                                    className={`bg-white rounded-lg border border-gray-200 p-5 flex flex-col opacity-85 ${(isOwnBranch || isCseCsmRestricted) ? "opacity-50" : ""}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{subject.name}</h4>
                                            <p className="text-xs text-gray-500">{subject.code}</p>
                                            {subject.branch && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                                                    {subject.branch}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isFull ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                                            {subject.currentCount} / {subject.limit}
                                        </span>
                                    </div>
                                    {subject.description && (
                                        <p className="text-gray-500 text-sm mb-3 flex-grow">{subject.description}</p>
                                    )}
                                    {isOwnBranch && (
                                        <p className="text-xs text-red-500 mb-2 font-medium">Not available for {userBranch} students</p>
                                    )}
                                    {isCseCsmRestricted && (
                                        <p className="text-xs text-red-500 mb-2 font-medium">Restricted (CSE/CSM Cross-Branch rule active)</p>
                                    )}
                                    <div className="mt-auto bg-gray-100 text-gray-500 text-center py-2 px-4 rounded text-sm font-medium cursor-not-allowed">
                                        🔒 Opens when window starts
                                    </div>
                                </div>
                            );
                        })}
                        {subjects.length === 0 && (
                            <p className="text-gray-400 text-sm col-span-3">No subjects available in this category yet.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Window not yet open (fallback, no windowState prop) ──────────────
    if (!isStarted && timeLeft) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-blue-900 font-semibold">Selection Opening Soon</h3>
                <p className="mt-2 text-blue-700">
                    Subject selection will open in: <span className="font-mono font-bold text-lg">{timeLeft}</span>
                </p>
                {startTime && (
                    <p className="text-xs text-blue-500 mt-1">Scheduled for: {new Date(startTime).toLocaleString()}</p>
                )}
            </div>
        );
    }

    // ── Window ACTIVE — normal selection UI ──────────────────────────────
    return (
        <div className="space-y-4 relative">
            {loading !== null && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white/95 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-xs w-full mx-4 border border-gray-100">
                        <div className="relative mb-6 flex items-center justify-center w-24 h-24">
                            {/* Inner Logo */}
                            <img
                                src="https://gvpcdpgc.edu.in/gvplogo.jpg"
                                alt="GVP Logo"
                                className="w-16 h-16 object-contain animate-pulse"
                            />
                            {/* Outer Spinning Border */}
                            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-indigo-600 border-b-transparent border-l-transparent animate-spin"></div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Reserving Seat...</h3>
                        <p className="text-xs text-gray-500 mt-2 text-center leading-relaxed">
                            Processing your selection and locking your seat. Please do not refresh or close this page.
                        </p>
                    </div>
                </div>
            )}

            {endTime && (
                <div className="text-sm font-medium text-orange-600 bg-orange-50 border border-orange-100 px-4 py-2 rounded-lg inline-block">
                    Selection closes on: {new Date(endTime).toLocaleString()}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => {
                    const isFull = subject.currentCount >= subject.limit;
                    const isOwnBranch = userBranch && subject.branch && userBranch === subject.branch;
                    const isCseCsmRestricted = isCseCsmRestrictionEnabled && userBranch && subject.branch &&
                        ((userBranch === "CSE" && subject.branch === "CSM") || (userBranch === "CSM" && subject.branch === "CSE"));
                    const isDisabled = isFull || isOwnBranch || isCseCsmRestricted || isDeadlinePassed || loading !== null;

                    return (
                        <div key={subject.id} className={`bg-white rounded-lg shadow-md p-6 flex flex-col ${(isOwnBranch || isCseCsmRestricted) ? "opacity-75" : ""}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                                    <p className="text-sm text-gray-500">{subject.code}</p>
                                    {subject.branch && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">{subject.branch}</span>}
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isFull ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                                    {subject.currentCount} / {subject.limit}
                                </span>
                            </div>

                            {subject.description && (
                                <p className="text-gray-600 mb-4 flex-grow text-sm">{subject.description}</p>
                            )}

                            {isOwnBranch && (
                                <p className="text-xs text-red-500 mb-2 font-medium">Not available for {userBranch} students</p>
                            )}
                            {isCseCsmRestricted && (
                                <p className="text-xs text-red-500 mb-2 font-medium">Restricted (CSE/CSM Cross-Branch rule active)</p>
                            )}

                            <button
                                onClick={() => handleSelectClick(subject)}
                                disabled={!!isDisabled}
                                className={`w-full py-2 px-4 rounded font-medium transition-colors ${isDisabled
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                            >
                                {loading === subject.id ? "Selecting..." : isFull ? "Full" : isOwnBranch ? "Restricted" : isCseCsmRestricted ? "Restricted" : "Select"}
                            </button>
                        </div>
                    );
                })}
                {subjects.length === 0 && (
                    <div className="text-gray-500 text-sm col-span-3">No subjects available in this category.</div>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmSubject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-150 transform transition-all scale-100">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-2xl font-bold text-gray-900">Confirm Selection</h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm leading-relaxed">
                                You are selecting the following elective subject. This action is **final** and cannot be changed or reverted:
                            </p>

                            <div className="bg-gray-50 border border-gray-150 rounded-xl p-5">
                                <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold">Subject Name</span>
                                <span className="block text-lg font-bold text-gray-800 mt-1">{confirmSubject.name}</span>
                                <span className="block text-xs text-gray-500 mt-0.5">Code: {confirmSubject.code}</span>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setConfirmSubject(null)}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const subId = confirmSubject.id;
                                    setConfirmSubject(null);
                                    handleSelect(subId);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 transition-all"
                            >
                                Confirm & Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
