import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { subjectId } = body;

        if (!subjectId) {
            return NextResponse.json({ error: "Subject ID required" }, { status: 400 });
        }

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check if user already has a selection
            const existingSelection = await tx.selection.findUnique({
                where: { userId: session.user.id },
            });

            if (existingSelection) {
                throw new Error("You have already selected a subject");
            }

            // 2. Check global settings (Deadline)
            const settings = await tx.settings.findFirst();
            if (settings?.deadline && new Date() > settings.deadline) {
                throw new Error("Selection deadline has passed");
            }

            // 3. Check subject availability
            const subject = await tx.subject.findUnique({
                where: { id: subjectId },
                include: {
                    _count: {
                        select: { selections: true },
                    },
                },
            });

            if (!subject) {
                throw new Error("Subject not found");
            }

            // 4. Enforce Open Elective Rule (Cannot select own branch)
            const user = await tx.user.findUnique({ where: { id: session.user.id } });
            if (user?.branch && subject.branch && user.branch === subject.branch) {
                throw new Error(`You cannot select a subject from your own branch (${user.branch})`);
            }

            if (subject._count.selections >= subject.limit) {
                throw new Error("Subject is full");
            }

            // 5. Create selection
            const selection = await tx.selection.create({
                data: {
                    userId: session.user.id,
                    subjectId: subjectId,
                },
            });

            return selection;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Selection failed" }, { status: 400 });
    }
}
