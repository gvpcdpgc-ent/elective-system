import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const students = await prisma.user.findMany({
            where: { role: "STUDENT" },
            select: {
                id: true,
                username: true,
                departmentId: true,
                department: {
                    select: { name: true, code: true }
                },
                year: true,
                selections: {
                    include: {
                        subject: true,
                        category: true,
                    },
                },
                // We cannot return the password as it is hashed
            },
            orderBy: { username: "asc" },
        });

        return NextResponse.json(students);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        if (id === "all") {
            await prisma.$transaction([
                prisma.activeUser.deleteMany(),
                prisma.waitingQueue.deleteMany(),
                prisma.user.deleteMany({
                    where: { role: "STUDENT" },
                })
            ]);
            return NextResponse.json({ message: "All students deleted" });
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Student deleted" });
    } catch (error) {
        console.error("Delete student API error:", error);
        return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
    }
}
