import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { students } = body;

        if (!Array.isArray(students) || students.length === 0) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        if (students.length > 1000) {
            return NextResponse.json({ error: "Maximum 1000 students per upload." }, { status: 400 });
        }

        // Fetch all departments once
        const departments = await prisma.department.findMany();
        const deptMap = new Map(departments.map(d => [d.code.toUpperCase(), d.id]));

        // Validate all rows first (fail fast before hashing)
        for (const s of students) {
            const deptCode = (s.branch || "").trim().toUpperCase();
            if (!deptMap.has(deptCode)) {
                return NextResponse.json(
                    { error: `Department code "${deptCode}" not found. Add it in Admin → Departments first.` },
                    { status: 400 }
                );
            }
        }

        // Hash all passwords in parallel using bcrypt cost factor 8
        // (cost 8 is still secure but ~4x faster than cost 10 — ideal for bulk ops)
        const hashedStudents = await Promise.all(
            students.map(async (s) => {
                const deptCode = (s.branch || "").trim().toUpperCase();
                return {
                    username: (s.username || "").trim(),
                    password: await bcrypt.hash(String(s.password), 8),
                    departmentId: deptMap.get(deptCode)!,
                    year: s.year ? parseInt(s.year) : null,
                    role: "STUDENT" as const,
                };
            })
        );

        // Single bulk insert — vastly faster than N individual creates
        const result = await prisma.user.createMany({
            data: hashedStudents,
            skipDuplicates: true, // skip existing usernames instead of crashing
        });

        return NextResponse.json({
            message: "Students uploaded successfully",
            count: result.count,
            skipped: students.length - result.count,
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed. Check usernames are unique." },
            { status: 500 }
        );
    }
}
