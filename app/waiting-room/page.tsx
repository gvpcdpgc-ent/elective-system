"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function WaitingRoomPage() {
    const router = useRouter();
    const [position, setPosition] = useState<number | null>(null);
    const [activeUsers, setActiveUsers] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const checkQueueAccess = async () => {
            try {
                const res = await fetch("/api/queue/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });
                if (res.status === 401) {
                    if (isMounted) router.push("/login");
                    return;
                }
                const data = await res.json();
                if (!isMounted) return;

                if (data.allowed) {
                    router.push("/student/dashboard");
                    return;
                }

                setPosition(data.position);
                setLoading(false);
                setError(null);
            } catch (err) {
                console.error("Queue status check error:", err);
                if (isMounted) setError("Connection issues. Retrying...");
            }
        };

        // Run check immediately on mount
        checkQueueAccess();

        // Poll status every 5 seconds
        const interval = setInterval(checkQueueAccess, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [router]);

    // Calculate estimated wait time: ~3 seconds per spot in the queue
    const getEstWaitTime = () => {
        if (position === null) return "Calculating...";
        const totalSeconds = position * 3;
        if (totalSeconds < 60) {
            return `${totalSeconds} seconds`;
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes} min ${seconds > 0 ? `${seconds}s` : ""}`;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-radial from-slate-900 to-slate-950 p-6 text-white font-sans selection:bg-indigo-500 selection:text-white">
            {/* Soft decorative background circles */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

            <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
                {/* Visual indicator loader */}
                <div className="flex justify-center mb-6 relative">
                    <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold tracking-wider text-indigo-400">
                            {position !== null ? `#${position}` : "..."}
                        </span>
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                    Virtual Waiting Room
                </h1>
                
                <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                    Subject selection limit reached. You are currently in the queue. Please keep this window open; you will enter automatically.
                </p>

                {error ? (
                    <div className="mt-6 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-300 text-xs">
                        {error}
                    </div>
                ) : (
                    <div className="mt-8 space-y-6">
                        {/* Queue Stats Card */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-955/50 border border-slate-800/80 rounded-xl p-4">
                                <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">Your Position</span>
                                <span className="block text-2xl font-bold text-indigo-400 mt-1">
                                    {loading ? "..." : position !== null ? position : "Processing"}
                                </span>
                            </div>
                            <div className="bg-slate-955/50 border border-slate-800/80 rounded-xl p-4">
                                <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">Est. Wait Time</span>
                                <span className="block text-sm font-semibold text-slate-200 mt-2 truncate">
                                    {loading ? "..." : getEstWaitTime()}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar Indicator */}
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full animate-pulse rounded-full" style={{ width: "100%" }}></div>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                        Live Queue Polling
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors"
                    >
                        Leave Queue & Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
