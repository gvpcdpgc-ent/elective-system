import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, subjectId, categoryId } = body;

        if (!userId || !subjectId || !categoryId) {
            return NextResponse.json({ error: "userId, subjectId, and categoryId are required" }, { status: 400 });
        }

        // Check if user exists and is a student
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== "STUDENT") {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // Check if subject exists and belongs to category
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }
        if (subject.categoryId !== categoryId) {
            return NextResponse.json({ error: "Subject does not belong to this category" }, { status: 400 });
        }

        // Check for existing selection — block if already selected
        const existing = await prisma.selection.findUnique({
            where: { userId_categoryId: { userId, categoryId } },
        });
        if (existing) {
            return NextResponse.json(
                { error: "Student already has a selection for this category. Reset their selection first." },
                { status: 409 }
            );
        }

        // Create the selection (admin override — no window/seat limit checks)
        const selection = await prisma.selection.create({
            data: { userId, subjectId, categoryId },
            include: { subject: true, category: true },
        });

        return NextResponse.json(selection);
    } catch (error: any) {
        console.error("Admin assign error:", error);
        return NextResponse.json({ error: error.message || "Assignment failed" }, { status: 500 });
    }
}
