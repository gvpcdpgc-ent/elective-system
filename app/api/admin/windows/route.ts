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
        const windows = await prisma.selectionWindow.findMany({
            include: {
                category: {
                    select: { name: true, year: true, semester: true }
                }
            },
            orderBy: { startTime: "asc" }
        });
        return NextResponse.json(windows);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch selection windows" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { categoryId, startTime, endTime } = body;

        if (!categoryId || !startTime || !endTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const window = await prisma.selectionWindow.create({
            data: {
                categoryId,
                startTime: new Date(startTime),
                endTime: new Date(endTime)
            }
        });

        return NextResponse.json(window);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "A selection window already exists for this category." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create selection window" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, startTime, endTime } = body;

        if (!id || !startTime || !endTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const window = await prisma.selectionWindow.update({
            where: { id },
            data: {
                startTime: new Date(startTime),
                endTime: new Date(endTime)
            }
        });

        return NextResponse.json(window);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update selection window" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "Window ID required" }, { status: 400 });
        }

        await prisma.selectionWindow.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Selection window deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete selection window" }, { status: 500 });
    }
}
