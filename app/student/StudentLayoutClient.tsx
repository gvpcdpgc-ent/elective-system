"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function StudentLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // Send heartbeat/access check every 15 seconds to keep active session alive
        const interval = setInterval(async () => {
            try {
                const res = await fetch("/api/queue/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });
                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                const data = await res.json();
                if (!data.allowed) {
                    // Session expired or capacity changed, redirect to waiting room
                    window.location.href = "/waiting-room";
                }
            } catch (err) {
                console.error("Active session heartbeat failed:", err);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold text-gray-800">Student Portal</h1>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
