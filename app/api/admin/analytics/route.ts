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
    // We need to group selections by Subject -> Student Branch
    const selections = await prisma.selection.findMany({
        include: {
            user: {
                select: { branch: true }
            },
            subject: {
                select: { name: true }
            }
        }
    });

    // Process data for Stacked Bar Chart
    // Format: { subject: "Math", CSE: 10, MECH: 5, ECE: 2 }
    const branchMap: Record<string, Record<string, number>> = {};
    const allBranches = new Set<string>();

    selections.forEach(sel => {
        const subjectName = sel.subject.name;
        const branch = sel.user.branch || "Unknown";
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

    return NextResponse.json({
        subjectData,
        branchData,
        branches: Array.from(allBranches)
    });
}
