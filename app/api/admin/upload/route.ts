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
        const { students } = body; // Expecting array of { username, password, branch, year } (branch acts as department code)

        if (!Array.isArray(students)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        // Fetch all departments to map code to id
        const departments = await prisma.department.findMany();
        const deptMap = new Map(departments.map(d => [d.code.toUpperCase(), d.id]));

        const hashedStudents = [];
        for (const s of students) {
            const deptCode = (s.branch || "").trim().toUpperCase();
            const departmentId = deptMap.get(deptCode);

            if (!departmentId) {
                return NextResponse.json({ error: `Department code "${deptCode}" not found in database.` }, { status: 400 });
            }

            hashedStudents.push({
                username: s.username,
                password: await bcrypt.hash(s.password, 10),
                departmentId,
                year: s.year ? parseInt(s.year) : null,
                role: "STUDENT",
            });
        }

        await prisma.$transaction(
            hashedStudents.map((student) =>
                prisma.user.create({
                    data: student,
                })
            )
        );

        return NextResponse.json({ message: "Students uploaded successfully", count: students.length });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Failed to upload students. Usernames must be unique." }, { status: 500 });
    }
}
