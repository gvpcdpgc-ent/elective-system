"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError(res.error === "Student login is currently disabled" ? res.error : "Invalid credentials");
                setLoading(false);
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 relative">
            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white/95 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-xs w-full mx-4 border border-gray-100 transform scale-100 transition-transform">
                        <div className="relative mb-6 flex items-center justify-center w-24 h-24">
                            {/* Inner Logo */}
                            <img
                                src="https://gvpcdpgc.edu.in/gvplogo.jpg"
                                alt="GVP Logo"
                                className="w-16 h-16 object-contain animate-pulse"
                            />
                            {/* Outer Spinning Border */}
                            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-600 border-b-transparent border-l-transparent animate-spin"></div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Connecting...</h3>
                        <p className="text-xs text-gray-500 mt-2 text-center leading-relaxed">
                            Securing your connection and checking waiting room queue. Please wait...
                        </p>
                    </div>
                </div>
            )}

            {/* College Header */}
            <div className="text-center mb-8 max-w-5xl flex flex-col items-center">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
                    {/* Logo */}
                    <img
                        src="https://gvpcdpgc.edu.in/gvplogo.jpg"
                        alt="GVP Logo"
                        className="w-24 h-24 md:w-32 md:h-32 object-contain"
                    />

                    {/* Text */}
                    <div className="text-center md:text-left">
                        <h1 className="text-xl md:text-3xl font-bold text-[#002147] font-serif uppercase leading-tight mb-2">
                            GAYATRI VIDYA PARISHAD COLLEGE FOR DEGREE AND PG COURSES (AUTONOMOUS)
                        </h1>
                        <p className="text-sm md:text-lg font-bold text-[#b91d47] font-serif">
                            (Affiliated to Andhra University | Accredited by NAAC with 'A' Grade)
                        </p>
                        <p className="text-xs md:text-base font-bold text-[#b91d47] font-serif mt-1">
                            (MBA and UG Engineering B.Tech(CE,CSE,ECE and ME) programs are Accredited by NBA)
                        </p>
                        <p className="text-sm md:text-lg font-bold text-black font-serif mt-1">
                            Visakhapatnam - 530045.
                        </p>
                    </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mt-4 uppercase border-b-4 border-blue-800 inline-block pb-1">
                     OPEN ELECTIVE SELECTION
                 </h2>
            </div>

            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h1>
                {error && <p className="text-red-500 mb-4 text-center text-sm font-semibold">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
                                placeholder="DDMMYYYY"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">please enter the password in DDMMYYYY format without any " - or / or . "</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-red-600 font-bold text-center">
                        NOTE: If the password does not work, Interchange the Date(DD) and Month(MM) and try it.
                    </p>
                </div>
            </div>
        </div>
    );
}
