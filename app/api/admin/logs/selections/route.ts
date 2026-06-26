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
        const limitParam = 100;

        const selections = await prisma.selection.findMany({
            take: limitParam,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        username: true,
                        year: true,
                        department: { select: { code: true } },
                    },
                },
                subject: { select: { name: true, code: true } },
                category: { select: { name: true } },
            },
        });

        return NextResponse.json(selections);
    } catch (error: any) {
        console.error("Selection logs error:", error);
        return NextResponse.json({ error: "Failed to fetch selection logs" }, { status: 500 });
    }
}
