import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This is a TEMPORARY endpoint for load testing only.
// It bypasses NextAuth session checks and accepts userId directly.
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, preferences, categoryId } = body;

        if (!userId || !preferences) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Category Details
            let targetCategoryId = categoryId;
            if (!targetCategoryId) {
                const firstCategory = await tx.electiveCategory.findFirst();
                if (!firstCategory) throw new Error("No elective categories found");
                targetCategoryId = firstCategory.id;
            }

            // 2. Check if user already has a selection for this category
            const existingSelection = await tx.selection.findUnique({
                where: {
                    userId_categoryId: {
                        userId: userId,
                        categoryId: targetCategoryId
                    }
                },
            });

            if (existingSelection) {
                throw new Error("You have already selected a subject for this category");
            }

            // 3. Get User Details
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");

            // 4. Store Preferences
            await tx.preference.deleteMany({
                where: { userId: user.id, categoryId: targetCategoryId }
            });
            await tx.preference.createMany({
                data: preferences.map((subjectId: string, index: number) => ({
                    userId: user.id,
                    subjectId,
                    categoryId: targetCategoryId,
                    rank: index + 1,
                })),
            });

            // 5. Cascading Allocation Logic
            let allocatedSubjectId = null;

            for (const subjectId of preferences) {
                const subject = await tx.subject.findUnique({
                    where: { id: subjectId },
                    include: { _count: { select: { selections: true } } },
                });

                if (!subject) continue;

                if (subject.categoryId !== targetCategoryId) {
                    continue;
                }

                // Enforce open elective rule using departmentId
                if (user.departmentId && subject.departmentId && user.departmentId === subject.departmentId) {
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

            // 6. Create Selection
            const selection = await tx.selection.create({
                data: {
                    userId: user.id,
                    subjectId: allocatedSubjectId,
                    categoryId: targetCategoryId,
                },
            });

            return selection;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Selection failed" }, { status: 400 });
    }
}
