import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    console.log("Export API Session:", JSON.stringify(session, null, 2));

    if (!session || session.user.role !== "ADMIN") {
        console.log("Export API Unauthorized. Role:", session?.user?.role);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const selections = await prisma.selection.findMany({
        include: {
            user: true,
            subject: true,
        },
    });

    const csvRows = [
        ["Student ID", "Username", "Branch", "Subject Code", "Subject Name", "Selected At"],
        ...selections.map((s: any) => [
            s.user.id,
            s.user.username,
            s.user.branch || "N/A",
            s.subject.code,
            s.subject.name,
            s.createdAt.toISOString(),
        ]),
    ];

    const csvContent = csvRows.map((e) => e.join(",")).join("\n");

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="selections.csv"',
        },
    });
}
