import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";

    try {
        const selections = await prisma.selection.findMany({
            include: {
                user: {
                    include: { department: true }
                },
                subject: {
                    include: { department: true }
                },
                category: true,
            },
        });

        let csvRows: string[][] = [];
        let filename = "selections.csv";

        if (type === "department") {
            // Sort by student department, then username
            selections.sort((a, b) => {
                const deptA = a.user.department?.code || "";
                const deptB = b.user.department?.code || "";
                if (deptA !== deptB) return deptA.localeCompare(deptB);
                return a.user.username.localeCompare(b.user.username);
            });

            filename = "department_wise_selections.csv";
            csvRows = [
                ["Student Department", "Student ID", "Student Username", "Year", "Elective Category", "Subject Code", "Subject Name", "Selected At"],
                ...selections.map((s: any) => [
                    s.user.department?.code || "N/A",
                    s.user.id,
                    s.user.username,
                    s.user.year ? `${s.user.year} Year` : "N/A",
                    s.category.name,
                    s.subject.code,
                    s.subject.name,
                    s.createdAt.toISOString(),
                ])
            ];
        } else if (type === "category") {
            // Sort by category name, then username
            selections.sort((a, b) => {
                const catA = a.category.name;
                const catB = b.category.name;
                if (catA !== catB) return catA.localeCompare(catB);
                return a.user.username.localeCompare(b.user.username);
            });

            filename = "elective_wise_selections.csv";
            csvRows = [
                ["Elective Category", "Student ID", "Student Username", "Student Department", "Subject Code", "Subject Name", "Selected At"],
                ...selections.map((s: any) => [
                    s.category.name,
                    s.user.id,
                    s.user.username,
                    s.user.department?.code || "N/A",
                    s.subject.code,
                    s.subject.name,
                    s.createdAt.toISOString(),
                ])
            ];
        } else if (type === "subject") {
            // Sort by offering department, then subject code, then username
            selections.sort((a, b) => {
                const offDeptA = a.subject.department?.code || "";
                const offDeptB = b.subject.department?.code || "";
                if (offDeptA !== offDeptB) return offDeptA.localeCompare(offDeptB);

                const subCodeA = a.subject.code;
                const subCodeB = b.subject.code;
                if (subCodeA !== subCodeB) return subCodeA.localeCompare(subCodeB);

                return a.user.username.localeCompare(b.user.username);
            });

            filename = "subject_wise_selections.csv";
            csvRows = [
                ["Offering Department", "Subject Code", "Subject Name", "Student ID", "Student Username", "Student Department", "Category", "Selected At"],
                ...selections.map((s: any) => [
                    s.subject.department?.code || "N/A",
                    s.subject.code,
                    s.subject.name,
                    s.user.id,
                    s.user.username,
                    s.user.department?.code || "N/A",
                    s.category.name,
                    s.createdAt.toISOString(),
                ])
            ];
        } else {
            // Default export: sort by selections created date
            selections.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            csvRows = [
                ["Student ID", "Username", "Branch", "Category", "Subject Code", "Subject Name", "Selected At"],
                ...selections.map((s: any) => [
                    s.user.id,
                    s.user.username,
                    s.user.department?.code || "N/A",
                    s.category.name,
                    s.subject.code,
                    s.subject.name,
                    s.createdAt.toISOString(),
                ]),
            ];
        }

        const csvContent = csvRows.map((e) => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
    }
}
