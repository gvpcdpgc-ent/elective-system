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
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { users: true, subjects: true }
                }
            },
            orderBy: { name: "asc" }
        });
        return NextResponse.json(departments);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, code } = body;

        if (!name || !code) {
            return NextResponse.json({ error: "Name and Code are required" }, { status: 400 });
        }

        const dept = await prisma.department.create({
            data: {
                name: name.trim().toUpperCase(),
                code: code.trim().toUpperCase()
            }
        });

        return NextResponse.json(dept);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "A department with this name or code already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
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
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        await prisma.department.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Department deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, code } = body;

        if (!id || !name || !code) {
            return NextResponse.json({ error: "ID, Name and Code are required" }, { status: 400 });
        }

        const dept = await prisma.department.update({
            where: { id },
            data: {
                name: name.trim().toUpperCase(),
                code: code.trim().toUpperCase()
            }
        });

        return NextResponse.json(dept);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "A department with this name or code already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
    }
}

