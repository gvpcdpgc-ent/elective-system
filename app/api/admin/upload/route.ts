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
        const { students } = body; // Expecting array of { username, password, branch }

        if (!Array.isArray(students)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        const createdStudents = [];

        // Process in chunks or one by one. For simplicity, one by one but in parallel could be faster.
        // Using transaction might be too heavy if list is huge, but for reasonable size it's fine.
        // Let's do it in a transaction to ensure all or nothing, or just loop.
        // Loop is safer for partial failures if we want to report them, but "all or nothing" is usually better for bulk upload.

        const hashedStudents = await Promise.all(
            students.map(async (s) => ({
                username: s.username,
                password: await bcrypt.hash(s.password, 10),
                branch: s.branch,
                year: s.year ? parseInt(s.year) : null,
                role: "STUDENT",
            }))
        );

        await prisma.$transaction(
            hashedStudents.map((student) =>
                prisma.user.create({
                    data: student,
                })
            )
        );

        return NextResponse.json({ message: "Students uploaded successfully", count: students.length });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to upload students. Usernames must be unique." }, { status: 500 });
    }
}
