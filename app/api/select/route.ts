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

        // 1. Fetch user (not in transaction)
        const user = await prisma.user.findUnique({ 
            where: { id: session.user.id },
            include: { department: true }
        });

        // 2. Check if user already has a selection for this category
        const existingSelection = await prisma.selection.findUnique({
            where: {
                userId_categoryId: {
                    userId: session.user.id,
                    categoryId: categoryId
                }
            },
        });

        if (existingSelection) {
            return NextResponse.json({ error: "You have already selected a subject for this category" }, { status: 400 });
        }

        // 3. Check selection window bounds
        const window = await prisma.selectionWindow.findUnique({
            where: { categoryId }
        });

        if (!window) {
            return NextResponse.json({ error: "No selection window has been scheduled for this category" }, { status: 400 });
        }

        const now = new Date();
        if (now < new Date(window.startTime)) {
            return NextResponse.json({ error: "Selection window has not opened yet" }, { status: 400 });
        }

        if (now > new Date(window.endTime)) {
            return NextResponse.json({ error: "Selection window has closed" }, { status: 400 });
        }

        // 4. Fetch subject and its current selection count
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                category: true,
                _count: {
                    select: { selections: true },
                },
            },
        });

        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 400 });
        }

        if (subject.categoryId !== categoryId) {
            return NextResponse.json({ error: "Subject does not belong to this category" }, { status: 400 });
        }

        // 5. Enforce Open Elective Rule (Cannot select own department)
        if (user?.departmentId && subject.departmentId && user.departmentId === subject.departmentId) {
            const deptName = user.department?.name || "your own department";
            return NextResponse.json({ error: `You cannot select a subject from ${deptName}` }, { status: 400 });
        }

        // 5.5 Enforce CSE / CSM Cross-Branch restriction if enabled in settings
        const settings = await prisma.settings.findFirst();
        if (settings?.isCseCsmRestrictionEnabled) {
            const userDeptCode = user?.department?.code;
            const subjectWithDept = await prisma.subject.findUnique({
                where: { id: subjectId },
                include: { department: true }
            });
            const subjectDeptCode = subjectWithDept?.department?.code;

            if (userDeptCode && subjectDeptCode) {
                const isUserCseOrCsm = userDeptCode === "CSE" || userDeptCode === "CSM";
                const isSubjectCseOrCsm = subjectDeptCode === "CSE" || subjectDeptCode === "CSM";

                if (isUserCseOrCsm && isSubjectCseOrCsm && userDeptCode !== subjectDeptCode) {
                    return NextResponse.json({ error: "CSE and CSM students are restricted from cross-selecting these subjects." }, { status: 400 });
                }
            }
        }

        // 6. Check seat limit
        if (subject._count.selections >= subject.limit) {
            return NextResponse.json({ error: "Subject is full" }, { status: 400 });
        }

        // 7. Create selection
        try {
            const selection = await prisma.selection.create({
                data: {
                    userId: session.user.id,
                    subjectId: subjectId,
                    categoryId: categoryId,
                },
            });

            // Release the user's active slot immediately since they have completed selection
            await leaveQueue(session.user.id);

            return NextResponse.json(selection);
        } catch (dbErr: any) {
            // Handle unique constraint if submitted concurrently
            if (dbErr.code === 'P2002') {
                return NextResponse.json({ error: "You have already selected a subject for this category" }, { status: 400 });
            }
            throw dbErr;
        }
    } catch (error: any) {
        console.error("Selection API error:", error);
        return NextResponse.json({ error: error.message || "Selection failed" }, { status: 400 });
    }
}
