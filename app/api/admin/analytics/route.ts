import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Subject Popularity (Total Selections per Subject)
    const subjects = await prisma.subject.findMany({
        include: {
            _count: {
                select: { selections: true },
            },
        },
    });

    const subjectData = subjects.map(s => ({
        name: s.name,
        code: s.code,
        count: s._count.selections,
        limit: s.limit
    }));

    // 2. Branch Distribution (Which branch students selected which subject)
    const selections = await prisma.selection.findMany({
        include: {
            user: {
                select: {
                    department: {
                        select: { code: true }
                    }
                }
            },
            subject: {
                select: { name: true }
            }
        }
    });

    // Process data for Stacked Bar Chart
    const branchMap: Record<string, Record<string, number>> = {};
    const allBranches = new Set<string>();

    selections.forEach(sel => {
        const subjectName = sel.subject.name;
        const branch = sel.user.department?.code || "Unknown";
        allBranches.add(branch);

        if (!branchMap[subjectName]) {
            branchMap[subjectName] = {};
        }
        branchMap[subjectName][branch] = (branchMap[subjectName][branch] || 0) + 1;
    });

    const branchData = Object.keys(branchMap).map(subject => ({
        subject,
        ...branchMap[subject]
    }));

    // 3. Completion Rate per Category
    const now = new Date();
    const categories = await prisma.electiveCategory.findMany({
        where: { isActive: true },
        include: {
            selectionWindow: true,
            _count: { select: { selections: true } },
        },
        orderBy: [{ year: "asc" }, { semester: "asc" }],
    });

    const completionData = await Promise.all(
        categories.map(async (cat) => {
            const totalStudentsInYear = await prisma.user.count({
                where: { role: "STUDENT", year: cat.year },
            });

            let windowStatus: "NONE" | "SCHEDULED" | "ACTIVE" | "CLOSED" = "NONE";
            if (cat.selectionWindow) {
                const start = cat.selectionWindow.startTime;
                const end = cat.selectionWindow.endTime;
                if (now < start) windowStatus = "SCHEDULED";
                else if (now > end) windowStatus = "CLOSED";
                else windowStatus = "ACTIVE";
            }

            const selectedCount = cat._count.selections;
            const percentage =
                totalStudentsInYear > 0
                    ? Math.round((selectedCount / totalStudentsInYear) * 100)
                    : 0;

            return {
                id: cat.id,
                name: cat.name,
                year: cat.year,
                semester: cat.semester,
                windowStatus,
                totalStudentsInYear,
                selectedCount,
                percentage,
            };
        })
    );

    return NextResponse.json({
        subjectData,
        branchData,
        branches: Array.from(allBranches),
        completionData,
    });
}
