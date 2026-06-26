import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [activeCleared, queueCleared] = await Promise.all([
            prisma.activeUser.deleteMany({}),
            prisma.waitingQueue.deleteMany({}),
        ]);

        return NextResponse.json({
            message: "Queue reset successfully",
            activeUsersCleared: activeCleared.count,
            queueCleared: queueCleared.count,
        });
    } catch (error: any) {
        console.error("Queue reset error:", error);
        return NextResponse.json({ error: "Failed to reset queue" }, { status: 500 });
    }
}
