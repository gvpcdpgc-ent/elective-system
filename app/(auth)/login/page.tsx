"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid credentials");
        } else {
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
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
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            placeholder="DDMMYYYY"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">please enter the password in DDMMYYYY format without any " - or / or . "</p>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                        Sign In
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
