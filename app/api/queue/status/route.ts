import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getQueueStatus, checkAccess } from "@/lib/queueService";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const status = await getQueueStatus(session.user.id);
        return NextResponse.json({
            position: status.position,
            activeUsers: status.activeUsers
        });
    } catch (error: any) {
        console.error("Queue status GET route error:", error);
        return NextResponse.json({ error: "Failed to get queue status" }, { status: 500 });
    }
}

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await checkAccess(session.user.id);
        return NextResponse.json({
            allowed: result.allowed,
            position: result.position
        });
    } catch (error: any) {
        console.error("Queue heartbeat POST route error:", error);
        return NextResponse.json({ error: "Failed to check queue access" }, { status: 500 });
    }
}
