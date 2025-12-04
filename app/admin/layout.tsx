"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/admin/dashboard" },
        { name: "Subjects", href: "/admin/subjects" },
        { name: "Students", href: "/admin/students" },
        { name: "Analytics", href: "/admin/analytics" },
        { name: "Settings", href: "/admin/settings" },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                </div>
                <nav className="mt-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-6 py-3 text-gray-700 hover:bg-gray-100 ${pathname === item.href ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600" : ""
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full text-left px-6 py-3 text-red-600 hover:bg-red-50 mt-auto"
                    >
                        Sign Out
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
