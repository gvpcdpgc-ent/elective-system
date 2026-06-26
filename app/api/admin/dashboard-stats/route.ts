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
        const [totalStudents, totalSubjects, totalSelections, categories] = await Promise.all([
            prisma.user.count({ where: { role: "STUDENT" } }),
            prisma.subject.count(),
            prisma.selection.count(),
            prisma.electiveCategory.findMany({
                where: { isActive: true },
                include: {
                    selectionWindow: true,
                    _count: { select: { selections: true } },
                },
                orderBy: [{ year: "asc" }, { semester: "asc" }],
            }),
        ]);

        const now = new Date();

        const categoryStats = await Promise.all(
            categories.map(async (cat) => {
                const totalStudentsInYear = await prisma.user.count({
                    where: { role: "STUDENT", year: cat.year },
                });

                let windowStatus: "NONE" | "SCHEDULED" | "ACTIVE" | "CLOSED" = "NONE";
                let startTime: string | null = null;
                let endTime: string | null = null;

                if (cat.selectionWindow) {
                    startTime = cat.selectionWindow.startTime.toISOString();
                    endTime = cat.selectionWindow.endTime.toISOString();
                    const start = cat.selectionWindow.startTime;
                    const end = cat.selectionWindow.endTime;
                    if (now < start) windowStatus = "SCHEDULED";
                    else if (now > end) windowStatus = "CLOSED";
                    else windowStatus = "ACTIVE";
                }

                return {
                    id: cat.id,
                    name: cat.name,
                    year: cat.year,
                    semester: cat.semester,
                    windowStatus,
                    startTime,
                    endTime,
                    totalStudentsInYear,
                    totalSelections: cat._count.selections,
                };
            })
        );

        return NextResponse.json({
            totalStudents,
            totalSubjects,
            totalSelections,
            categories: categoryStats,
        });
    } catch (error: any) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
