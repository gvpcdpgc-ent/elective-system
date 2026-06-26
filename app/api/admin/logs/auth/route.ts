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
        const logs = await prisma.authLog.findMany({
            take: 200,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error("Auth logs error:", error);
        return NextResponse.json({ error: "Failed to fetch auth logs" }, { status: 500 });
    }
}
