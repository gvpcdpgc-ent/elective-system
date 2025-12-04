import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        await prisma.$transaction([
            prisma.selection.delete({ where: { userId } }),
            prisma.preference.deleteMany({ where: { userId } })
        ]);

        return NextResponse.json({ message: "Selection removed" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to remove selection" }, { status: 500 });
    }
}
