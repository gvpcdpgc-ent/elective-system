import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { updateMaxConcurrency } from "@/lib/queueService";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findFirst();
    return NextResponse.json(settings || { isStudentLoginEnabled: true, isVirtualQueueEnabled: false, maxConcurrency: 50 });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    console.log("Settings POST Session:", JSON.stringify(session, null, 2));

    if (!session || session.user.role !== "ADMIN") {
        console.log("Settings POST Unauthorized. Role:", session?.user?.role);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        console.log("Settings POST Body:", body);
        const { isStudentLoginEnabled, isVirtualQueueEnabled, maxConcurrency } = body;
        const parsedMaxConcurrency = typeof maxConcurrency === 'number' 
            ? maxConcurrency 
            : parseInt(maxConcurrency || "50", 10);

        // Upsert settings (we only need one row)
        const firstSettings = await prisma.settings.findFirst();

        const settings = await prisma.settings.upsert({
            where: { id: firstSettings?.id || "placeholder" },
            update: {
                isStudentLoginEnabled,
                isVirtualQueueEnabled: isVirtualQueueEnabled ?? false,
                maxConcurrency: parsedMaxConcurrency ?? 50,
            },
            create: {
                isStudentLoginEnabled: isStudentLoginEnabled ?? true,
                isVirtualQueueEnabled: isVirtualQueueEnabled ?? false,
                maxConcurrency: parsedMaxConcurrency ?? 50,
            },
        });

        // Sync to Redis if active
        await updateMaxConcurrency(parsedMaxConcurrency ?? 50);

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("Settings Save Error:", error);
        return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
    }
}

