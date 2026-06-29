"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { name: "Dashboard", href: "/admin/dashboard" },
        { name: "Categories", href: "/admin/categories" },
        { name: "Departments", href: "/admin/departments" },
        { name: "Subjects", href: "/admin/subjects" },
        { name: "Students", href: "/admin/students" },
        { name: "Analytics", href: "/admin/analytics" },
        { name: "Logs", href: "/admin/logs" },
        { name: "Settings", href: "/admin/settings" },
    ];

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            {/* Mobile Header Bar */}
            <header className="md:hidden flex items-center justify-between bg-white px-6 py-4 shadow-sm border-b z-40">
                <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-gray-600 hover:text-gray-900 focus:outline-none p-1"
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </header>

            {/* Sidebar Backdrop Overlay on Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`bg-white shadow-md z-50 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
                    fixed md:static inset-y-0 left-0 w-64 transform 
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} 
                    md:transform-none md:translate-x-0`}
            >
                <div className="p-6 border-b flex justify-between items-center md:block">
                    <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                    <button
                        className="md:hidden text-gray-500 hover:text-gray-800 focus:outline-none"
                        onClick={() => setIsOpen(false)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="mt-4 flex-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`block px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                                pathname === item.href ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600 font-semibold" : ""
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full text-left px-6 py-3 text-red-600 hover:bg-red-50 mt-4 border-t flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full min-w-0">
                {children}
            </main>
        </div>
    );
}
