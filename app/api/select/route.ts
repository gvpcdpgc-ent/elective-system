import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { checkAccess, leaveQueue } from "@/lib/queueService";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce Virtual Waiting Room Concurrency Check
    const access = await checkAccess(session.user.id);
    if (!access.allowed) {
        return NextResponse.json({ error: "Waiting queue is active. You must wait in the waiting room." }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { subjectId, categoryId } = body;

        if (!subjectId || !categoryId) {
            return NextResponse.json({ error: "Subject ID and Category ID required" }, { status: 400 });
        }

        // Transaction to ensure atomicity and handle concurrency safely
        const result = await prisma.$transaction(async (tx) => {
            
            // 1. Pessimistic Row Locking (FOR UPDATE)
            // This locks the subject row in PostgreSQL. Any other concurrent transaction
            // trying to read/write this subject will wait, ensuring no double-bookings occur.
            await tx.$executeRaw`SELECT * FROM "Subject" WHERE id = ${subjectId} FOR UPDATE`;

            // 2. Check if user already has a selection for this category
            const existingSelection = await tx.selection.findUnique({
                where: {
                    userId_categoryId: {
                        userId: session.user.id,
                        categoryId: categoryId
                    }
                },
            });

            if (existingSelection) {
                throw new Error("You have already selected a subject for this category");
            }

            // 3. Check selection window bounds
            const window = await tx.selectionWindow.findUnique({
                where: { categoryId }
            });

            if (!window) {
                throw new Error("No selection window has been scheduled for this category");
            }

            const now = new Date();
            if (now < new Date(window.startTime)) {
                throw new Error("Selection window has not opened yet");
            }

            if (now > new Date(window.endTime)) {
                throw new Error("Selection window has closed");
            }

            // 4. Fetch subject and its current selection count
            const subject = await tx.subject.findUnique({
                where: { id: subjectId },
                include: {
                    category: true,
                    _count: {
                        select: { selections: true },
                    },
                },
            });

            if (!subject) {
                throw new Error("Subject not found");
            }

            if (subject.categoryId !== categoryId) {
                throw new Error("Subject does not belong to this category");
            }

            // 5. Enforce Open Elective Rule (Cannot select own department)
            const user = await tx.user.findUnique({ 
                where: { id: session.user.id },
                include: { department: true }
            });
            if (user?.departmentId && subject.departmentId && user.departmentId === subject.departmentId) {
                const deptName = user.department?.name || "your own department";
                throw new Error(`You cannot select a subject from ${deptName}`);
            }

            // 6. Check seat limit
            if (subject._count.selections >= subject.limit) {
                throw new Error("Subject is full");
            }

            // 7. Create selection
            const selection = await tx.selection.create({
                data: {
                    userId: session.user.id,
                    subjectId: subjectId,
                    categoryId: categoryId,
                },
            });

            return selection;
        });

        // Release the user's active slot immediately since they have completed selection
        await leaveQueue(session.user.id);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Selection transaction error:", error);
        return NextResponse.json({ error: error.message || "Selection failed" }, { status: 400 });
    }
}
