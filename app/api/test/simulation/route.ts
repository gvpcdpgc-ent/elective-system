import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This is a TEMPORARY endpoint for load testing only.
// It bypasses NextAuth session checks and accepts userId directly.
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, preferences } = body;

        if (!userId || !preferences) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // Transaction to ensure atomicity (Same logic as /api/select)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check if user already has a selection
            const existingSelection = await tx.selection.findUnique({
                where: { userId: userId },
            });

            if (existingSelection) {
                throw new Error("You have already selected a subject");
            }

            // 2. Get User Details
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");

            // 3. Store Preferences
            await tx.preference.deleteMany({ where: { userId: user.id } });
            await tx.preference.createMany({
                data: preferences.map((subjectId: string, index: number) => ({
                    userId: user.id,
                    subjectId,
                    rank: index + 1,
                })),
            });

            // 4. Cascading Allocation Logic
            let allocatedSubjectId = null;

            for (const subjectId of preferences) {
                const subject = await tx.subject.findUnique({
                    where: { id: subjectId },
                    include: { _count: { select: { selections: true } } },
                });

                if (!subject) continue;

                if (user.branch && subject.branch && user.branch === subject.branch) {
                    continue;
                }

                if (subject._count.selections < subject.limit) {
                    allocatedSubjectId = subjectId;
                    break;
                }
            }

            if (!allocatedSubjectId) {
                throw new Error("All preferences full");
            }

            // 5. Create Selection
            const selection = await tx.selection.create({
                data: {
                    userId: user.id,
                    subjectId: allocatedSubjectId,
                },
            });

            return selection;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Selection failed" }, { status: 400 });
    }
}
